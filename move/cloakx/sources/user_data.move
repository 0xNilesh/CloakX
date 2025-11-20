module cloakx::user_data;

use cloakx::pools::{
    PoolRegistry,
    pool_exists,
    is_pool_active,
    borrow_mut_pool_users,
    borrow_mut_user_data,
    borrow_mut_user_pools,
    borrow_user_data,
    borrow_pool_users,
    borrow_user_pools
};
use sui::table;

//
// UserData object stored under user's address
//
public struct UserData has key, store {
    id: UID,
    owner: address,
    pool_id: u64,
    walrus_id: vector<u8>,
}

//
// Check if a pool_id exists inside vector<u64>
//
fun vec_u64_contains(v: &vector<u64>, x: u64): bool {
    let n = vector::length(v);
    let mut i = 0;

    while (i < n) {
        let val = *vector::borrow(v, i);
        if (val == x) return true;
        i = i + 1;
    };

    false
}

//
// Register user data for a pool
//
#[allow(lint(self_transfer))]
public fun register_user_data(
    registry: &mut PoolRegistry,
    pool_id: u64,
    walrus_id: vector<u8>,
    ctx: &mut TxContext,
) {
    let caller = tx_context::sender(ctx);

    // Must be valid pool
    assert!(pool_exists(registry, pool_id), 101);
    assert!(is_pool_active(registry, pool_id), 102);

    //
    // Create the UserData object
    //
    let uid = object::new(ctx);
    let ud = UserData {
        id: uid,
        owner: caller,
        pool_id,
        walrus_id,
    };
    transfer::transfer(ud, caller);

    //
    // Add caller to pool_users[pool_id]
    //
    let pool_users_tbl = borrow_mut_pool_users(registry);

    if (!table::contains(pool_users_tbl, pool_id)) {
        table::add(pool_users_tbl, pool_id, vector::empty<address>());
    };

    let pv_ref = table::borrow_mut(pool_users_tbl, pool_id);
    vector::push_back(pv_ref, caller);

    //
    // Add caller to user_data[caller]
    //
    let user_data_tbl = borrow_mut_user_data(registry);

    if (!table::contains(user_data_tbl, caller)) {
        table::add(user_data_tbl, caller, vector::empty<address>());
    };

    let uv_ref = table::borrow_mut(user_data_tbl, caller);
    vector::push_back(uv_ref, caller);

    //
    // Add pool_id to user_pools[caller]
    //
    let user_pools_tbl = borrow_mut_user_pools(registry);

    if (!table::contains(user_pools_tbl, caller)) {
        table::add(user_pools_tbl, caller, vector::empty<u64>());
    };

    let up_ref = table::borrow_mut(user_pools_tbl, caller);

    if (!vec_u64_contains(up_ref, pool_id)) {
        vector::push_back(up_ref, pool_id);
    };
}

//
// GETTERS
//

public fun get_user_data(user: address, registry: &PoolRegistry): &vector<address> {
    let tbl = borrow_user_data(registry);
    table::borrow(tbl, user)
}

public fun get_pool_users(pool_id: u64, registry: &PoolRegistry): &vector<address> {
    let tbl = borrow_pool_users(registry);
    table::borrow(tbl, pool_id)
}

public fun get_user_pools(user: address, registry: &PoolRegistry): &vector<u64> {
    let tbl = borrow_user_pools(registry);
    table::borrow(tbl, user)
}
