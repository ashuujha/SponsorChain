import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Friendbot-funded Stellar testnet maintainer public keys (verified 10,000 XLM balance each)
const MAINTAINER_A_KEY = "GDWRICGODLLQE65PC5UHEOYOMI34DXJG2ML2VRPJQLRYYURUVIEPQ3SE";
const MAINTAINER_B_KEY = "GCA2ACE5I25ICOOI3DPTH6U7SA26HY3IHNRFAYU5K76YBI6WCFATIYAK";

async function main() {
  console.log("Seeding database with demo maintainers and projects...");

  // 1. Create or upsert Maintainer A
  const maintainerA = await prisma.user.upsert({
    where: { walletPublicKey: MAINTAINER_A_KEY },
    update: {},
    create: {
      walletPublicKey: MAINTAINER_A_KEY,
      githubUsername: "stellar",
      role: "MAINTAINER",
    },
  });

  // 2. Create or upsert Maintainer B
  const maintainerB = await prisma.user.upsert({
    where: { walletPublicKey: MAINTAINER_B_KEY },
    update: {},
    create: {
      walletPublicKey: MAINTAINER_B_KEY,
      githubUsername: "freighter-dev",
      role: "MAINTAINER",
    },
  });

  // 3. Demo projects
  const demoProjects = [
    {
      id: "0",
      ownerId: maintainerA.id,
      ownerWalletKey: MAINTAINER_A_KEY,
      repoUrl: "stellar/js-stellar-sdk",
      name: "js-stellar-sdk",
      description: "JavaScript client library for communicating with a Horizon server.",
      fundingGoalXLM: "5000",
      tiers: [
        { label: "Supporter", amountXLM: "10" },
        { label: "Backer", amountXLM: "50" },
        { label: "Sponsor", amountXLM: "100" },
      ],
    },
    {
      id: "1",
      ownerId: maintainerA.id,
      ownerWalletKey: MAINTAINER_A_KEY,
      repoUrl: "stellar/soroban-examples",
      name: "soroban-examples",
      description: "Essential example contracts for Soroban smart contract development on Stellar.",
      fundingGoalXLM: "10000",
      tiers: [
        { label: "Supporter", amountXLM: "10" },
        { label: "Backer", amountXLM: "50" },
        { label: "Sponsor", amountXLM: "100" },
      ],
    },
    {
      id: "2",
      ownerId: maintainerB.id,
      ownerWalletKey: MAINTAINER_B_KEY,
      repoUrl: "stellar/stellar-core",
      name: "stellar-core",
      description: "Stellar Core — the reference implementation of the Stellar Consensus Protocol.",
      fundingGoalXLM: "25000",
      tiers: [
        { label: "Supporter", amountXLM: "25" },
        { label: "Backer", amountXLM: "100" },
        { label: "Sponsor", amountXLM: "500" },
      ],
    },
    {
      id: "3",
      ownerId: maintainerB.id,
      ownerWalletKey: MAINTAINER_B_KEY,
      repoUrl: "stellar-freighter/freighter",
      name: "freighter",
      description: "Freighter is a Stellar wallet browser extension for Chrome, Firefox, and Brave.",
      fundingGoalXLM: "15000",
      tiers: [
        { label: "Supporter", amountXLM: "15" },
        { label: "Backer", amountXLM: "75" },
        { label: "Sponsor", amountXLM: "250" },
      ],
    },
  ];

  for (const p of demoProjects) {
    const { tiers, ...projectData } = p;
    await prisma.project.upsert({
      where: { repoUrl: projectData.repoUrl },
      update: {
        ownerWalletKey: projectData.ownerWalletKey,
        name: projectData.name,
        description: projectData.description,
      },
      create: {
        ...projectData,
        tiers: {
          create: tiers,
        },
      },
    });
  }

  console.log("Database successfully seeded!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
