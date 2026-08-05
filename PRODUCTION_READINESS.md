# SponsorChain Production Readiness Audit

Audit scope: Soroban ProjectRegistry and SponsorshipManager contracts, their
TypeScript integration, and Mainnet deployment automation. This report is
based on the current source tree; no Mainnet transaction or deployed contract
was mutated during the audit.

## Executive result

The local implementation is materially safer for Mainnet release: persistent
records have bounded pagination and TTL renewal, sponsorship counters are
checked, sponsor messages are bounded to 280 bytes, inactive projects cannot
receive sponsorship mutations, ownership actions require the registered
maintainer, and frontend writes wait for finalized Soroban transactions.

Mainnet deployment remains gated on verifying the deployed contract IDs and
WASM interfaces. The current workspace does not contain usable production
contract IDs or deployer credentials, so deployed-state compatibility and
WASM hash verification cannot be completed from this environment.

## Critical issues

1. **Deployed contract identity is not verified.** Production configuration
   must provide the intended Mainnet ProjectRegistry and SponsorshipManager
   IDs, then compare their on-chain WASM hashes and interfaces with the release
   artifacts. A wrong ID or an older WASM recreates the `MissingValue` failure.

2. **Fresh deployment is not a migration.** Running the deployment script with
   `--confirm-redeploy` creates new addresses and makes all old project and
   sponsorship state unreachable. Existing Mainnet addresses must be preserved
   for an in-place upgrade or an explicitly approved migration plan.

## High-priority issues

1. The repository has no contract-admin upgrade entrypoint. If an existing
   deployment must be upgraded, the release owner must use an authorized
   Soroban WASM upgrade path with an independently verified artifact and
   multisignature/admin controls. Do not deploy fresh contracts over an
   existing production configuration.

2. Legacy v1 sponsorship queries retain an O(N) compatibility scan. New v2
   sponsorships use project and sponsor indexes, but very large pre-index
   histories can exceed a simulation budget. Test the legacy population before
   enabling an in-place upgrade; migrate or archive only through an approved
   state-preserving procedure.

3. `get_projects_by_owner` scans project IDs because the original storage
   model has no owner index. It is correct but will become expensive as the
   catalog grows. This is a future storage optimization, not a reason to add a
   database source of truth.

4. Contract return values cannot reliably contain the enclosing transaction
   hash. Sponsorship records therefore keep `transaction_hash` optional; the
   frontend uses the finalized submission hash for user-facing transaction
   links. Do not treat a null contract field as evidence that a donation failed.

## Medium-priority issues

1. Persistent TTL is renewed when canonical records and indexes are read or
   written. Cold, inactive records can still expire and must be restorable from
   archival history according to the operational runbook.

2. Soroban RPC and Horizon are external availability dependencies. Horizon is
   used for account existence/sequence and generic wallet/payment views only;
   projects, sponsorships, totals, and history are read from Soroban storage.

3. Event queries are observational only and start at ledger zero. They must
   not be used to reconstruct project or sponsorship history. A production
   activity view should use bounded event cursors if event volume becomes
   material.

4. Maintainer-dashboard reads now propagate RPC errors instead of silently
   returning an empty project list. The page should keep showing an explicit
   network error state if that request fails; an empty list must not be
   interpreted as authoritative ownership state.

## Low-priority issues

1. The generic Horizon payment/activity helpers retain defensive empty-array
   fallbacks for non-canonical wallet activity. They do not feed project cards
   or sponsorship history, but their UI should distinguish “no records” from
   “query unavailable” where operationally important.

2. The local Vitest environment currently fails before test collection with
   `getaddrinfo EAI_AGAIN localhost`; this is an environment/DNS problem, not
   an assertion failure. CI must run the frontend suite in a network-capable
   environment.

## Storage and cost findings

- Project records, version markers, repository indexes, sponsor indexes,
  sponsorship records, and maintainer history are persistent Soroban entries.
- New sponsorships write one canonical record, a version marker, project and
  sponsor index entries, their counters, and the ProjectRegistry aggregate.
  This duplication is intentional: it makes the required history queries
  bounded and avoids event-only reconstruction.
- Repository canonicalization prevents case-variant duplicates. The original
  repository index is retained for compatibility, so a new registration may
  write two repository index keys.
- Reads are capped at 100 records per contract call. Frontend project and
  sponsorship reads paginate rather than requesting unbounded vectors.
- Arithmetic and sequence counters use checked increments. Project metadata
  and sponsor messages are bounded before storage writes.
- Persistent TTLs use a threshold/bump strategy. Each accessed canonical key
  is renewed; archival restoration remains an operational responsibility for
  genuinely cold records.
- The largest remaining cost is legacy O(N) scans and the owner query scan.
  Both are documented compatibility/performance constraints and should be
  measured against Mainnet resource limits before a large-state upgrade.

## Security observations

- `Address::require_auth` protects project registration, unlisting, transfers,
  sponsorships, and the configured sponsorship-manager boundary. Stellar
  host authorization supplies replay protection for signed invocations.
- Unlisting is state-preserving and deterministic: missing, inactive, or
  unauthorized projects return contract errors; the project and funding
  history remain readable.
- Maintainer transfers append history and reject self-transfers. Legacy
  projects without transfer-history keys expose a one-record compatibility
  view; historical maintainers that were never recorded cannot be recovered
  from the old layout.
- Inactive projects cannot be sponsored through SponsorshipManager or the
  registry’s manager-only mutation paths.
- Positive amounts, checked totals, checked sequence counters, pagination
  caps, repository format, metadata limits, and sponsor-message limits are
  enforced on-chain.
- Token transfer and all storage writes occur in one Soroban invocation; a
  failed transfer or later contract error rolls back the invocation.
- GitHub ownership/admin validation is a pre-signing server check. It is not
  the authorization source for later unlisting or transfer; those decisions
  come from Soroban state.

## Verification performed

- `cargo build --locked --target wasm32v1-none --release`
- `cargo test`: 14 ProjectRegistry tests and 10 SponsorshipManager tests passed.
- New coverage includes large history, pagination limits, maximum message
  length, inactive sponsorship rejection, maintainer transfer/replay, and
  legacy storage reads.
- `npm run typecheck` reached compilation but is currently blocked by the
  checkout environment missing the declared `@sentry/nextjs` package; a prior
  run passed before the dependency directory became incomplete.
- `bash -n scripts/deploy-contracts.sh` and `git diff --check` should be run
  again as the final release gate after any further edits.
- Local WASM interface inspection confirms the registry exposes
  `unlist_project`, `transfer_maintainer`, and `get_maintainer_history`; the
  deployment script now checks these methods and the manager’s
  `sponsor_with_message` before upload.

## Mainnet deployment checklist

- [ ] Build with the locked toolchain and record both local WASM SHA-256 hashes.
- [ ] Review the generated contract interfaces and confirm all frontend method
      names and argument types.
- [ ] Verify the deployed IDs are Mainnet contracts and match the release
      interface and expected WASM hashes.
- [ ] Confirm `Public Global Stellar Network ; September 2015` is used for all
      signing and simulation.
- [ ] Reject Testnet, Futurenet, Friendbot, localhost, and loopback RPC URLs.
- [ ] Confirm funded deployer identity, admin address, native XLM SAC address,
      and Soroban RPC provider through a separate release review.
- [ ] Never use `--confirm-redeploy` for an existing production deployment
      unless state loss is explicitly approved.
- [ ] If upgrading existing contracts, validate the authorized upgrade path,
      storage-version compatibility, TTL behavior, and rollback procedure on a
      stateful replica first.
- [ ] Verify initialization and manager linking transactions succeeded; the
      deployment script now fails instead of swallowing these errors.
- [ ] Submit a create-project transaction and verify finality, returned project
      ID, `get_project`, and active-only Explore results.
- [ ] Submit a sponsorship and verify the canonical record, project totals,
      sponsor history, and finalized transaction hash in the UI.
- [ ] Verify unauthorized unlisting/transfer fails and authorized actions
      preserve inactive project history.
- [ ] Run contract tests, frontend typecheck, frontend Vitest/CI, interface
      checks, `bash -n`, and `git diff --check` from a clean release candidate.

## Official references

- [Soroban storage strategies](https://developers.stellar.org/docs/build/guides/storage/storage-strategies)
- [Testing contract TTL extension](https://developers.stellar.org/docs/build/guides/archival/test-ttl-extension)
- [Migrating contract storage](https://developers.stellar.org/docs/build/guides/storage/migrate-contract-storage)
- [Contract authorization](https://developers.stellar.org/docs/build/guides/auth/contract-authorization)
- [Soroban unit tests](https://developers.stellar.org/docs/build/guides/testing/unit-tests)
- [Upgrading contracts](https://developers.stellar.org/docs/build/guides/conventions/upgrading-contracts)
