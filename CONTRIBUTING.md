# Contributing to SponsorChain (Beta Tester Guide)

Welcome to the SponsorChain beta testing program! 

Our core product metric is the **2-Minutes-to-First-Sponsorship friction goal**. We want any tester from Discord, Rise In, or Twitter to land on our app, set up their credentials, and complete their first verified Testnet sponsorship in less than 2 minutes.

---

## 🎯 What "Done" Looks Like for Testers

To help us validate this, follow this quick validation flow:

1. **Sign In**: Authenticate using your GitHub profile.
2. **Setup Wallet**: Open your Freighter (or xBull/Albedo) wallet extension, switch the network setting to **Testnet**, and click **Connect Wallet** inside SponsorChain.
3. **Friendbot Auto-Fund**: Check that the screen displays the 10,000 XLM funding notification when connecting a brand-new account.
4. **Onboard Repository (Optional)**:
   - Click **Projects** inside the dashboard.
   - Pick a repository you own, set a goal, configure a pricing tier, and register it.
5. **Sponsor a Creator**:
   - Go to **Explore Projects**.
   - Pick any project card, select a sponsorship tier, and click **Sponsor with Wallet**.
   - Approve the popup transaction in your Freighter extension.
6. **Live Confirm & Check Explorer**:
   - Verify that the overlay displays **Success** and provides a transaction hash chip.
   - Assert that the project's *Total Raised* counter increments in real-time.
   - Click the transaction hash to inspect the public record on Stellar Expert Testnet explorer.

If you accomplished this sequence in under **2 minutes**, the flow is verified!

---

## 🐛 Submitting Feedback & Bug Reports

If you hit any friction points, please open a GitHub Issue or report in Discord with:
- **Your Wallet Address** (for ledger transaction lookup).
- **Your Browser & OS version** (e.g. Chrome on Linux, Safari on iOS).
- **Step of failure**: Onboarding, Wallet Connect, Signing, Horizon stream updates, or explorer link routing.
- **Detailed Error message** if the transaction overlay displayed a `Failed` state.
