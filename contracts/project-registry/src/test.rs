#![cfg(test)]
extern crate std;

use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, Env, String};

use crate::{ProjectRegistry, ProjectRegistryClient, ProjectV1, RegistryKey};

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
    assert_eq!(project.repository_owner, String::from_str(&env, "stellar"));
    assert_eq!(
        project.repository_name,
        String::from_str(&env, "js-stellar-sdk")
    );
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
    let duplicate_case_repo = String::from_str(&env, "Stellar/Soroban-Tools");

    client.create_project(
        &owner,
        &repo,
        &String::from_str(&env, "soroban-tools"),
        &String::from_str(&env, "First listing"),
    );

    assert!(client
        .try_create_project(
            &owner,
            &duplicate_case_repo,
            &String::from_str(&env, "soroban-tools-v2"),
            &String::from_str(&env, "Duplicate listing"),
        )
        .is_err());
}

#[test]
fn test_project_metadata_limits_are_enforced() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let client = deploy(&env);
    client.init(&admin);

    let oversized_description = String::from_bytes(&env, &[b'd'; 2_001]);
    assert!(client
        .try_create_project(
            &owner,
            &String::from_str(&env, "stellar/metadata-limits"),
            &String::from_str(&env, "metadata-limits"),
            &oversized_description,
        )
        .is_err());
}

#[test]
fn test_create_project_requires_owner_auth() {
    let env = Env::default();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);

    let client = deploy(&env);
    env.mock_all_auths();
    client.init(&admin);
    env.set_auths(&[]);

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

#[test]
fn test_owner_can_unlist_project() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);

    let client = deploy(&env);
    client.init(&admin);

    let id = client.create_project(
        &owner,
        &String::from_str(&env, "stellar/test-repo"),
        &String::from_str(&env, "Test Repo"),
        &String::from_str(&env, "Description"),
    );

    let project_before = client.get_project(&id);
    assert_eq!(project_before.active, true);

    client.unlist_project(&id, &owner);

    let project_after = client.get_project(&id);
    assert_eq!(project_after.active, false);
}

#[test]
fn test_non_owner_cannot_unlist_project() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let stranger = Address::generate(&env);

    let client = deploy(&env);
    client.init(&admin);

    let id = client.create_project(
        &owner,
        &String::from_str(&env, "stellar/test-repo"),
        &String::from_str(&env, "Test Repo"),
        &String::from_str(&env, "Description"),
    );

    assert!(client.try_unlist_project(&id, &stranger).is_err());

    let project = client.get_project(&id);
    assert_eq!(project.active, true);
}

#[test]
fn test_maintainer_transfer_and_history() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(100);

    let admin = Address::generate(&env);
    let current = Address::generate(&env);
    let next = Address::generate(&env);
    let client = deploy(&env);
    client.init(&admin);
    let id = client.create_project(
        &current,
        &String::from_str(&env, "stellar/transferable"),
        &String::from_str(&env, "transferable"),
        &String::from_str(&env, "Transferable project"),
    );

    env.ledger().set_timestamp(200);
    client.transfer_maintainer(&id, &next);

    let project = client.get_project(&id);
    assert_eq!(project.owner, next);
    let history = client.get_maintainer_history(&id, &0, &10);
    assert_eq!(history.len(), 2);
    assert_eq!(history.get(0).unwrap().maintainer, current);
    assert_eq!(history.get(0).unwrap().timestamp, 100);
    assert_eq!(history.get(1).unwrap().maintainer, next);
    assert_eq!(history.get(1).unwrap().timestamp, 200);
}

#[test]
fn test_invalid_transfer_and_replay_are_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let maintainer = Address::generate(&env);
    let next = Address::generate(&env);
    let client = deploy(&env);
    client.init(&admin);
    let id = client.create_project(
        &maintainer,
        &String::from_str(&env, "stellar/replay"),
        &String::from_str(&env, "replay"),
        &String::from_str(&env, "Replay project"),
    );

    assert!(client.try_transfer_maintainer(&id, &maintainer).is_err());
    client.transfer_maintainer(&id, &next);
    // The current maintainer cannot transfer to itself.
    assert!(client.try_transfer_maintainer(&id, &next).is_err());

    client.unlist_project(&id, &next);
    // Unlisting is a state transition, not deletion, and cannot be replayed.
    assert!(client.try_unlist_project(&id, &next).is_err());
    assert!(!client.get_project(&id).active);
}

#[test]
fn test_unlisting_unknown_project_returns_error() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let caller = Address::generate(&env);
    let client = deploy(&env);
    client.init(&admin);

    assert!(client.try_unlist_project(&99, &caller).is_err());
}

#[test]
fn test_legacy_project_is_read_without_storage_trap() {
    let env = Env::default();
    let owner = Address::generate(&env);
    let contract_id = env.register(ProjectRegistry, ());
    let client = ProjectRegistryClient::new(&env, &contract_id);

    env.as_contract(&contract_id, || {
        env.storage().persistent().set(
            &RegistryKey::Project(7),
            &ProjectV1 {
                owner: owner.clone(),
                repo_full_name: String::from_str(&env, "stellar/legacy"),
                name: String::from_str(&env, "legacy"),
                description: String::from_str(&env, "legacy project"),
                total_raised: 42,
                sponsor_count: 3,
                created_at: 100,
                active: true,
            },
        );
    });

    let project = client.get_project(&7);
    assert_eq!(project.total_raised, 42);
    assert_eq!(project.total_donations, 3);
    assert_eq!(project.last_sponsored_at, 0);
    assert!(project.active);
}
