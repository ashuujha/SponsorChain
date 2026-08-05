#![no_std]
#![allow(deprecated)]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, Address, Env, String,
    Vec,
};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct ProjectV1 {
    pub owner: Address,
    pub repo_full_name: String,
    pub name: String,
    pub description: String,
    pub total_raised: i128,
    pub sponsor_count: u32,
    pub created_at: u64,
    pub active: bool,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct ProjectV2 {
    pub owner: Address,
    pub repo_full_name: String,
    pub name: String,
    pub description: String,
    pub total_raised: i128,
    /// Number of distinct sponsor addresses for this project.
    pub sponsor_count: u32,
    /// Number of successful donations, including repeat donations.
    pub total_donations: u64,
    pub created_at: u64,
    pub last_sponsored_at: u64,
    pub active: bool,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Project {
    pub owner: Address,
    pub repo_full_name: String,
    pub repository_owner: String,
    pub repository_name: String,
    pub name: String,
    pub description: String,
    pub total_raised: i128,
    /// Number of distinct sponsor addresses for this project.
    pub sponsor_count: u32,
    /// Number of successful donations, including repeat donations.
    pub total_donations: u64,
    pub created_at: u64,
    pub last_sponsored_at: u64,
    pub active: bool,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct MaintainerRecord {
    pub maintainer: Address,
    pub timestamp: u64,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ProjectRegistryError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    RepositoryAlreadyRegistered = 3,
    InvalidRepository = 4,
    ProjectNotFound = 5,
    ProjectInactive = 6,
    UnauthorizedMaintainer = 7,
    InvalidMaintainerTransfer = 8,
    SponsorshipManagerNotSet = 9,
    UnauthorizedSponsorshipManager = 10,
    SponsorshipManagerAlreadySet = 11,
    InvalidSponsorshipAmount = 12,
    UnsupportedProjectVersion = 13,
    InvalidProjectMetadata = 14,
    CounterOverflow = 15,
}

#[contracttype]
pub enum RegistryKey {
    // Keep the original variants in the original order for deployed state.
    Project(u64),
    RepoIndex(String),
    NextId,
    Admin,
    SponsorshipManager,
    ProjectVersion(u64),
    ProjectSponsor(u64, Address),
    ProjectSponsorCount(u64),
    ProjectSponsorAt(u64, u64),
    MaintainerHistory(u64, u64),
    MaintainerHistoryCount(u64),
}

const CURRENT_PROJECT_VERSION: u32 = 3;
const MAX_PAGE_SIZE: u32 = 100;
// Persistent entries are archival and must be periodically bumped. A 30-day
// bump on writes and canonical reads keeps active history live while allowing
// anyone to restore genuinely inactive entries through Soroban archival tools.
const PERSISTENT_TTL_THRESHOLD: u32 = 450_000;
const PERSISTENT_TTL_BUMP: u32 = 535_679;

#[contract]
pub struct ProjectRegistry;

#[contractimpl]
impl ProjectRegistry {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&RegistryKey::Admin) {
            panic_with_error!(&env, ProjectRegistryError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&RegistryKey::Admin, &admin);
        env.storage().instance().set(&RegistryKey::NextId, &0u64);
    }

    pub fn set_sponsorship_manager(env: Env, manager: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&RegistryKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, ProjectRegistryError::NotInitialized));
        admin.require_auth();

        if env
            .storage()
            .instance()
            .has(&RegistryKey::SponsorshipManager)
        {
            panic_with_error!(&env, ProjectRegistryError::SponsorshipManagerAlreadySet);
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

        if name.len() == 0 || name.len() > 128 || description.len() > 2_000 {
            panic_with_error!(&env, ProjectRegistryError::InvalidProjectMetadata);
        }

        let (repository_owner, repository_name) = Self::split_repository(&env, &repo_full_name);
        let canonical_repository = Self::normalize_repository(&env, &repo_full_name);

        let repo_key = RegistryKey::RepoIndex(repo_full_name.clone());
        let canonical_repo_key = RegistryKey::RepoIndex(canonical_repository.clone());
        if env.storage().persistent().has(&repo_key)
            || env.storage().persistent().has(&canonical_repo_key)
        {
            panic_with_error!(&env, ProjectRegistryError::RepositoryAlreadyRegistered);
        }

        let next_id: u64 = env
            .storage()
            .instance()
            .get(&RegistryKey::NextId)
            .unwrap_or_else(|| panic_with_error!(&env, ProjectRegistryError::NotInitialized));

        let project = Project {
            owner: owner.clone(),
            repo_full_name: repo_full_name.clone(),
            repository_owner,
            repository_name,
            name,
            description,
            total_raised: 0,
            sponsor_count: 0,
            total_donations: 0,
            created_at: env.ledger().timestamp(),
            last_sponsored_at: 0,
            active: true,
        };

        env.storage()
            .persistent()
            .set(&RegistryKey::Project(next_id), &project);
        Self::bump_persistent(&env, &RegistryKey::Project(next_id));
        env.storage().persistent().set(
            &RegistryKey::ProjectVersion(next_id),
            &CURRENT_PROJECT_VERSION,
        );
        Self::bump_persistent(&env, &RegistryKey::ProjectVersion(next_id));
        env.storage().persistent().set(&repo_key, &next_id);
        Self::bump_persistent(&env, &repo_key);
        if canonical_repository != repo_full_name {
            env.storage()
                .persistent()
                .set(&canonical_repo_key, &next_id);
            Self::bump_persistent(&env, &canonical_repo_key);
        }
        let maintainer_history_key = RegistryKey::MaintainerHistory(next_id, 0);
        env.storage().persistent().set(
            &maintainer_history_key,
            &MaintainerRecord {
                maintainer: owner.clone(),
                timestamp: env.ledger().timestamp(),
            },
        );
        Self::bump_persistent(&env, &maintainer_history_key);
        let maintainer_history_count_key = RegistryKey::MaintainerHistoryCount(next_id);
        env.storage()
            .persistent()
            .set(&maintainer_history_count_key, &1u64);
        Self::bump_persistent(&env, &maintainer_history_count_key);
        env.storage().instance().set(
            &RegistryKey::NextId,
            &next_id
                .checked_add(1)
                .unwrap_or_else(|| panic_with_error!(&env, ProjectRegistryError::CounterOverflow)),
        );

        env.events().publish(
            (
                soroban_sdk::symbol_short!("project"),
                soroban_sdk::symbol_short!("created"),
            ),
            (next_id, owner.clone(), repo_full_name.clone()),
        );

        next_id
    }

    pub fn unlist_project(env: Env, id: u64, caller: Address) {
        Self::ensure_project_exists(&env, id);
        let mut project = Self::load_project(&env, id);
        if !project.active {
            panic_with_error!(&env, ProjectRegistryError::ProjectInactive);
        }
        if caller != project.owner {
            panic_with_error!(&env, ProjectRegistryError::UnauthorizedMaintainer);
        }
        project.owner.require_auth();

        project.active = false;
        Self::store_project(&env, id, &project);

        env.events().publish(
            (
                soroban_sdk::symbol_short!("project"),
                soroban_sdk::symbol_short!("unlisted"),
            ),
            (id, caller),
        );
    }

    /// Transfers the maintainer authority without deleting the project.
    /// Only the currently registered maintainer can authorize this call.
    pub fn transfer_maintainer(env: Env, id: u64, new_address: Address) {
        Self::ensure_project_exists(&env, id);
        let mut project = Self::load_project(&env, id);
        if !project.active {
            panic_with_error!(&env, ProjectRegistryError::ProjectInactive);
        }
        if project.owner == new_address {
            panic_with_error!(&env, ProjectRegistryError::InvalidMaintainerTransfer);
        }

        project.owner.require_auth();
        let previous = project.owner.clone();
        project.owner = new_address.clone();
        Self::store_project(&env, id, &project);

        let count_key = RegistryKey::MaintainerHistoryCount(id);
        let count: u64 = env.storage().persistent().get(&count_key).unwrap_or(0);
        let history_key = RegistryKey::MaintainerHistory(id, count);
        env.storage().persistent().set(
            &history_key,
            &MaintainerRecord {
                maintainer: new_address.clone(),
                timestamp: env.ledger().timestamp(),
            },
        );
        Self::bump_persistent(&env, &history_key);
        env.storage().persistent().set(
            &count_key,
            &count
                .checked_add(1)
                .unwrap_or_else(|| panic_with_error!(&env, ProjectRegistryError::CounterOverflow)),
        );
        Self::bump_persistent(&env, &count_key);

        env.events().publish(
            (
                soroban_sdk::symbol_short!("project"),
                soroban_sdk::symbol_short!("transfer"),
            ),
            (id, previous, new_address),
        );
    }

    pub fn get_project(env: Env, id: u64) -> Project {
        Self::ensure_project_exists(&env, id);
        Self::load_project(&env, id)
    }

    pub fn list_projects(env: Env, start: u64, limit: u32) -> Vec<u64> {
        let next_id: u64 = env
            .storage()
            .instance()
            .get(&RegistryKey::NextId)
            .unwrap_or_else(|| panic_with_error!(&env, ProjectRegistryError::NotInitialized));

        let page_limit = limit.min(MAX_PAGE_SIZE) as u64;
        let end = next_id.min(start.saturating_add(page_limit));
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
            .unwrap_or_else(|| panic_with_error!(&env, ProjectRegistryError::NotInitialized));

        let mut ids = Vec::new(&env);
        for id in 0..next_id {
            if env.storage().persistent().has(&RegistryKey::Project(id)) {
                let project = Self::load_project(&env, id);
                if project.owner == owner {
                    ids.push_back(id);
                }
            }
        }
        ids
    }

    /// Records a successful donation. Only the configured sponsorship manager
    /// may call this entrypoint.
    pub fn record_sponsorship(env: Env, id: u64, sponsor: Address, amount: i128, timestamp: u64) {
        if amount <= 0 {
            panic_with_error!(&env, ProjectRegistryError::InvalidSponsorshipAmount);
        }
        let mut project = Self::load_project(&env, id);
        if !project.active {
            panic_with_error!(&env, ProjectRegistryError::ProjectInactive);
        }
        let manager: Address = env
            .storage()
            .instance()
            .get(&RegistryKey::SponsorshipManager)
            .unwrap_or_else(|| {
                panic_with_error!(&env, ProjectRegistryError::SponsorshipManagerNotSet)
            });
        manager.require_auth();

        let sponsor_key = RegistryKey::ProjectSponsor(id, sponsor.clone());
        let is_new_sponsor = !env.storage().persistent().has(&sponsor_key);
        if is_new_sponsor {
            env.storage().persistent().set(&sponsor_key, &true);
            Self::bump_persistent(&env, &sponsor_key);
            let sponsor_count: u64 = env
                .storage()
                .persistent()
                .get(&RegistryKey::ProjectSponsorCount(id))
                .unwrap_or(0);
            env.storage()
                .persistent()
                .set(&RegistryKey::ProjectSponsorAt(id, sponsor_count), &sponsor);
            Self::bump_persistent(&env, &RegistryKey::ProjectSponsorAt(id, sponsor_count));
            let next_sponsor_count = sponsor_count
                .checked_add(1)
                .unwrap_or_else(|| panic_with_error!(&env, ProjectRegistryError::CounterOverflow));
            env.storage()
                .persistent()
                .set(&RegistryKey::ProjectSponsorCount(id), &next_sponsor_count);
            Self::bump_persistent(&env, &RegistryKey::ProjectSponsorCount(id));
        }

        project.total_raised = project
            .total_raised
            .checked_add(amount)
            .unwrap_or_else(|| panic_with_error!(&env, ProjectRegistryError::CounterOverflow));
        project.total_donations = project
            .total_donations
            .checked_add(1)
            .unwrap_or_else(|| panic_with_error!(&env, ProjectRegistryError::CounterOverflow));
        project.last_sponsored_at = timestamp;
        if is_new_sponsor {
            project.sponsor_count = project
                .sponsor_count
                .checked_add(1)
                .unwrap_or_else(|| panic_with_error!(&env, ProjectRegistryError::CounterOverflow));
        }
        Self::store_project(&env, id, &project);
    }

    /// Returns a bounded page of distinct sponsor addresses for a project.
    pub fn get_project_sponsors(env: Env, id: u64, start: u64, limit: u32) -> Vec<Address> {
        Self::ensure_project_exists(&env, id);
        let count: u64 = env
            .storage()
            .persistent()
            .get(&RegistryKey::ProjectSponsorCount(id))
            .unwrap_or(0);
        let page_limit = limit.min(MAX_PAGE_SIZE) as u64;
        let end = count.min(start.saturating_add(page_limit));
        let mut sponsors = Vec::new(&env);
        for index in start..end {
            let key = RegistryKey::ProjectSponsorAt(id, index);
            if let Some(sponsor) = env.storage().persistent().get::<RegistryKey, Address>(&key) {
                Self::bump_persistent(&env, &key);
                sponsors.push_back(sponsor);
            }
        }
        sponsors
    }

    /// Legacy compatibility entrypoint. New sponsorships use
    /// `record_sponsorship`, which tracks distinct sponsors and timestamps.
    pub fn update_totals(env: Env, id: u64, amount: i128) {
        let manager: Address = env
            .storage()
            .instance()
            .get(&RegistryKey::SponsorshipManager)
            .unwrap_or_else(|| {
                panic_with_error!(&env, ProjectRegistryError::SponsorshipManagerNotSet)
            });
        manager.require_auth();

        if amount <= 0 {
            panic_with_error!(&env, ProjectRegistryError::InvalidSponsorshipAmount);
        }

        let mut project = Self::load_project(&env, id);
        if !project.active {
            panic_with_error!(&env, ProjectRegistryError::ProjectInactive);
        }
        project.total_raised = project
            .total_raised
            .checked_add(amount)
            .unwrap_or_else(|| panic_with_error!(&env, ProjectRegistryError::CounterOverflow));
        project.sponsor_count = project
            .sponsor_count
            .checked_add(1)
            .unwrap_or_else(|| panic_with_error!(&env, ProjectRegistryError::CounterOverflow));
        project.total_donations = project
            .total_donations
            .checked_add(1)
            .unwrap_or_else(|| panic_with_error!(&env, ProjectRegistryError::CounterOverflow));
        Self::store_project(&env, id, &project);
    }

    /// Returns the permanent maintainer succession history, oldest first.
    pub fn get_maintainer_history(
        env: Env,
        id: u64,
        start: u64,
        limit: u32,
    ) -> Vec<MaintainerRecord> {
        Self::ensure_project_exists(&env, id);
        let count_key = RegistryKey::MaintainerHistoryCount(id);
        let count: u64 = env.storage().persistent().get(&count_key).unwrap_or(0);
        if count == 0 {
            let project = Self::load_project(&env, id);
            let mut records = Vec::new(&env);
            if start == 0 && limit > 0 {
                records.push_back(MaintainerRecord {
                    maintainer: project.owner,
                    timestamp: project.created_at,
                });
            }
            return records;
        }
        let page_limit = limit.min(MAX_PAGE_SIZE) as u64;
        let end = count.min(start.saturating_add(page_limit));
        let mut records = Vec::new(&env);
        for index in start..end {
            let key = RegistryKey::MaintainerHistory(id, index);
            if let Some(record) = env
                .storage()
                .persistent()
                .get::<RegistryKey, MaintainerRecord>(&key)
            {
                Self::bump_persistent(&env, &key);
                records.push_back(record);
            }
        }
        records
    }

    fn load_project(env: &Env, id: u64) -> Project {
        let key = RegistryKey::Project(id);
        let version: u32 = env
            .storage()
            .persistent()
            .get(&RegistryKey::ProjectVersion(id))
            .unwrap_or(1);

        let project = match version {
            1 => {
                let old: ProjectV1 = env.storage().persistent().get(&key).unwrap_or_else(|| {
                    panic_with_error!(env, ProjectRegistryError::ProjectNotFound)
                });
                let (repository_owner, repository_name) =
                    Self::split_repository(env, &old.repo_full_name);
                Project {
                    owner: old.owner,
                    repo_full_name: old.repo_full_name,
                    repository_owner,
                    repository_name,
                    name: old.name,
                    description: old.description,
                    total_raised: old.total_raised,
                    // The legacy field counted donations, so retain it as the
                    // historical baseline until new indexed sponsorships exist.
                    sponsor_count: old.sponsor_count,
                    total_donations: old.sponsor_count as u64,
                    created_at: old.created_at,
                    last_sponsored_at: 0,
                    active: old.active,
                }
            }
            2 => {
                let old: ProjectV2 = env.storage().persistent().get(&key).unwrap_or_else(|| {
                    panic_with_error!(env, ProjectRegistryError::ProjectNotFound)
                });
                let (repository_owner, repository_name) =
                    Self::split_repository(env, &old.repo_full_name);
                Project {
                    owner: old.owner,
                    repo_full_name: old.repo_full_name,
                    repository_owner,
                    repository_name,
                    name: old.name,
                    description: old.description,
                    total_raised: old.total_raised,
                    sponsor_count: old.sponsor_count,
                    total_donations: old.total_donations,
                    created_at: old.created_at,
                    last_sponsored_at: old.last_sponsored_at,
                    active: old.active,
                }
            }
            CURRENT_PROJECT_VERSION => {
                env.storage().persistent().get(&key).unwrap_or_else(|| {
                    panic_with_error!(env, ProjectRegistryError::ProjectNotFound)
                })
            }
            _ => panic_with_error!(env, ProjectRegistryError::UnsupportedProjectVersion),
        };
        Self::bump_persistent(env, &key);
        if env
            .storage()
            .persistent()
            .has(&RegistryKey::ProjectVersion(id))
        {
            Self::bump_persistent(env, &RegistryKey::ProjectVersion(id));
        }
        project
    }

    fn ensure_project_exists(env: &Env, id: u64) {
        if !env.storage().persistent().has(&RegistryKey::Project(id)) {
            panic_with_error!(env, ProjectRegistryError::ProjectNotFound);
        }
    }

    fn split_repository(env: &Env, full_name: &String) -> (String, String) {
        let length = full_name.len() as usize;
        if length == 0 || length > 256 {
            panic_with_error!(env, ProjectRegistryError::InvalidRepository);
        }

        let mut bytes = [0u8; 256];
        let target = &mut bytes[..length];
        full_name.copy_into_slice(target);

        let slash = target.iter().position(|byte| *byte == b'/');
        let Some(slash) = slash else {
            panic_with_error!(env, ProjectRegistryError::InvalidRepository);
        };
        if slash == 0 || slash + 1 >= length || target[slash + 1..].iter().any(|byte| *byte == b'/')
        {
            panic_with_error!(env, ProjectRegistryError::InvalidRepository);
        }

        (
            String::from_bytes(env, &target[..slash]),
            String::from_bytes(env, &target[slash + 1..]),
        )
    }

    fn normalize_repository(env: &Env, full_name: &String) -> String {
        let length = full_name.len() as usize;
        if length == 0 || length > 256 {
            panic_with_error!(env, ProjectRegistryError::InvalidRepository);
        }
        let mut bytes = [0u8; 256];
        let target = &mut bytes[..length];
        full_name.copy_into_slice(target);
        for byte in target.iter_mut() {
            if byte.is_ascii_uppercase() {
                *byte = byte.to_ascii_lowercase();
            }
        }
        String::from_bytes(env, target)
    }

    fn store_project(env: &Env, id: u64, project: &Project) {
        env.storage()
            .persistent()
            .set(&RegistryKey::Project(id), project);
        Self::bump_persistent(env, &RegistryKey::Project(id));
        env.storage()
            .persistent()
            .set(&RegistryKey::ProjectVersion(id), &CURRENT_PROJECT_VERSION);
        Self::bump_persistent(env, &RegistryKey::ProjectVersion(id));
    }

    fn bump_persistent(env: &Env, key: &RegistryKey) {
        env.storage()
            .persistent()
            .extend_ttl(key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_BUMP);
    }
}

#[cfg(test)]
mod test;
