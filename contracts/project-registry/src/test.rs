#![cfg(test)]
extern crate std;

use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, Env, String};

use crate::{ProjectRegistry, ProjectRegistryClient};

fn deploy(env: &Env) -> ProjectRegistryClient<'_> {
    ProjectRegistryClient::new(env, &env.register(ProjectRegistry, ()))
}

#[test]
fn test_create_project_succeeds_and_retrievable() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1700000000);

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);

    let client = deploy(&env);
    client.init(&admin);

    let id = client.create_project(
        &owner,
        &String::from_str(&env, "stellar/js-stellar-sdk"),
        &String::from_str(&env, "js-stellar-sdk"),
        &String::from_str(&env, "JavaScript library for Stellar"),
    );

    let project = client.get_project(&id);
    assert_eq!(project.owner, owner);
    assert_eq!(
        project.repo_full_name,
        String::from_str(&env, "stellar/js-stellar-sdk")
    );
    assert_eq!(project.total_raised, 0);
    assert_eq!(project.sponsor_count, 0);
    assert!(project.created_at > 0);
}

#[test]
fn test_duplicate_repo_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);

    let client = deploy(&env);
    client.init(&admin);

    let repo = String::from_str(&env, "stellar/soroban-tools");

    client.create_project(
        &owner,
        &repo,
        &String::from_str(&env, "soroban-tools"),
        &String::from_str(&env, "First listing"),
    );

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.create_project(
            &owner,
            &repo,
            &String::from_str(&env, "soroban-tools-v2"),
            &String::from_str(&env, "Duplicate listing"),
        );
    }));

    assert!(result.is_err());
}

#[test]
fn test_create_project_requires_owner_auth() {
    let env = Env::default();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);

    let client = deploy(&env);
    client.init(&admin);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.create_project(
            &owner,
            &String::from_str(&env, "stellar/test"),
            &String::from_str(&env, "test"),
            &String::from_str(&env, "No auth call"),
        );
    }));

    assert!(result.is_err());
}

#[test]
fn test_update_totals_requires_sponsorship_manager() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);

    let client = deploy(&env);
    client.init(&admin);

    let id = client.create_project(
        &owner,
        &String::from_str(&env, "stellar/test"),
        &String::from_str(&env, "test"),
        &String::from_str(&env, "Test project"),
    );

    // update_totals without set_sponsorship_manager — must fail
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.update_totals(&id, &100);
    }));
    assert!(result.is_err());

    // Verify project unchanged
    let project = client.get_project(&id);
    assert_eq!(project.total_raised, 0);
    assert_eq!(project.sponsor_count, 0);
}

#[test]
fn test_list_and_query_projects() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner_a = Address::generate(&env);
    let owner_b = Address::generate(&env);

    let client = deploy(&env);
    client.init(&admin);

    let id_a = client.create_project(
        &owner_a,
        &String::from_str(&env, "stellar/project-a"),
        &String::from_str(&env, "Project A"),
        &String::from_str(&env, "Description A"),
    );
    let id_b = client.create_project(
        &owner_b,
        &String::from_str(&env, "stellar/project-b"),
        &String::from_str(&env, "Project B"),
        &String::from_str(&env, "Description B"),
    );

    let all = client.list_projects(&0, &10);
    assert_eq!(all.len(), 2);

    let a_only = client.get_projects_by_owner(&owner_a);
    assert_eq!(a_only.len(), 1);
    assert_eq!(a_only.get(0).unwrap(), id_a);

    let b_only = client.get_projects_by_owner(&owner_b);
    assert_eq!(b_only.len(), 1);
    assert_eq!(b_only.get(0).unwrap(), id_b);
}

#[test]
fn test_init_idempotent_protection() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let client = deploy(&env);
    client.init(&admin);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.init(&admin);
    }));
    assert!(result.is_err());
}

#[test]
fn test_set_sponsorship_manager_once_only() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let client = deploy(&env);
    client.init(&admin);

    let manager1 = Address::generate(&env);
    let manager2 = Address::generate(&env);

    client.set_sponsorship_manager(&manager1);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.set_sponsorship_manager(&manager2);
    }));
    assert!(result.is_err());
}
