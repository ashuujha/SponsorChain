# SponsorChain 60–90 Second Demo Script

This script walks through the core user flows of SponsorChain on Stellar Testnet. 

---

## 🎙️ Walkthrough Script

### **0:00 - 0:15 | Intro & Authentication (15s)**
- **Visual**: Start on the SponsorChain Landing Page. Scroll slightly to show the monochrome bento-grid stats.
- **Narrative**: *"Welcome to SponsorChain, a decentralized platform for funding open source creators directly on the Stellar network. We're going to demonstrate how to sponsor a project in under 90 seconds. First, let's sign in with GitHub."*
- **Action**: Click **Sign In with GitHub** on the header. Authorize via GitHub OAuth popup.

### **0:15 - 0:35 | Wallet Connection & Funding (20s)**
- **Visual**: Navigate to the Wallet Connect screen.
- **Narrative**: *"Now, we connect our Stellar wallet. If we connect a new Testnet wallet, the platform automatically triggers Stellar Friendbot to auto-fund our ledger account with 10,000 XLM."*
- **Action**: Click **Connect Wallet** -> select **Freighter**. Watch the account load, check the success banner: *"Funded via Friendbot: 10,000 XLM"* and see the updated balance display.

### **0:35 - 0:55 | Project Selection & Payment Setup (20s)**
- **Visual**: Navigate to **Explore Projects**. Click on the **Stellar Core** project card.
- **Narrative**: *"With our wallet funded, we can explore verified repositories. Let's sponsor the Stellar Core project. We'll select the 'Developer lunch tier' for 50 XLM."*
- **Action**: Click **Explore**, click **Stellar Core**, scroll down to tiers, select **50 XLM**, and click **Sponsor with Wallet**.

### **0:55 - 1:15 | Transaction Signing & Submission (20s)**
- **Visual**: The payment confirmation overlay modal opens. Review state displays.
- **Narrative**: *"The platform builds the Stellar transaction envelope client-side. We sign the payment locally. SponsorChain never touches our keys."*
- **Action**: Click **Sign & Send Payment**. The Freighter wallet popup appears. Approve the transaction. The overlay transitions to **Pending** (loader spins) and then immediately to **Success** showing the transaction hash chip.

### **1:15 - 1:30 | Live Real-Time Feed & Explorer Verification (15s)**
- **Visual**: The overlay closes. The project's *Total Raised* counter increments by 50 XLM in real time. The "Live stream" pulse dot flashes green.
- **Narrative**: *"The project's total raised increments live from the Horizon stream without reloading. Finally, we can click the transaction hash to inspect the public block ledger on Stellar Expert to verify our sponsorship independently. Fully decentralized open-source funding in 90 seconds."*
- **Action**: Click the transaction hash chip. Show Stellar Expert loading the successful transaction.
