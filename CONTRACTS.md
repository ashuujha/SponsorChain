# Contract Addresses

Last deployed: 2026-07-31T14:49:18Z

## ProjectRegistry

| Field | Value |
|-------|-------|
| Contract address | `CDTINQP4HOUWLLCUCGOVTLPYHVHVP3KIYVVCKWHPIWQEIOGO775FIDN6` |
| Explorer | [CDTINQP4HOUWLLCUCGOVTLPYHVHVP3KIYVVCKWHPIWQEIOGO775FIDN6](https://stellar.expert/explorer/testnet/contract/CDTINQP4HOUWLLCUCGOVTLPYHVHVP3KIYVVCKWHPIWQEIOGO775FIDN6) |
| Init tx | [https://stellar.expert/explorer/testnet/tx/6f992a9d1d5be751aae533fa9e25e80efa6e3b9f0c300b5d8e92a2c7c91ef217](https://stellar.expert/explorer/testnet/tx/6f992a9d1d5be751aae533fa9e25e80efa6e3b9f0c300b5d8e92a2c7c91ef217) |
| Link tx | [https://stellar.expert/explorer/testnet/tx/fa18e26116ad4433e53eec0c688180147ba46bd62b64c03409f4d39e8d3867af](https://stellar.expert/explorer/testnet/tx/fa18e26116ad4433e53eec0c688180147ba46bd62b64c03409f4d39e8d3867af) |

## SponsorshipManager

| Field | Value |
|-------|-------|
| Contract address | `CAV2XETV4LWJ5XG7N2MNHRSZZHNJQS3LMWLWK3J5FW5O5U45KPUSROLR` |
| Explorer | [CAV2XETV4LWJ5XG7N2MNHRSZZHNJQS3LMWLWK3J5FW5O5U45KPUSROLR](https://stellar.expert/explorer/testnet/contract/CAV2XETV4LWJ5XG7N2MNHRSZZHNJQS3LMWLWK3J5FW5O5U45KPUSROLR) |
| Init tx | [https://stellar.expert/explorer/testnet/tx/9580dcae070b6005b1e3d2706c627fb33567a32e9c60b5da81ab613986c13e4e](https://stellar.expert/explorer/testnet/tx/9580dcae070b6005b1e3d2706c627fb33567a32e9c60b5da81ab613986c13e4e) |

## Smoke Test

| Field | Value |
|-------|-------|
| Create project tx | [https://stellar.expert/explorer/testnet/tx/6c8bfc0cc528b9df7cf2c613358082c4996690d980e6dfec18786414ad029e03](https://stellar.expert/explorer/testnet/tx/6c8bfc0cc528b9df7cf2c613358082c4996690d980e6dfec18786414ad029e03) |
| Sponsor tx | [https://stellar.expert/explorer/testnet/tx/3da6052630aa1810eef5664dbfa80e31697e20f4481b57d7283f13bf07e2f4f7](https://stellar.expert/explorer/testnet/tx/3da6052630aa1810eef5664dbfa80e31697e20f4481b57d7283f13bf07e2f4f7) |
| Test project ID | `0` |
| Amount | 10 XLM (1000000000 stroops) |
| Verified | total_raised=1000000000, sponsor_count=1 |

## Native XLM Stellar Asset Contract

`CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`

## Network

- **Network:** Stellar Testnet
- **RPC URL:** https://soroban-testnet.stellar.org
- **Passphrase:** `Test SDF Network ; September 2015`
- **Explorer:** https://stellar.expert/explorer/testnet

## Deploy Script

```bash
# To deploy fresh contracts:
./scripts/deploy-contracts.sh --confirm-redeploy
```

> **Warning:** Re-running the script with `--confirm-redeploy` deploys **fresh**
> contracts at **new** addresses. Any projects already listed under the old
> addresses become unreachable.
