# Stellar Testnet Contracts

Project listings are stored only by the deployed Stellar Testnet
`ProjectRegistry` contract and read through Testnet Soroban RPC.

The deployment environment must provide these public values:

| Variable | Required value |
|---|---|
| `NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS` | Testnet `ProjectRegistry` contract ID |
| `NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS` | Testnet `SponsorshipManager` contract ID |
| `NEXT_PUBLIC_XLM_SAC_ADDRESS` | Testnet native XLM SAC contract ID |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | Testnet Soroban RPC provider URL |
| `NEXT_PUBLIC_HORIZON_URL` | `https://horizon-testnet.stellar.org` |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `TESTNET` |

Deployment creates no project or sponsorship records. The frontend never uses
an off-chain project store or fallback contract address for discovery.

Deploy or update Testnet contracts with:

```bash
STELLAR_IDENTITY=<funded-testnet-identity> \
NEXT_PUBLIC_XLM_SAC_ADDRESS=<testnet-xlm-sac> \
./scripts/deploy-contracts.sh
```

The script requires `--confirm-redeploy` before replacing configured contract
addresses, because a fresh contract instance has separate on-chain storage.

## On-chain sponsorship storage

`SponsorshipManager` stores each successful sponsorship as persistent Soroban
data. Each record contains its ID, project ID, sponsor address, stroop amount,
ledger timestamp, optional message, optional transaction hash, and sequential
project donation number. The manager also stores project and sponsor indexes;
the registry stores project totals, distinct sponsor count, donation count,
creation time, last sponsorship time, and active status.

The canonical read methods are:

- `ProjectRegistry.get_project(id)`
- `ProjectRegistry.list_projects(start, limit)`
- `ProjectRegistry.get_project_sponsors(id, start, limit)`
- `SponsorshipManager.get_project_sponsors(id, start, limit)`
- `SponsorshipManager.get_project_sponsorships(id, start, limit)`
- `SponsorshipManager.get_sponsor_history(address, start, limit)`
- `SponsorshipManager.get_recent_sponsorships(limit)`

## Project ownership and maintainer authorization

At registration, the frontend validates the exact GitHub repository through the
authenticated GitHub API. The contract permanently stores the repository owner,
repository name, maintainer Stellar address, and registration timestamp in the
project record. The maintainer address is the project `owner` field for
backward-compatible contract interfaces.

`unlist_project(id, caller)` requires `caller` to equal the registered
maintainer and requires the registered maintainer address to authorize the
transaction. It only sets `active=false`; it never removes project,
sponsorship, funding, or timestamp data.

`transfer_maintainer(id, new_address)` requires authorization from the current
maintainer, rejects self-transfers and inactive projects, and appends a
persistent `MaintainerRecord`. The history is available through
`get_maintainer_history(id, start, limit)`.

Authorization and validation failures use the `ProjectRegistryError` contract
error enum, including `ProjectNotFound`, `ProjectInactive`,
`UnauthorizedMaintainer`, `InvalidMaintainerTransfer`,
`RepositoryAlreadyRegistered`, and `InvalidRepository`.

Pages are capped at 100 records. Events remain observability data only; the
frontend reconstructs project cards and sponsorship history from contract
simulation reads.

## Storage migration and archival

The contracts retain the original storage-key variant order and use per-entry
version markers. Existing v1 project and sponsorship values are decoded lazily
without rewriting or deleting them; fields that did not exist in v1 are
reported with safe defaults. New writes use v3 project records, v2 sponsorship
records, and indexed persistent
storage. No project or sponsorship storage migration is performed by the
frontend.

Soroban persistent entries have archival TTLs. The contracts bump TTL on
canonical reads and writes, while deployment operations must also keep the
contract code and instance live. If an inactive historical entry is archived,
restore/extend it with Stellar archival tooling before querying it; archival
does not create an off-chain source of truth.
