import { Networks } from "stellar-sdk";

/**
 * SponsorChain is configured for Stellar Testnet only in this deployment.
 * Contract IDs and endpoints remain deployment-provided configuration.
 */
export const STELLAR_NETWORK = "TESTNET" as const;
export const NETWORK_PASSPHRASE = Networks.TESTNET;

function testnetEndpoint(value: string | undefined, fallback: string, name: string): string {
  const endpoint = (value || fallback).replace(/\/$/, "");
  if (/mainnet|futurenet|public|horizon\.stellar\.org/i.test(endpoint)) {
    throw new Error(`${name} must point to Stellar Testnet, not another network.`);
  }
  return endpoint;
}

export const HORIZON_URL = testnetEndpoint(
  process.env.NEXT_PUBLIC_HORIZON_URL,
  "https://horizon-testnet.stellar.org",
  "NEXT_PUBLIC_HORIZON_URL"
);

export const SOROBAN_RPC_URL = testnetEndpoint(
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL,
  "https://soroban-testnet.stellar.org",
  "NEXT_PUBLIC_SOROBAN_RPC_URL"
);

export const EXPLORER_BASE = testnetEndpoint(
  process.env.NEXT_PUBLIC_EXPLORER_BASE,
  "https://stellar.expert/explorer/testnet",
  "NEXT_PUBLIC_EXPLORER_BASE"
);
