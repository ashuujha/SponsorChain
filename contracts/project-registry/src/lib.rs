#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Project {
    pub owner: Address,
    pub repo_full_name: String,
    pub name: String,
    pub description: String,
    pub total_raised: i128,
    pub sponsor_count: u32,
    pub created_at: u64,
}

#[contracttype]
pub enum RegistryKey {
    Project(u64),
    RepoIndex(String),
    NextId,
    Admin,
    SponsorshipManager,
}

#[contract]
pub struct ProjectRegistry;

#[contractimpl]
impl ProjectRegistry {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&RegistryKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&RegistryKey::Admin, &admin);
        env.storage().instance().set(&RegistryKey::NextId, &0u64);
    }

    pub fn set_sponsorship_manager(env: Env, manager: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&RegistryKey::Admin)
            .expect("not initialized");
        admin.require_auth();

        if env.storage().instance().has(&RegistryKey::SponsorshipManager) {
            panic!("sponsorship manager already set");
        }
        env.storage()
            .instance()
            .set(&RegistryKey::SponsorshipManager, &manager);
    }

    pub fn create_project(
        env: Env,
        owner: Address,
        repo_full_name: String,
        name: String,
        description: String,
    ) -> u64 {
        owner.require_auth();

        let repo_key = RegistryKey::RepoIndex(repo_full_name.clone());
        if env.storage().persistent().has(&repo_key) {
            panic!("repository already listed");
        }

        let next_id: u64 = env
            .storage()
            .instance()
            .get(&RegistryKey::NextId)
            .expect("not initialized");

        let project = Project {
            owner: owner.clone(),
            repo_full_name: repo_full_name.clone(),
            name,
            description,
            total_raised: 0,
            sponsor_count: 0,
            created_at: env.ledger().timestamp(),
        };

        let project_key = RegistryKey::Project(next_id);
        env.storage().persistent().set(&project_key, &project);
        env.storage().persistent().set(&repo_key, &next_id);

        env.storage().instance().set(&RegistryKey::NextId, &(next_id + 1));

        env.events().publish(
            (soroban_sdk::symbol_short!("project"), soroban_sdk::symbol_short!("created")),
            (next_id, owner.clone(), repo_full_name.clone()),
        );

        next_id
    }

    pub fn get_project(env: Env, id: u64) -> Project {
        env.storage()
            .persistent()
            .get(&RegistryKey::Project(id))
            .expect("project not found")
    }

    pub fn list_projects(env: Env, start: u64, limit: u32) -> Vec<u64> {
        let next_id: u64 = env
            .storage()
            .instance()
            .get(&RegistryKey::NextId)
            .expect("not initialized");

        let end = next_id.min(start + (limit as u64));
        let mut ids = Vec::new(&env);
        for id in start..end {
            if env.storage().persistent().has(&RegistryKey::Project(id)) {
                ids.push_back(id);
            }
        }
        ids
    }

    pub fn get_projects_by_owner(env: Env, owner: Address) -> Vec<u64> {
        let next_id: u64 = env
            .storage()
            .instance()
            .get(&RegistryKey::NextId)
            .expect("not initialized");

        let mut ids = Vec::new(&env);
        for id in 0..next_id {
            if let Some(project) = env
                .storage()
                .persistent()
                .get::<RegistryKey, Project>(&RegistryKey::Project(id))
            {
                if project.owner == owner {
                    ids.push_back(id);
                }
            }
        }
        ids
    }

    pub fn update_totals(env: Env, id: u64, amount: i128) {
        let manager: Address = env
            .storage()
            .instance()
            .get(&RegistryKey::SponsorshipManager)
            .expect("sponsorship manager not set");
        manager.require_auth();

        let project_key = RegistryKey::Project(id);
        let mut project: Project = env
            .storage()
            .persistent()
            .get(&project_key)
            .expect("project not found");

        project.total_raised += amount;
        project.sponsor_count += 1;

        env.storage().persistent().set(&project_key, &project);
    }
}

#[cfg(test)]
mod test;
