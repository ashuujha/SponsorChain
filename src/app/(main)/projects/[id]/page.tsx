"use client";

import React, { useState, useEffect, useReducer } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWallet } from "@/features/wallet/use-wallet";
import { useLiveAccountPayments } from "@/features/payments/use-live-account-payments";
import { paymentReducer, initialPaymentState } from "@/features/payments/payment-reducer";
import { preparePaymentTransaction } from "@/features/payments/payment-service";

interface DBTier {
  id: string;
  amountXLM: string;
  label: string;
}

interface DBSponsorship {
  txHash: string;
  amountXLM: string;
  sponsor: {
    githubId: string;
  };
}

interface DBProject {
  id: string;
  name: string;
  repoUrl: string;
  description: string;
  fundingGoalXLM: string;
  owner: {
    githubId: string;
    walletPublicKey: string | null;
  };
  tiers: DBTier[];
  sponsorships: DBSponsorship[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const wallet = useWallet();
  const [project, setProject] = useState<DBProject | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [errorProject, setErrorProject] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const [selectedTier, setSelectedTier] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");

  // Payment states reducer
  const [paymentState, dispatch] = useReducer(paymentReducer, initialPaymentState);

  // Fetch project metadata
  const loadProject = () => {
    setIsLoadingProject(true);
    setErrorProject(null);
    setIsNotFound(false);
    fetch(`/api/projects/${id}`)
      .then(async (res) => {
        if (res.status === 404) {
          setIsNotFound(true);
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Server error (${res.status}). Please try again.`);
        }
        const data = await res.json();
        setProject(data.project);

        // Pick first tier as default if available
        if (data.project?.tiers?.length > 0) {
          setSelectedTier(data.project.tiers[0].id);
        }
      })
      .catch((err) => {
        console.error("[ProjectDetailPage] Failed to load project:", err);
        setErrorProject(err.message || "Failed to load project. Please check your connection.");
      })
      .finally(() => {
        setIsLoadingProject(false);
      });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadProject, [id]);

  // Connect live stream hook to owner's wallet public key
  const ownerWalletKey = project?.owner?.walletPublicKey || null;
  const livePayments = useLiveAccountPayments(ownerWalletKey);

  const handleCustomAmountFocus = () => {
    setSelectedTier("");
  };

  const handleTierChange = (tierId: string) => {
    setSelectedTier(tierId);
    setCustomAmount("");
  };

  // Determine amount based on selections
  const getSelectedAmount = (): string => {
    if (customAmount) return customAmount;
    const tier = project?.tiers.find((t) => t.id === selectedTier);
    return tier ? tier.amountXLM : "0.00";
  };

  const handleStartSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.isConnected) {
      await wallet.connect();
      return;
    }
    const amount = getSelectedAmount();
    if (parseFloat(amount) <= 0) {
      alert("Please select a tier or enter a custom amount greater than 0.");
      return;
    }
    dispatch({ type: "START_REVIEW" });
  };

  const handleConfirmPayment = async () => {
    if (!wallet.publicKey || !ownerWalletKey || !project) return;
    const amount = getSelectedAmount();

    dispatch({ type: "SUBMIT" });

    try {
      // 1. Fetch sequence and build transaction envelope (XDR)
      const xdr = await preparePaymentTransaction({
        sponsorPublicKey: wallet.publicKey,
        destinationPublicKey: ownerWalletKey,
        amountXLM: amount,
      });

      // 2. Sign transaction via the wallet extension
      const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit");
      const { FreighterModule, xBullModule, AlbedoModule, RabetModule, LobstrModule, WalletNetwork } = await import(
        "@creit.tech/stellar-wallets-kit"
      );
      
      const kit = new StellarWalletsKit({
        network: WalletNetwork.TESTNET,
        modules: [
          new FreighterModule(),
          new xBullModule(),
          new AlbedoModule(),
          new RabetModule(),
          new LobstrModule(),
        ],
      });

      // Since wallet connected before, reconnect to make sure kit selected active module
      const savedAddress = localStorage.getItem("sponsorchain_wallet_pk");
      if (savedAddress) {
        // Find which wallet was selected. For simplicity we use Freighter as primary default
        kit.setWallet("freighter");
      }

      const { signedTxXdr } = await kit.signTransaction(xdr, {
        networkPassphrase: "Test SDF Network ; September 2015",
      });

      // 3. Submit transaction directly to Horizon from client
      const formData = new URLSearchParams();
      formData.append("tx", signedTxXdr);

      const res = await fetch("https://horizon-testnet.stellar.org/transactions", {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const resData = await res.json();

      if (!res.ok) {
        const opCode = resData.extras?.result_codes?.operations?.[0] || resData.detail || "Transaction failed.";
        throw new Error(opCode);
      }

      const txHash = resData.hash;
      dispatch({ type: "RECEIVE_HASH", txHash });

      // 4. Fire background metadata cache write to Postgres (non-blocking)
      fetch("/api/sponsorships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          txHash,
          amountXLM: amount,
        }),
      }).catch((dbErr) => console.error("Database cache write failed:", dbErr));

      // Successfully confirmed
      dispatch({ type: "SUCCESS" });
      
      // Refresh live payments stream
      livePayments.refresh();
      wallet.refreshBalance();
    } catch (err: unknown) {
      console.error("Payment execution failed:", err);
      dispatch({ type: "FAIL", error: err as Error });
    }
  };

  if (isLoadingProject) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-md">
        <span className="animate-spin material-symbols-outlined text-[40px] text-primary">progress_activity</span>
        <p className="font-semibold text-on-surface-variant text-body-md">Retrieving project metadata...</p>
      </div>
    );
  }

  if (isNotFound || (!isLoadingProject && !errorProject && !project)) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-md">
        <span className="material-symbols-outlined text-[48px] text-secondary">search_off</span>
        <h3 className="font-bold text-headline-md text-primary">Project not found</h3>
        <p className="text-on-surface-variant text-body-sm">
          This project doesn&apos;t exist or may have been removed.
        </p>
        <Link href="/explore" className="inline-block bg-primary text-on-primary px-lg py-md rounded-full font-semibold">
          Browse Projects
        </Link>
      </div>
    );
  }

  if (errorProject) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-md">
        <span className="material-symbols-outlined text-[48px] text-error">wifi_off</span>
        <h3 className="font-bold text-headline-md text-primary">Failed to load project</h3>
        <p className="text-on-surface-variant text-body-sm">{errorProject}</p>
        <div className="flex gap-sm justify-center">
          <button
            onClick={loadProject}
            className="bg-primary text-on-primary px-lg py-md rounded-full font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            Retry
          </button>
          <Link href="/explore" className="inline-block border border-outline-variant text-primary px-lg py-md rounded-full font-semibold hover:bg-surface-container-low transition-colors">
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  // Cross-reference Horizon payments with database Cache to resolve Github usernames
  const sponsorNameMap: Record<string, string> = {};
  project.sponsorships.forEach((s) => {
    sponsorNameMap[s.txHash] = s.sponsor.githubId;
  });

  // Calculate live values from Horizon stream
  const raisedLiveVal = parseFloat(livePayments.totalRaised);
  const goalVal = parseFloat(project.fundingGoalXLM);
  const progressLive = goalVal > 0 ? Math.min(100, Math.round((raisedLiveVal / goalVal) * 100)) : 0;

  // Stream status indicator configuration
  const streamStatusDetails = {
    connected: { color: "bg-[#2E7D32]", pulse: "animate-pulse", label: "Live stream" },
    reconnecting: { color: "bg-[#EF6C00]", pulse: "animate-pulse", label: "Reconnecting..." },
    disconnected: { color: "bg-[#C62828]", pulse: "", label: "Disconnected" },
    polling: { color: "bg-[#1565C0]", pulse: "animate-pulse", label: "Polling fallback" },
  }[livePayments.status];

  return (
    <div className="pb-xl px-gutter max-w-container-max mx-auto pt-8 relative">
      {/* Breadcrumb */}
      <Link href="/explore" className="inline-flex items-center gap-xs text-on-surface-variant font-body-sm text-body-sm hover:text-primary transition-colors mb-lg">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Explore
      </Link>

      <div className="flex flex-col lg:flex-row gap-xl">
        {/* Left/Main Column */}
        <div className="flex-grow space-y-xl max-w-4xl">
          {/* Project Header */}
          <div className="flex flex-col md:flex-row md:items-center gap-lg">
            <div className="w-24 h-24 rounded-2xl bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant">
              <span className="material-symbols-outlined text-[48px] text-neutral-500">hub</span>
            </div>
            <div className="space-y-xs">
              <h2 className="font-headline-lg text-headline-lg text-on-background font-bold">{project.name}</h2>
              <a
                className="flex items-center gap-xs text-on-surface-variant font-mono-code text-body-sm hover:text-primary"
                href={`https://github.com/${project.repoUrl}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="material-symbols-outlined text-[16px]">terminal</span>
                {project.repoUrl}
              </a>
            </div>
          </div>

          {/* Description */}
          <p className="font-body-lg text-body-lg text-on-surface max-w-3xl leading-relaxed">
            {project.description}
          </p>

          {/* Stat Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            {/* Total Raised */}
            <div className="bg-white p-md rounded-2xl border border-outline-variant flex flex-col justify-between h-32">
              <span className="text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider font-semibold">Total Raised</span>
              <div className="flex flex-col">
                <div className="flex items-center gap-sm">
                  <span className="font-headline-md text-headline-md text-on-background font-bold">
                    {raisedLiveVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XLM
                  </span>
                  <span className={`w-2 h-2 rounded-full ${streamStatusDetails.color} ${streamStatusDetails.pulse}`}></span>
                </div>
                <span className="text-on-surface-variant text-[11px] font-medium flex items-center gap-xs mt-xs">
                  <span className="uppercase text-[9px] px-sm py-xs bg-surface-container rounded font-bold">
                    {streamStatusDetails.label}
                  </span>
                  <span>via Horizon</span>
                </span>
              </div>
            </div>
            {/* Sponsors */}
            <div className="bg-white p-md rounded-2xl border border-outline-variant flex flex-col justify-between h-32">
              <span className="text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider font-semibold">Sponsors</span>
              <span className="font-headline-md text-headline-md text-on-background font-bold">{livePayments.payments.length}</span>
            </div>
            {/* Funding Goal */}
            <div className="bg-white p-md rounded-2xl border border-outline-variant flex flex-col justify-between h-32">
              <span className="text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider font-semibold">Funding Goal</span>
              <div className="space-y-sm">
                <div className="flex justify-between items-baseline">
                  <span className="font-headline-md text-headline-md text-on-background font-bold">
                    {parseFloat(project.fundingGoalXLM).toLocaleString()} XLM
                  </span>
                  <span className="text-body-sm font-medium">{progressLive}%</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-500" style={{ width: `${progressLive}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Sponsorships */}
          <section className="space-y-lg">
            <h3 className="font-headline-md text-headline-md text-on-background font-bold font-display">Recent Sponsorships</h3>
            <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
              {livePayments.payments.length === 0 ? (
                <div className="p-xl text-center text-on-surface-variant text-body-sm">
                  No sponsorships recorded on the network yet. Be the first!
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/30">
                  {livePayments.payments.map((payment) => {
                    const resolvedName = sponsorNameMap[payment.transaction_hash] || "Anonymous";
                    const shortHash = `${payment.transaction_hash.slice(0, 6)}...${payment.transaction_hash.slice(-6)}`;
                    
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-md hover:bg-surface-container-low transition-colors">
                        <div className="flex items-center gap-md">
                          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant">
                            <span className="material-symbols-outlined text-neutral-400">person</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-on-background">{resolvedName}</span>
                            <span className="text-on-surface-variant text-body-sm">
                              {new Date(payment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-lg">
                          <span className="font-bold text-on-background">{parseFloat(payment.amount).toLocaleString()} XLM</span>
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${payment.transaction_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-surface-container px-sm py-xs rounded-lg flex items-center gap-xs cursor-pointer hover:bg-surface-container-high transition-all"
                          >
                            <span className="font-mono-code text-mono-code text-on-surface-variant">{shortHash}</span>
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Info Box */}
          <div className="bg-surface-container p-lg rounded-2xl space-y-sm">
            <div className="flex items-center gap-sm text-on-background">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
              <h4 className="font-semibold text-body-lg">Verify independently</h4>
            </div>
            <p className="text-on-surface-variant text-body-sm leading-relaxed">
              Every transaction above is publicly verifiable on the Stellar ledger — click any transaction hash to view its details on Stellar Expert or any other block explorer.
            </p>
          </div>
        </div>

        {/* Right Column (Sticky Card) */}
        <div className="lg:w-80 shrink-0">
          <div className="sticky top-24 space-y-lg">
            <div className="bg-white p-lg rounded-2xl border border-outline-variant space-y-lg shadow-sm">
              <h3 className="font-headline-md text-headline-md text-on-background font-bold font-display">Sponsor this project</h3>
              
              {/* Tiers */}
              <div className="space-y-sm">
                {project.tiers.map((tier) => (
                  <label key={tier.id} className="block cursor-pointer">
                    <input
                      type="radio"
                      name="tier"
                      className="hidden peer"
                      checked={selectedTier === tier.id}
                      onChange={() => handleTierChange(tier.id)}
                    />
                    <div className="p-md rounded-xl border border-outline-variant peer-checked:border-primary peer-checked:bg-surface-container-low transition-all">
                      <span className="font-semibold text-on-background block">{parseFloat(tier.amountXLM).toLocaleString()} XLM</span>
                      <span className="text-on-surface-variant text-body-sm">{tier.label}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="space-y-xs">
                <label className="font-label-caps text-label-caps text-on-surface-variant font-semibold">Custom Amount</label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container border-none rounded-xl py-md px-md focus:ring-1 focus:ring-primary font-body-lg text-body-lg transition-all"
                    placeholder="0.00"
                    type="number"
                    value={customAmount}
                    onFocus={handleCustomAmountFocus}
                    onChange={(e) => setCustomAmount(e.target.value)}
                  />
                  <span className="absolute right-md top-1/2 -translate-y-1/2 font-mono-code text-on-surface-variant">XLM</span>
                </div>
              </div>

              <button
                onClick={handleStartSponsor}
                className="w-full bg-primary text-on-primary py-md rounded-full font-bold text-body-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-sm"
              >
                <span className="material-symbols-outlined">electric_bolt</span>
                {wallet.isConnected ? "Sponsor with Wallet" : "Connect Wallet to Sponsor"}
              </button>

              <p className="text-on-surface-variant text-[11px] text-center leading-normal">
                SponsorChain is currently running on Stellar Testnet. No real funds are required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Overlay Modal/Dialog */}
      {paymentState.status !== "idle" && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-md backdrop-blur-sm">
          <div className="bg-white border border-outline-variant rounded-2xl w-full max-w-[480px] shadow-lg overflow-hidden flex flex-col p-lg space-y-lg animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-background font-bold">
                {paymentState.status === "review" && "Confirm Transaction"}
                {paymentState.status === "pending" && "Submitting transaction..."}
                {paymentState.status === "success" && "Sponsorship Completed!"}
                {paymentState.status === "failed" && "Transaction Failed"}
              </h3>
              {paymentState.status !== "pending" && (
                <button
                  onClick={() => dispatch({ type: "RESET" })}
                  className="material-symbols-outlined text-on-surface-variant hover:text-primary p-xs rounded-full hover:bg-surface-container"
                >
                  close
                </button>
              )}
            </div>

            {/* Review State */}
            {paymentState.status === "review" && (
              <div className="space-y-lg">
                <div className="p-lg bg-surface-container rounded-xl text-center space-y-xs">
                  <span className="text-on-surface-variant text-body-sm font-semibold uppercase tracking-wider block">Sponsorship Value</span>
                  <span className="font-headline-lg text-headline-lg text-primary font-bold">{getSelectedAmount()} XLM</span>
                </div>
                <div className="space-y-md text-body-sm font-semibold">
                  <div className="flex justify-between border-b border-outline-variant/30 pb-xs">
                    <span className="text-on-surface-variant">Sponsor Key:</span>
                    <span className="font-mono-code text-on-background">
                      {wallet.publicKey?.slice(0, 6)}...{wallet.publicKey?.slice(-6)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant/30 pb-xs">
                    <span className="text-on-surface-variant">Recipient Key:</span>
                    <span className="font-mono-code text-on-background">
                      {ownerWalletKey?.slice(0, 6)}...{ownerWalletKey?.slice(-6)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-outline-variant/30 pb-xs">
                    <span className="text-on-surface-variant">Stellar Network:</span>
                    <span className="text-on-background">Testnet</span>
                  </div>
                  <div className="flex justify-between pb-xs">
                    <span className="text-on-surface-variant">Est. Network Fee:</span>
                    <span className="text-on-background">0.0000100 XLM</span>
                  </div>
                </div>
                <button
                  onClick={handleConfirmPayment}
                  className="w-full bg-primary text-on-primary py-md rounded-full font-bold text-body-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-sm"
                >
                  <span className="material-symbols-outlined">edit_document</span>
                  Sign & Send Payment
                </button>
              </div>
            )}

            {/* Pending State */}
            {paymentState.status === "pending" && (
              <div className="py-xl flex flex-col items-center justify-center text-center space-y-md">
                <span className="animate-spin material-symbols-outlined text-[48px] text-primary">progress_activity</span>
                <p className="font-semibold text-body-md text-on-background">
                  {paymentState.txHash ? "Confirming ledger submission..." : "Please sign the transaction in your wallet..."}
                </p>
                {paymentState.txHash && (
                  <div className="w-full p-sm bg-surface-container rounded-lg font-mono-code text-[11px] truncate">
                    Tx Hash: {paymentState.txHash}
                  </div>
                )}
              </div>
            )}

            {/* Success State */}
            {paymentState.status === "success" && (
              <div className="space-y-lg text-center">
                <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto text-[#2E7D32]">
                  <span className="material-symbols-outlined text-[36px]">verified</span>
                </div>
                <div className="space-y-xs">
                  <h4 className="font-bold text-body-lg text-near-black">Successfully sponsored {getSelectedAmount()} XLM!</h4>
                  <p className="text-on-surface-variant text-body-sm">
                    Thank you for supporting {project.name}. The contribution is now live on the public ledger.
                  </p>
                </div>
                {paymentState.txHash && (
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${paymentState.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-surface-container hover:bg-surface-container-high transition-colors py-sm px-md rounded-xl font-semibold text-body-sm text-on-surface-variant flex items-center justify-center gap-xs"
                  >
                    View Transaction
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                )}
                <button
                  onClick={() => dispatch({ type: "RESET" })}
                  className="w-full bg-primary text-on-primary py-md rounded-full font-bold text-body-lg hover:opacity-90 active:scale-95 transition-all"
                >
                  Close Confirmation
                </button>
              </div>
            )}

            {/* Failed State */}
            {paymentState.status === "failed" && (
              <div className="space-y-lg">
                <div className="p-md bg-error-container text-on-error-container text-body-sm rounded-xl border border-error/15 text-left font-medium">
                  {paymentState.errorType === "insufficient_balance" && (
                    <span><strong>Insufficient funds:</strong> Your connected wallet does not hold enough XLM to complete this transaction. Please fund your wallet and try again.</span>
                  )}
                  {paymentState.errorType === "user_rejected" && (
                    <span><strong>Signature rejected:</strong> You declined the signature request inside your wallet extension.</span>
                  )}
                  {paymentState.errorType === "network_error" && (
                    <span><strong>Network Timeout:</strong> Failed to connect to the Stellar Horizon network. The network could be congested or rate limited.</span>
                  )}
                  {paymentState.errorType === "unknown" && (
                    <span><strong>Transaction Failed:</strong> {paymentState.errorMessage || "Submission returned an unexpected error."}</span>
                  )}
                </div>
                <div className="flex gap-md">
                  <button
                    onClick={() => dispatch({ type: "RESET" })}
                    className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface-variant py-md rounded-full font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    className="flex-1 bg-primary text-on-primary py-md rounded-full font-semibold hover:opacity-90 active:scale-95 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
