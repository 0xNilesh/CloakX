module cloakx::pools;

use sui::table;

//
// Witness for init() per Move 2024 conventions
//
public struct POOLS has drop {}

//
// Admin capability object
//
public struct AdminCap has key, store {
    id: UID,
    owner: address,
}

//
// Pool struct (unchanged)
//
public struct Pool has drop, store {
    metadata: vector<u8>,
    active: bool,
    creator: address,
}

//
// Pool registry
//
public struct PoolRegistry has key {
    id: UID,
    // pool_id → Pool
    pools: table::Table<u64, Pool>,
    // pool_id → vector<address>  (CHANGED from vector<UID>)
    pool_users: table::Table<u64, vector<address>>,
    // user → vector<address>     (CHANGED from vector<UID>)
    user_data: table::Table<address, vector<address>>,
    // user → vector<u64>
    user_pools: table::Table<address, vector<u64>>,
    next_pool_id: u64,
}

//
// Initialize registry + admin
//
fun init(_: POOLS, ctx: &mut TxContext) {
    let publisher = tx_context::sender(ctx);

    // admin cap
    let admin = AdminCap {
        id: object::new(ctx),
        owner: publisher,
    };
    transfer::transfer(admin, publisher);

    // registry
    let registry = PoolRegistry {
        id: object::new(ctx),
        pools: table::new(ctx),
        pool_users: table::new(ctx), // now stores vector<address>
        user_data: table::new(ctx), // now stores vector<address>
        user_pools: table::new(ctx),
        next_pool_id: 1,
    };

    transfer::share_object(registry);
}

//
// Create pool — admin only
//
public fun create_pool(
    admin_cap: &AdminCap,
    registry: &mut PoolRegistry,
    metadata: vector<u8>,
    ctx: &mut TxContext,
) {
    let caller = tx_context::sender(ctx);
    assert!(caller == admin_cap.owner, 100);

    let pid = registry.next_pool_id;
    registry.next_pool_id = pid + 1;

    let p = Pool {
        metadata,
        active: true,
        creator: caller,
    };

    table::add(&mut registry.pools, pid, p);

    // initialize empty vector<address>
    table::add(&mut registry.pool_users, pid, vector::empty<address>());
}

//
// Set pool active/inactive
//
public fun set_pool_active(
    admin_cap: &AdminCap,
    registry: &mut PoolRegistry,
    pool_id: u64,
    active: bool,
    ctx: &mut TxContext,
) {
    let caller = tx_context::sender(ctx);
    assert!(caller == admin_cap.owner, 110);

    assert!(table::contains(&registry.pools, pool_id), 111);

    let p = table::borrow_mut(&mut registry.pools, pool_id);
    p.active = active;
}

//
// Query pool exists
//
public fun pool_exists(registry: &PoolRegistry, pool_id: u64): bool {
    table::contains(&registry.pools, pool_id)
}

//
// Get pool
//
public fun get_pool(registry: &PoolRegistry, pool_id: u64): &Pool {
    table::borrow(&registry.pools, pool_id)
}

//
// next id
//
public fun next_pool_id(registry: &PoolRegistry): u64 {
    registry.next_pool_id
}

//
// Borrow tables
//
public fun borrow_pools(registry: &PoolRegistry): &table::Table<u64, Pool> {
    &registry.pools
}

public fun borrow_pool_users(registry: &PoolRegistry): &table::Table<u64, vector<address>> {
    // CHANGED
    &registry.pool_users
}

public fun borrow_user_data(registry: &PoolRegistry): &table::Table<address, vector<address>> {
    // CHANGED
    &registry.user_data
}

public fun borrow_user_pools(registry: &PoolRegistry): &table::Table<address, vector<u64>> {
    &registry.user_pools
}

public fun borrow_mut_pools(registry: &mut PoolRegistry): &mut table::Table<u64, Pool> {
    &mut registry.pools
}

public fun borrow_mut_pool_users(
    registry: &mut PoolRegistry,
): &mut table::Table<u64, vector<address>> {
    // CHANGED
    &mut registry.pool_users
}

public fun borrow_mut_user_data(
    registry: &mut PoolRegistry,
): &mut table::Table<address, vector<address>> {
    // CHANGED
    &mut registry.user_data
}

public fun borrow_mut_user_pools(
    registry: &mut PoolRegistry,
): &mut table::Table<address, vector<u64>> {
    &mut registry.user_pools
}

//
// Check pool active
//
public fun is_pool_active(registry: &PoolRegistry, pool_id: u64): bool {
    let pools_tbl = borrow_pools(registry);
    let p = table::borrow(pools_tbl, pool_id);
    p.active
}

//
// Admin owner accessor for jobs module
//
public fun admin_owner(admin: &AdminCap): address {
    admin.owner
}
