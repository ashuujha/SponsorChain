import { Networks } from "stellar-sdk";

/**
 * SponsorChain production is Mainnet-only. Contract IDs and endpoints are
 * public configuration, but they must be supplied by the deployment
 * environment so a non-Mainnet contract can never become a production
 * fallback.
 */
export const STELLAR_NETWORK = "PUBLIC" as const;
export const NETWORK_PASSPHRASE = Networks.PUBLIC;

function mainnetEndpoint(value: string | undefined, fallback: string, name: string): string {
  const endpoint = (value || fallback).replace(/\/$/, "");
  if (/testnet|futurenet|friendbot/i.test(endpoint)) {
    throw new Error(`${name} must point to Stellar Mainnet, not a test network.`);
  }
  return endpoint;
}

export const HORIZON_URL = mainnetEndpoint(
  process.env.NEXT_PUBLIC_HORIZON_URL,
  "https://horizon.stellar.org",
  "NEXT_PUBLIC_HORIZON_URL"
);

// Stellar documents Mainnet Soroban RPC providers rather than one SDF-hosted
// public endpoint. The provider remains replaceable through deployment config.
export const SOROBAN_RPC_URL = mainnetEndpoint(
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL,
  "https://mainnet.sorobanrpc.com",
  "NEXT_PUBLIC_SOROBAN_RPC_URL"
);

export const EXPLORER_BASE = mainnetEndpoint(
  process.env.NEXT_PUBLIC_EXPLORER_BASE,
  "https://stellar.expert/explorer/public",
  "NEXT_PUBLIC_EXPLORER_BASE"
);
