#![no_std]
#![allow(deprecated)]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, token, Address, Env,
    String, Vec,
};

mod project_registry {
    soroban_sdk::contractimport!(file = "../target/wasm32v1-none/release/project_registry.wasm");
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct SponsorshipV1 {
    pub sponsor: Address,
    pub project_id: u64,
    pub amount: i128,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Sponsorship {
    pub id: u64,
    pub project_id: u64,
    pub sponsor: Address,
    /// XLM amount in stroops.
    pub amount: i128,
    pub timestamp: u64,
    pub transaction_hash: Option<String>,
    pub sponsor_message: Option<String>,
    /// One-based donation number within this project.
    pub donation_number: u64,
}

#[contracttype]
pub enum ManagerKey {
    // Keep the original variants in the original order for deployed state.
    Sponsorship(u64),
    NextId,
    Admin,
    ProjectRegistry,
    XlmSac,
    SponsorshipVersion(u64),
    ProjectSponsorshipCount(u64),
    ProjectSponsorship(u64, u64),
    SponsorSponsorshipCount(Address),
    SponsorSponsorship(Address, u64),
    LegacyNextId,
}

const CURRENT_SPONSORSHIP_VERSION: u32 = 2;
const MAX_PAGE_SIZE: u32 = 100;
const MAX_SPONSOR_MESSAGE_LEN: u32 = 280;
const PERSISTENT_TTL_THRESHOLD: u32 = 450_000;
const PERSISTENT_TTL_BUMP: u32 = 535_679;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum SponsorshipManagerError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InvalidAmount = 3,
    ProjectInactive = 4,
    SponsorshipNotFound = 5,
    UnsupportedSponsorshipVersion = 6,
    MessageTooLong = 7,
    CounterOverflow = 8,
}

#[contract]
pub struct SponsorshipManager;

#[contractimpl]
impl SponsorshipManager {
    pub fn init(env: Env, admin: Address, project_registry: Address, xlm_sac: Address) {
        if env.storage().instance().has(&ManagerKey::Admin) {
            panic_with_error!(&env, SponsorshipManagerError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&ManagerKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&ManagerKey::ProjectRegistry, &project_registry);
        env.storage().instance().set(&ManagerKey::XlmSac, &xlm_sac);
        env.storage().instance().set(&ManagerKey::NextId, &0u64);
        env.storage()
            .instance()
            .set(&ManagerKey::LegacyNextId, &0u64);
    }

    /// Compatibility entrypoint for sponsors that do not provide a message.
    pub fn sponsor(env: Env, sponsor: Address, project_id: u64, amount: i128) -> u64 {
        sponsor_internal(env, sponsor, project_id, amount, None, None)
    }

    /// Records a sponsorship with an optional message. The transaction hash is
    /// intentionally optional because a contract cannot know the hash of the
    /// transaction that is currently executing.
    pub fn sponsor_with_message(
        env: Env,
        sponsor: Address,
        project_id: u64,
        amount: i128,
        sponsor_message: Option<String>,
    ) -> u64 {
        sponsor_internal(env, sponsor, project_id, amount, sponsor_message, None)
    }

    pub fn get_sponsorship(env: Env, id: u64) -> Sponsorship {
        let stored = Self::load_sponsorship(&env, id);
        match stored {
            StoredSponsorship::Current(sponsorship) => sponsorship,
            StoredSponsorship::Legacy(legacy) => Sponsorship {
                id,
                project_id: legacy.project_id,
                sponsor: legacy.sponsor,
                amount: legacy.amount,
                timestamp: legacy.timestamp,
                transaction_hash: None,
                sponsor_message: None,
                donation_number: Self::legacy_donation_number(&env, id, legacy.project_id),
            },
        }
    }

    /// Compatibility method returning all global sponsorship IDs for a project.
    pub fn get_sponsorships_for_project(env: Env, project_id: u64) -> Vec<u64> {
        Self::project_sponsorship_ids(&env, project_id)
    }

    /// Compatibility method returning all global sponsorship IDs for a sponsor.
    pub fn get_sponsorships_by_sponsor(env: Env, sponsor: Address) -> Vec<u64> {
        Self::sponsor_sponsorship_ids(&env, sponsor)
    }

    /// Returns a bounded chronological page of sponsorship records for a project.
    pub fn get_project_sponsorships(
        env: Env,
        project_id: u64,
        start: u64,
        limit: u32,
    ) -> Vec<Sponsorship> {
        let ids = Self::project_sponsorship_ids(&env, project_id);
        Self::records_from_ids(&env, ids, start, limit)
    }

    /// Returns a bounded page of distinct sponsors for a project.
    pub fn get_project_sponsors(env: Env, project_id: u64, start: u64, limit: u32) -> Vec<Address> {
        // New records have a direct project index in this contract. The
        // legacy scan is retained so records written before the index was
        // introduced remain queryable after a contract upgrade.
        let mut sponsors = Vec::new(&env);
        let legacy_end: u64 = env
            .storage()
            .instance()
            .get(&ManagerKey::LegacyNextId)
            .unwrap_or_else(|| {
                env.storage()
                    .instance()
                    .get(&ManagerKey::NextId)
                    .unwrap_or(0)
            });

        for id in 0..legacy_end {
            if let StoredSponsorship::Legacy(legacy) = Self::load_sponsorship(&env, id) {
                if legacy.project_id == project_id {
                    Self::push_unique_sponsor(&mut sponsors, legacy.sponsor);
                }
            }
        }

        let count: u64 = env
            .storage()
            .persistent()
            .get(&ManagerKey::ProjectSponsorshipCount(project_id))
            .unwrap_or(0);
        for sequence in 0..count {
            if let Some(id) = env
                .storage()
                .persistent()
                .get::<ManagerKey, u64>(&ManagerKey::ProjectSponsorship(project_id, sequence))
            {
                let sponsorship = Self::get_sponsorship(env.clone(), id);
                Self::push_unique_sponsor(&mut sponsors, sponsorship.sponsor);
            }
        }

        let page_limit = limit.min(MAX_PAGE_SIZE) as u64;
        let end = (sponsors.len() as u64).min(start.saturating_add(page_limit));
        let mut page = Vec::new(&env);
        for index in start..end {
            page.push_back(sponsors.get(index as u32).unwrap());
        }
        page
    }

    /// Returns a bounded chronological page of donations made by a sponsor.
    pub fn get_sponsor_history(
        env: Env,
        sponsor: Address,
        start: u64,
        limit: u32,
    ) -> Vec<Sponsorship> {
        let ids = Self::sponsor_sponsorship_ids(&env, sponsor);
        Self::records_from_ids(&env, ids, start, limit)
    }

    /// Returns the newest sponsorship records first, bounded to 100 entries.
    pub fn get_recent_sponsorships(env: Env, limit: u32) -> Vec<Sponsorship> {
        let next_id: u64 = env
            .storage()
            .instance()
            .get(&ManagerKey::NextId)
            .unwrap_or_else(|| panic_with_error!(&env, SponsorshipManagerError::NotInitialized));
        let count = limit.min(MAX_PAGE_SIZE) as u64;
        let start = next_id.saturating_sub(count);
        let mut records = Vec::new(&env);
        let mut id = next_id;
        while id > start {
            id -= 1;
            records.push_back(Self::get_sponsorship(env.clone(), id));
        }
        records
    }

    fn load_sponsorship(env: &Env, id: u64) -> StoredSponsorship {
        let sponsorship_key = ManagerKey::Sponsorship(id);
        let version_key = ManagerKey::SponsorshipVersion(id);
        let version: u32 = env.storage().persistent().get(&version_key).unwrap_or(1);
        let stored = match version {
            1 => StoredSponsorship::Legacy(
                env.storage()
                    .persistent()
                    .get(&sponsorship_key)
                    .unwrap_or_else(|| {
                        panic_with_error!(env, SponsorshipManagerError::SponsorshipNotFound)
                    }),
            ),
            CURRENT_SPONSORSHIP_VERSION => StoredSponsorship::Current(
                env.storage()
                    .persistent()
                    .get(&sponsorship_key)
                    .unwrap_or_else(|| {
                        panic_with_error!(env, SponsorshipManagerError::SponsorshipNotFound)
                    }),
            ),
            _ => panic_with_error!(env, SponsorshipManagerError::UnsupportedSponsorshipVersion),
        };
        Self::bump_persistent(env, &sponsorship_key);
        if env.storage().persistent().has(&version_key) {
            Self::bump_persistent(env, &version_key);
        }
        stored
    }

    fn project_sponsorship_ids(env: &Env, project_id: u64) -> Vec<u64> {
        let mut ids = Vec::new(env);
        let legacy_end: u64 = env
            .storage()
            .instance()
            .get(&ManagerKey::LegacyNextId)
            .unwrap_or_else(|| {
                env.storage()
                    .instance()
                    .get(&ManagerKey::NextId)
                    .unwrap_or(0)
            });

        for id in 0..legacy_end {
            if let StoredSponsorship::Legacy(legacy) = Self::load_sponsorship(env, id) {
                if legacy.project_id == project_id {
                    ids.push_back(id);
                }
            }
        }

        let count: u64 = env
            .storage()
            .persistent()
            .get(&ManagerKey::ProjectSponsorshipCount(project_id))
            .unwrap_or(0);
        if count > 0 {
            Self::bump_persistent(env, &ManagerKey::ProjectSponsorshipCount(project_id));
        }
        for sequence in 0..count {
            let key = ManagerKey::ProjectSponsorship(project_id, sequence);
            if let Some(id) = env.storage().persistent().get::<ManagerKey, u64>(&key) {
                Self::bump_persistent(env, &key);
                ids.push_back(id);
            }
        }
        ids
    }

    fn sponsor_sponsorship_ids(env: &Env, sponsor: Address) -> Vec<u64> {
        let mut ids = Vec::new(env);
        let legacy_end: u64 = env
            .storage()
            .instance()
            .get(&ManagerKey::LegacyNextId)
            .unwrap_or_else(|| {
                env.storage()
                    .instance()
                    .get(&ManagerKey::NextId)
                    .unwrap_or(0)
            });

        for id in 0..legacy_end {
            if let StoredSponsorship::Legacy(legacy) = Self::load_sponsorship(env, id) {
                if legacy.sponsor == sponsor {
                    ids.push_back(id);
                }
            }
        }

        let count: u64 = env
            .storage()
            .persistent()
            .get(&ManagerKey::SponsorSponsorshipCount(sponsor.clone()))
            .unwrap_or(0);
        if count > 0 {
            Self::bump_persistent(env, &ManagerKey::SponsorSponsorshipCount(sponsor.clone()));
        }
        for sequence in 0..count {
            let key = ManagerKey::SponsorSponsorship(sponsor.clone(), sequence);
            if let Some(id) = env.storage().persistent().get::<ManagerKey, u64>(&key) {
                Self::bump_persistent(env, &key);
                ids.push_back(id);
            }
        }
        ids
    }

    fn records_from_ids(env: &Env, ids: Vec<u64>, start: u64, limit: u32) -> Vec<Sponsorship> {
        let page_limit = limit.min(MAX_PAGE_SIZE);
        let mut records = Vec::new(env);
        if start > u32::MAX as u64 {
            return records;
        }
        let mut index = start as u32;
        while index < ids.len() && records.len() < page_limit {
            records.push_back(Self::get_sponsorship(env.clone(), ids.get(index).unwrap()));
            index += 1;
        }
        records
    }

    fn legacy_donation_number(env: &Env, id: u64, project_id: u64) -> u64 {
        let mut number: u64 = 0;
        for candidate in 0..id {
            if let StoredSponsorship::Legacy(legacy) = Self::load_sponsorship(env, candidate) {
                if legacy.project_id == project_id {
                    number = number.checked_add(1).unwrap_or_else(|| {
                        panic_with_error!(env, SponsorshipManagerError::CounterOverflow)
                    });
                }
            }
        }
        number
            .checked_add(1)
            .unwrap_or_else(|| panic_with_error!(env, SponsorshipManagerError::CounterOverflow))
    }

    fn push_unique_sponsor(sponsors: &mut Vec<Address>, sponsor: Address) {
        let mut exists = false;
        for existing in sponsors.iter() {
            if existing == sponsor {
                exists = true;
                break;
            }
        }
        if !exists {
            sponsors.push_back(sponsor);
        }
    }

    fn bump_persistent(env: &Env, key: &ManagerKey) {
        env.storage()
            .persistent()
            .extend_ttl(key, PERSISTENT_TTL_THRESHOLD, PERSISTENT_TTL_BUMP);
    }
}

enum StoredSponsorship {
    Legacy(SponsorshipV1),
    Current(Sponsorship),
}

fn sponsor_internal(
    env: Env,
    sponsor: Address,
    project_id: u64,
    amount: i128,
    sponsor_message: Option<String>,
    transaction_hash: Option<String>,
) -> u64 {
    sponsor.require_auth();

    if amount <= 0 {
        panic_with_error!(&env, SponsorshipManagerError::InvalidAmount);
    }
    if let Some(message) = sponsor_message.as_ref() {
        if message.len() > MAX_SPONSOR_MESSAGE_LEN {
            panic_with_error!(&env, SponsorshipManagerError::MessageTooLong);
        }
    }

    let registry_addr: Address = env
        .storage()
        .instance()
        .get(&ManagerKey::ProjectRegistry)
        .unwrap_or_else(|| panic_with_error!(&env, SponsorshipManagerError::NotInitialized));
    let xlm_sac_addr: Address = env
        .storage()
        .instance()
        .get(&ManagerKey::XlmSac)
        .unwrap_or_else(|| panic_with_error!(&env, SponsorshipManagerError::NotInitialized));

    let registry_client = project_registry::Client::new(&env, &registry_addr);
    let project = registry_client.get_project(&project_id);
    if !project.active {
        panic_with_error!(&env, SponsorshipManagerError::ProjectInactive);
    }

    token::Client::new(&env, &xlm_sac_addr).transfer(&sponsor, &project.owner, &amount);

    let next_id: u64 = env
        .storage()
        .instance()
        .get(&ManagerKey::NextId)
        .unwrap_or_else(|| panic_with_error!(&env, SponsorshipManagerError::NotInitialized));
    let project_sequence: u64 = env
        .storage()
        .persistent()
        .get(&ManagerKey::ProjectSponsorshipCount(project_id))
        .unwrap_or_else(|| count_previous_project_sponsorships(&env, project_id, next_id));

    if !env.storage().instance().has(&ManagerKey::LegacyNextId) {
        env.storage()
            .instance()
            .set(&ManagerKey::LegacyNextId, &next_id);
    }

    let sponsorship = Sponsorship {
        id: next_id,
        project_id,
        sponsor: sponsor.clone(),
        amount,
        timestamp: env.ledger().timestamp(),
        transaction_hash,
        sponsor_message,
        donation_number: project_sequence
            .checked_add(1)
            .unwrap_or_else(|| panic_with_error!(&env, SponsorshipManagerError::CounterOverflow)),
    };

    env.storage()
        .persistent()
        .set(&ManagerKey::Sponsorship(next_id), &sponsorship);
    SponsorshipManager::bump_persistent(&env, &ManagerKey::Sponsorship(next_id));
    env.storage().persistent().set(
        &ManagerKey::SponsorshipVersion(next_id),
        &CURRENT_SPONSORSHIP_VERSION,
    );
    SponsorshipManager::bump_persistent(&env, &ManagerKey::SponsorshipVersion(next_id));
    env.storage().persistent().set(
        &ManagerKey::ProjectSponsorship(project_id, project_sequence),
        &next_id,
    );
    SponsorshipManager::bump_persistent(
        &env,
        &ManagerKey::ProjectSponsorship(project_id, project_sequence),
    );
    env.storage().persistent().set(
        &ManagerKey::ProjectSponsorshipCount(project_id),
        &project_sequence
            .checked_add(1)
            .unwrap_or_else(|| panic_with_error!(&env, SponsorshipManagerError::CounterOverflow)),
    );
    SponsorshipManager::bump_persistent(&env, &ManagerKey::ProjectSponsorshipCount(project_id));

    let sponsor_sequence: u64 = env
        .storage()
        .persistent()
        .get(&ManagerKey::SponsorSponsorshipCount(sponsor.clone()))
        .unwrap_or(0);
    env.storage().persistent().set(
        &ManagerKey::SponsorSponsorship(sponsor.clone(), sponsor_sequence),
        &next_id,
    );
    SponsorshipManager::bump_persistent(
        &env,
        &ManagerKey::SponsorSponsorship(sponsor.clone(), sponsor_sequence),
    );
    let sponsor_count_key = ManagerKey::SponsorSponsorshipCount(sponsor);
    env.storage().persistent().set(
        &sponsor_count_key,
        &sponsor_sequence
            .checked_add(1)
            .unwrap_or_else(|| panic_with_error!(&env, SponsorshipManagerError::CounterOverflow)),
    );
    SponsorshipManager::bump_persistent(&env, &sponsor_count_key);

    env.storage().instance().set(
        &ManagerKey::NextId,
        &next_id
            .checked_add(1)
            .unwrap_or_else(|| panic_with_error!(&env, SponsorshipManagerError::CounterOverflow)),
    );

    registry_client.record_sponsorship(
        &project_id,
        &sponsorship.sponsor,
        &amount,
        &sponsorship.timestamp,
    );

    env.events().publish(
        (
            soroban_sdk::symbol_short!("sponsor"),
            soroban_sdk::symbol_short!("funded"),
        ),
        (next_id, sponsorship.sponsor, project_id, amount),
    );

    next_id
}

fn count_previous_project_sponsorships(env: &Env, project_id: u64, end: u64) -> u64 {
    let mut count: u64 = 0;
    for id in 0..end {
        if let StoredSponsorship::Legacy(legacy) = SponsorshipManager::load_sponsorship(env, id) {
            if legacy.project_id == project_id {
                count = count.checked_add(1).unwrap_or_else(|| {
                    panic_with_error!(env, SponsorshipManagerError::CounterOverflow)
                });
            }
        }
    }
    count
}

#[cfg(test)]
mod test;
