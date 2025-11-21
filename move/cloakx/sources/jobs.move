#[allow(lint(self_transfer))]
module cloakx::jobs;

use cloakx::pools::{
    PoolRegistry,
    pool_exists,
    is_pool_active,
    borrow_pool_users,
    AdminCap,
    admin_owner
};

use enclave::enclave::{Self as enclave, Enclave};
use sui::coin::{Self as coin, Coin};
use sui::event;
use sui::sui::SUI;
use sui::table;

// Enclave / intents / errors
const PROCESS_DATA_INTENT: u8 = 1;
const EInvalidSignature: u64 = 900;

public struct JOBS has drop {}

///
/// Enclave side:
/// MLTrainingResponse {
///   model_blob_id,
///   accuracy,
///   final_loss: (final_loss * 10000.0) as u64,
///   num_samples: all_x_data.len() as u64,
///   model_hash: model.get_weights_hash(),
/// }
public struct MLTrainingResponse has copy, drop {
    model_blob_id: vector<u8>,
    accuracy: u64,
    final_loss: u64,
    num_samples: u64,
    model_hash: vector<u8>,
}

// EVENTS
public struct JobCreated has copy, drop {
    job_id: u64,
    creator: address,
    pool_id: u64,
    price: u64,
}

public struct JobCompleted has copy, drop {
    job_id: u64,
    model_blob_id: vector<u8>,
    accuracy: u64,
    final_loss: u64,
    num_samples: u64,
    model_hash: vector<u8>,
}

// Job status and Job struct (escrow inside Job)
public enum JobStatus has copy, drop, store {
    Pending,
    Cancelled,
    Completed,
}

#[allow(lint(coin_field))]
public struct Job has key, store {
    id: UID,
    creator: address,
    pool_id: u64,
    model_wid: vector<u8>,
    price: u64,
    escrow: Coin<SUI>, // SUI coin escrow
    status: JobStatus,
}

// Job Registry (jobs + indices + per-job payouts mapping)
public struct JobRegistry has key {
    id: UID,
    jobs: table::Table<u64, Job>,
    jobs_by_creator: table::Table<address, vector<u64>>,
    jobs_by_status: table::Table<u64, vector<u64>>, // 0=pending,1=cancelled,2=completed
    // payouts: job_id -> (table of user -> amount)
    payouts: table::Table<u64, table::Table<address, u64>>,
    job_results: table::Table<u64, vector<u8>>,
    next_job_id: u64,
}

// Init registry
fun init(otw: JOBS, ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);

    let cap = enclave::new_cap(otw, ctx);

    cap.create_enclave_config(
        b"cloakx_enclave".to_string(),
        x"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", // pcr0
        x"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", // pcr1
        x"000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", // pcr2
        ctx,
    );

    transfer::public_transfer(cap, sender);

    let mut reg = JobRegistry {
        id: object::new(ctx),
        jobs: table::new(ctx),
        jobs_by_creator: table::new(ctx),
        jobs_by_status: table::new(ctx),
        payouts: table::new(ctx),
        job_results: table::new(ctx),
        next_job_id: 1u64,
    };

    table::add(&mut reg.jobs_by_status, 0u64, vector::empty<u64>());
    table::add(&mut reg.jobs_by_status, 1u64, vector::empty<u64>());
    table::add(&mut reg.jobs_by_status, 2u64, vector::empty<u64>());

    transfer::transfer(reg, sender);
}

// CREATE JOB
// Pass a Coin<SUI> `payment` by-value. We require `paid >= price`. If extra, return remainder immediately.
public fun create_job(
    reg: &mut JobRegistry,
    pools: &PoolRegistry,
    mut payment: Coin<SUI>,
    model_wid: vector<u8>,
    pool_id: u64,
    price: u64,
    ctx: &mut TxContext,
) {
    let creator = tx_context::sender(ctx);

    assert!(pool_exists(pools, pool_id), 201);
    assert!(is_pool_active(pools, pool_id), 202);

    let paid = coin::value(&payment);
    assert!(paid >= price, 203);

    // return extra immediately if overpaid
    if (paid > price) {
        let extra = paid - price;
        let extra_coin = coin::split(&mut payment, extra, ctx);
        transfer::public_transfer(extra_coin, creator);
    };

    let job_id = reg.next_job_id;
    reg.next_job_id = job_id + 1;

    let job = Job {
        id: object::new(ctx),
        creator,
        pool_id,
        model_wid,
        price,
        escrow: payment, // remaining coin equals `price`
        status: JobStatus::Pending,
    };

    table::add(&mut reg.jobs, job_id, job);

    // index by creator
    if (!table::contains(&reg.jobs_by_creator, creator)) {
        table::add(&mut reg.jobs_by_creator, creator, vector::empty<u64>());
    };
    let creator_vec = table::borrow_mut(&mut reg.jobs_by_creator, creator);
    vector::push_back(creator_vec, job_id);

    // add to pending status bucket
    let pending_list = table::borrow_mut(&mut reg.jobs_by_status, 0u64);
    vector::push_back(pending_list, job_id);

    // emit event
    event::emit(JobCreated {
        job_id,
        creator,
        pool_id,
        price,
    });
}

// CANCEL JOB — creator only, refunds escrow
public fun cancel_job(reg: &mut JobRegistry, job_id: u64, ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);

    assert!(table::contains(&reg.jobs, job_id), 210);

    // take job out of table to be able to move escrow coin out safely
    let job = table::remove(&mut reg.jobs, job_id);
    let Job {
        id,
        creator,
        pool_id: _pool_id,
        model_wid: _model_wid,
        price: _price,
        status,
        escrow,
    } = job;

    // delete the uid explicitly
    id.delete();

    // checks
    assert!(status == JobStatus::Pending, 211);
    assert!(creator == sender, 212);

    // refund
    transfer::public_transfer(escrow, sender);

    // update indices: remove from creator vector and move status -> cancelled bucket
    move_status_after_removal(reg, job_id, 0u64, 1u64, creator);
}

// COMPLETE JOB (admin + enclave signature)
// - verify enclave signature over MLTrainingResponse
// - compute per-user payout and record in per-job payouts table (no transfers here)
public fun complete_job<E: drop>(
    admin_cap: &AdminCap,
    reg: &mut JobRegistry,
    pools: &PoolRegistry,
    encl: &Enclave<E>,
    timestamp_ms: u64,
    response: MLTrainingResponse,
    signature: &vector<u8>,
    job_id: u64,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);

    // admin-only
    assert!(sender == admin_owner(admin_cap), 999);

    assert!(table::contains(&reg.jobs, job_id), 220);

    // borrow job mutably
    let job_ref = table::borrow_mut(&mut reg.jobs, job_id);
    assert!(job_ref.status == JobStatus::Pending, 221);

    // enclave signature verification
    let ok = encl.verify_signature(
        PROCESS_DATA_INTENT,
        timestamp_ms,
        response,
        signature,
    );
    assert!(ok, EInvalidSignature);

    // get pool users (ASSUMES borrow_pool_users returns &Table<u64, vector<address>>)
    let pool_users_tbl = borrow_pool_users(pools);
    let users_ref = table::borrow(pool_users_tbl, job_ref.pool_id);
    let n = vector::length(users_ref);
    assert!(n > 0, 224);

    // compute per-user payout (integer division)
    let per_user = job_ref.price / n;

    // create per-job payouts inner table if missing
    if (!table::contains(&reg.payouts, job_id)) {
        let inner = table::new(ctx);
        table::add(&mut reg.payouts, job_id, inner);
    };
    let inner_tbl = table::borrow_mut(&mut reg.payouts, job_id);

    // record payout per user
    let mut i = 0u64;
    while (i < n) {
        let user_addr = *vector::borrow(users_ref, i);

        if (!table::contains(inner_tbl, user_addr)) {
            table::add(inner_tbl, user_addr, per_user);
        } else {
            let v = table::borrow_mut(inner_tbl, user_addr);
            *v = *v + per_user;
        };

        i = i + 1;
    };

    // store result id (Walrus model blob id)
    table::add(&mut reg.job_results, job_id, response.model_blob_id);

    // mark completed and move status bucket
    job_ref.status = JobStatus::Completed;
    move_status(reg, job_id, 0u64, 2u64);

    // emit completion event
    event::emit(JobCompleted {
        job_id,
        model_blob_id: response.model_blob_id,
        accuracy: response.accuracy,
        final_loss: response.final_loss,
        num_samples: response.num_samples,
        model_hash: response.model_hash,
    });
}

// Claim reward: user claims their recorded payout for a job.
// Splits from job.escrow and public_transfer to claimer.
public fun claim_reward(reg: &mut JobRegistry, job_id: u64, ctx: &mut TxContext) {
    let claimer = tx_context::sender(ctx);

    // job must exist and be completed
    assert!(table::contains(&reg.jobs, job_id), 300);
    let job_ref = table::borrow_mut(&mut reg.jobs, job_id);
    assert!(job_ref.status == JobStatus::Completed, 301);

    // ensure inner payouts table exists and has amount
    assert!(table::contains(&reg.payouts, job_id), 302);
    let inner = table::borrow_mut(&mut reg.payouts, job_id);
    assert!(table::contains(inner, claimer), 303);

    // remove amount entry
    let amount = table::remove(inner, claimer);
    assert!(amount > 0, 304);

    // ensure escrow has enough
    let available = coin::value(&job_ref.escrow);
    assert!(available >= amount, 305);

    // split and transfer (split requires ctx)
    let pay_coin = coin::split(&mut job_ref.escrow, amount, ctx);
    transfer::public_transfer(pay_coin, claimer);
}

// INTERNAL helpers
fun move_status(reg: &mut JobRegistry, job_id: u64, from: u64, to: u64) {
    let src = table::borrow_mut(&mut reg.jobs_by_status, from);

    let len = vector::length(src);
    let mut i = 0u64;
    while (i < len) {
        if (*vector::borrow(src, i) == job_id) {
            vector::swap_remove(src, i);
            break
        };
        i = i + 1;
    };

    let dst = table::borrow_mut(&mut reg.jobs_by_status, to);
    vector::push_back(dst, job_id);
}

// invoked when we removed the job object (cancel path) — updates indices
fun move_status_after_removal(
    reg: &mut JobRegistry,
    job_id: u64,
    from: u64,
    to: u64,
    creator: address,
) {
    // remove from jobs_by_creator[creator]
    if (table::contains(&reg.jobs_by_creator, creator)) {
        let cv = table::borrow_mut(&mut reg.jobs_by_creator, creator);
        let len = vector::length(cv);
        let mut i = 0u64;
        while (i < len) {
            if (*vector::borrow(cv, i) == job_id) {
                vector::swap_remove(cv, i);
                break
            };
            i = i + 1;
        };
    };

    // remove from source status
    let src = table::borrow_mut(&mut reg.jobs_by_status, from);
    let len = vector::length(src);
    let mut j = 0u64;
    while (j < len) {
        if (*vector::borrow(src, j) == job_id) {
            vector::swap_remove(src, j);
            break
        };
        j = j + 1;
    };

    let dst = table::borrow_mut(&mut reg.jobs_by_status, to);
    vector::push_back(dst, job_id);
}

// GETTERS
public fun get_job(reg: &JobRegistry, id: u64): &Job {
    table::borrow(&reg.jobs, id)
}

public fun get_jobs_by_creator(reg: &JobRegistry, user: address): &vector<u64> {
    table::borrow(&reg.jobs_by_creator, user)
}

public fun get_jobs_by_status(reg: &JobRegistry, status: u64): &vector<u64> {
    table::borrow(&reg.jobs_by_status, status)
}

public fun get_job_result(reg: &JobRegistry, job_id: u64): &vector<u8> {
    table::borrow(&reg.job_results, job_id)
}
