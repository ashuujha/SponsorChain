import {
  Asset,
  Account,
  BASE_FEE,
  Networks,
  Operation,
  TransactionBuilder,
} from "stellar-sdk";
import { fetchAccountFromHorizon, HorizonAccountResponse } from "../wallet/wallet-service";

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
  if (!sponsorPublicKey || sponsorPublicKey.length !== 56 || !sponsorPublicKey.startsWith("G")) {
    throw new Error("Invalid sponsor public key format.");
  }
  if (!destinationPublicKey || destinationPublicKey.length !== 56 || !destinationPublicKey.startsWith("G")) {
    throw new Error("Invalid destination public key format.");
  }
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
