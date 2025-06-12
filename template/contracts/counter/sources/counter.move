module counter_addr::counter {
    use std::signer;
    use std::error;
    use aptos_framework::event;

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;

    /// Counter resource stored under user's account
    struct Counter has key {
        value: u64,
    }

    /// Event emitted when counter is incremented
    #[event]
    struct CounterIncrementEvent has drop, store {
        old_value: u64,
        new_value: u64,
        account: address,
    }

    /// Event emitted when counter is decremented
    #[event]
    struct CounterDecrementEvent has drop, store {
        old_value: u64,
        new_value: u64,
        account: address,
    }

    /// Event emitted when counter is reset
    #[event]
    struct CounterResetEvent has drop, store {
        old_value: u64,
        account: address,
    }

    /// Initialize counter for the signer
    public entry fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        assert!(!exists<Counter>(account_addr), error::already_exists(E_ALREADY_INITIALIZED));
        
        move_to(account, Counter { value: 0 });
    }

    /// Increment the counter by 1
    public entry fun increment(account: &signer) acquires Counter {
        let account_addr = signer::address_of(account);
        assert!(exists<Counter>(account_addr), error::not_found(E_NOT_INITIALIZED));
        
        let counter = borrow_global_mut<Counter>(account_addr);
        let old_value = counter.value;
        counter.value = counter.value + 1;
        
        event::emit(CounterIncrementEvent {
            old_value,
            new_value: counter.value,
            account: account_addr,
        });
    }

    /// Decrement the counter by 1 (minimum value is 0)
    public entry fun decrement(account: &signer) acquires Counter {
        let account_addr = signer::address_of(account);
        assert!(exists<Counter>(account_addr), error::not_found(E_NOT_INITIALIZED));
        
        let counter = borrow_global_mut<Counter>(account_addr);
        let old_value = counter.value;
        
        if (counter.value > 0) {
            counter.value = counter.value - 1;
        };
        
        event::emit(CounterDecrementEvent {
            old_value,
            new_value: counter.value,
            account: account_addr,
        });
    }

    /// Reset the counter to 0
    public entry fun reset(account: &signer) acquires Counter {
        let account_addr = signer::address_of(account);
        assert!(exists<Counter>(account_addr), error::not_found(E_NOT_INITIALIZED));
        
        let counter = borrow_global_mut<Counter>(account_addr);
        let old_value = counter.value;
        counter.value = 0;
        
        event::emit(CounterResetEvent {
            old_value,
            account: account_addr,
        });
    }

    /// Get the current counter value
    #[view]
    public fun get_counter(account_addr: address): u64 acquires Counter {
        assert!(exists<Counter>(account_addr), error::not_found(E_NOT_INITIALIZED));
        borrow_global<Counter>(account_addr).value
    }

    /// Check if counter is initialized for an account
    #[view]
    public fun is_initialized(account_addr: address): bool {
        exists<Counter>(account_addr)
    }
}
