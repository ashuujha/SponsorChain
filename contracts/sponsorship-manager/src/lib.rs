#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Vec};

mod project_registry {
    soroban_sdk::contractimport!(
        file = "../target/wasm32v1-none/release/project_registry.wasm"
    );
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Sponsorship {
    pub sponsor: Address,
    pub project_id: u64,
    pub amount: i128,
    pub timestamp: u64,
}

#[contracttype]
pub enum ManagerKey {
    Sponsorship(u64),
    NextId,
    Admin,
    ProjectRegistry,
    XlmSac,
}

#[contract]
pub struct SponsorshipManager;

#[contractimpl]
impl SponsorshipManager {
    pub fn init(env: Env, admin: Address, project_registry: Address, xlm_sac: Address) {
        if env.storage().instance().has(&ManagerKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&ManagerKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&ManagerKey::ProjectRegistry, &project_registry);
        env.storage().instance().set(&ManagerKey::XlmSac, &xlm_sac);
        env.storage().instance().set(&ManagerKey::NextId, &0u64);
    }

    pub fn sponsor(env: Env, sponsor: Address, project_id: u64, amount: i128) -> u64 {
        sponsor.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let registry_addr: Address = env
            .storage()
            .instance()
            .get(&ManagerKey::ProjectRegistry)
            .expect("not initialized");

        let xlm_sac_addr: Address = env
            .storage()
            .instance()
            .get(&ManagerKey::XlmSac)
            .expect("not initialized");

        let project = project_registry::Client::new(&env, &registry_addr)
            .get_project(&project_id);

        let owner = project.owner;

        let sac_client = token::Client::new(&env, &xlm_sac_addr);
        sac_client.transfer(&sponsor, &owner, &amount);

        let next_id: u64 = env
            .storage()
            .instance()
            .get(&ManagerKey::NextId)
            .expect("not initialized");

        let sponsorship = Sponsorship {
            sponsor: sponsor.clone(),
            project_id,
            amount,
            timestamp: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&ManagerKey::Sponsorship(next_id), &sponsorship);

        env.storage()
            .instance()
            .set(&ManagerKey::NextId, &(next_id + 1));

        project_registry::Client::new(&env, &registry_addr)
            .update_totals(&project_id, &amount);

        next_id
    }

    pub fn get_sponsorship(env: Env, id: u64) -> Sponsorship {
        env.storage()
            .persistent()
            .get(&ManagerKey::Sponsorship(id))
            .expect("sponsorship not found")
    }

    pub fn get_sponsorships_for_project(env: Env, project_id: u64) -> Vec<u64> {
        let next_id: u64 = env
            .storage()
            .instance()
            .get(&ManagerKey::NextId)
            .expect("not initialized");

        let mut ids = Vec::new(&env);
        for id in 0..next_id {
            if let Some(sp) = env
                .storage()
                .persistent()
                .get::<ManagerKey, Sponsorship>(&ManagerKey::Sponsorship(id))
            {
                if sp.project_id == project_id {
                    ids.push_back(id);
                }
            }
        }
        ids
    }

    pub fn get_sponsorships_by_sponsor(env: Env, sponsor: Address) -> Vec<u64> {
        let next_id: u64 = env
            .storage()
            .instance()
            .get(&ManagerKey::NextId)
            .expect("not initialized");

        let mut ids = Vec::new(&env);
        for id in 0..next_id {
            if let Some(sp) = env
                .storage()
                .persistent()
                .get::<ManagerKey, Sponsorship>(&ManagerKey::Sponsorship(id))
            {
                if sp.sponsor == sponsor {
                    ids.push_back(id);
                }
            }
        }
        ids
    }
}

#[cfg(test)]
mod test;
