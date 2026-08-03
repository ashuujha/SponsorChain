import {
  Asset,
  Account,
  BASE_FEE,
  Networks,
  Operation,
  TransactionBuilder,
  StrKey,
} from "stellar-sdk";
import { fetchAccountFromHorizon, HorizonAccountResponse } from "../wallet/wallet-service";

/**
 * Validates a Stellar public key using the canonical StrKey check.
 * Rejects keys that merely look like "G" + 55 chars but have invalid base32 checksums.
 */
function assertValidPublicKey(key: string, label: string): void {
  if (!StrKey.isValidEd25519PublicKey(key)) {
    throw new Error(
      `Invalid ${label} public key. Expected a 56-character Stellar StrKey (starts with "G"). ` +
      `Received: "${key.slice(0, 8)}…" (length ${key.length}). ` +
      `Make sure the ${label} has connected a real Stellar wallet.`
    );
  }
}

/**
 * Builds an unsigned Stellar payment transaction envelope (XDR).
 * @param sponsorPublicKey - The public key of the sponsoring wallet
 * @param destinationPublicKey - The public key of the receiving maintainer wallet
 * @param amountXLM - Decimal string of the XLM amount to sponsor
 * @param sequenceNumber - The current sequence number of the sponsor account
 */
export function buildPaymentTransaction({
  sponsorPublicKey,
  destinationPublicKey,
  amountXLM,
  sequenceNumber,
}: {
  sponsorPublicKey: string;
  destinationPublicKey: string;
  amountXLM: string;
  sequenceNumber: string;
}): string {
  assertValidPublicKey(sponsorPublicKey, "sponsor");
  assertValidPublicKey(destinationPublicKey, "destination (maintainer)");
  if (parseFloat(amountXLM) <= 0) {
    throw new Error("Sponsorship amount must be greater than zero.");
  }

  const sourceAccount = new Account(sponsorPublicKey, sequenceNumber);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
    // Add default timebounds for security/correctness (10 minutes from now is typical)
    timebounds: {
      minTime: 0,
      maxTime: Math.floor(Date.now() / 1000) + 600,
    },
  })
    .addOperation(
      Operation.payment({
        destination: destinationPublicKey,
        asset: Asset.native(),
        amount: amountXLM,
      })
    )
    .build();

  return tx.toXDR();
}

/**
 * Helper to fetch sequence number and build the transaction.
 */
export async function preparePaymentTransaction({
  sponsorPublicKey,
  destinationPublicKey,
  amountXLM,
}: {
  sponsorPublicKey: string;
  destinationPublicKey: string;
  amountXLM: string;
}): Promise<string> {
  const accountRes = await fetchAccountFromHorizon(sponsorPublicKey);
  if (!accountRes) {
    throw new Error("Sponsor account not found or unfunded on the Stellar network.");
  }

  // Find the sequence number. Horizon returns the sequence as a string on the account details.
  // We need to parse or retrieve it.
  const sequenceNumber = (accountRes as HorizonAccountResponse & { sequence?: string }).sequence;
  if (!sequenceNumber) {
    throw new Error("Failed to retrieve sequence number from Horizon.");
  }

  return buildPaymentTransaction({
    sponsorPublicKey,
    destinationPublicKey,
    amountXLM,
    sequenceNumber,
  });
}

export interface HorizonTransactionRecord {
  id: string;
  hash: string;
  ledger: number;
  createdAt: string;
  successful: boolean;
  feeCharged: string;
  memoType: string;
  memo: string | null;
  stellarExpertUrl: string;
}

/**
 * Fetches recent transactions for a given account or contract address from Horizon Testnet.
 */
export async function fetchHorizonAccountTransactions(
  address: string,
  limit: number = 20
): Promise<HorizonTransactionRecord[]> {
  try {
    const url = `https://horizon-testnet.stellar.org/accounts/${address}/transactions?order=desc&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Horizon API error: HTTP status ${res.status}`);
    }
    const data = await res.json();
    const records = data._embedded?.records || [];
    return records.map((tx: Record<string, unknown>) => ({
      id: (tx.id as string) || (tx.hash as string),
      hash: tx.hash as string,
      ledger: (tx.ledger_attr as number) || (tx.ledger as number),
      createdAt: tx.created_at as string,
      successful: (tx.successful as boolean) ?? true,
      feeCharged: (tx.fee_charged as string) || "100",
      memoType: (tx.memo_type as string) || "none",
      memo: (tx.memo as string) || null,
      stellarExpertUrl: `https://stellar.expert/explorer/testnet/tx/${tx.hash}`,
    }));
  } catch (err) {
    console.warn("Horizon fetch account transactions error:", err);
    return [];
  }
}
