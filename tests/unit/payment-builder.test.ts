import { describe, it, expect } from "vitest";
import { buildPaymentTransaction } from "@/features/payments/payment-service";
import { Transaction, Networks, Keypair } from "stellar-sdk";

describe("Payment Builder - buildPaymentTransaction", () => {
  // Generate valid random Stellar keys for testing
  const sponsorKeypair = Keypair.random();
  const destinationKeypair = Keypair.random();
  const sponsorPublicKey = sponsorKeypair.publicKey();
  const destinationPublicKey = destinationKeypair.publicKey();
  const amountXLM = "150.5000000";
  const sequenceNumber = "123456789";

  it("should build a valid Stellar payment transaction with correct parameters", () => {
    const xdr = buildPaymentTransaction({
      sponsorPublicKey,
      destinationPublicKey,
      amountXLM,
      sequenceNumber,
    });

    expect(xdr).toBeDefined();
    expect(typeof xdr).toBe("string");

    // Decode the transaction from XDR to inspect internal parameters
    const decodedTx = new Transaction(xdr, Networks.TESTNET);

    expect(decodedTx.source).toBe(sponsorPublicKey);
    
    // In Stellar, the transaction sequence is incremented by 1 by the TransactionBuilder
    const expectedSequence = (BigInt(sequenceNumber) + BigInt(1)).toString();
    expect(decodedTx.sequence).toBe(expectedSequence);
    expect(decodedTx.operations.length).toBe(1);

    const op = decodedTx.operations[0];
    expect(op.type).toBe("payment");
    
    // Cast to check properties
    const paymentOp = op as any;
    expect(paymentOp.destination).toBe(destinationPublicKey);
    expect(paymentOp.amount).toBe(amountXLM);
    expect(paymentOp.asset.isNative()).toBe(true);
  });

  it("should throw error if public keys are invalid", () => {
    expect(() =>
      buildPaymentTransaction({
        sponsorPublicKey: "invalidKey",
        destinationPublicKey,
        amountXLM,
        sequenceNumber,
      })
    ).toThrow("Invalid sponsor public key format.");

    expect(() =>
      buildPaymentTransaction({
        sponsorPublicKey,
        destinationPublicKey: "invalidKey",
        amountXLM,
        sequenceNumber,
      })
    ).toThrow("Invalid destination public key format.");
  });

  it("should throw error if amount is zero or negative", () => {
    expect(() =>
      buildPaymentTransaction({
        sponsorPublicKey,
        destinationPublicKey,
        amountXLM: "0",
        sequenceNumber,
      })
    ).toThrow("Sponsorship amount must be greater than zero.");

    expect(() =>
      buildPaymentTransaction({
        sponsorPublicKey,
        destinationPublicKey,
        amountXLM: "-10",
        sequenceNumber,
      })
    ).toThrow("Sponsorship amount must be greater than zero.");
  });
});
