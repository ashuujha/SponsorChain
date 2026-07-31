import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean database
  await prisma.sponsorship.deleteMany({});
  await prisma.tier.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Maintainers
  const maintainer1 = await prisma.user.create({
    data: {
      githubId: "stellar-core-maintainer",
      walletPublicKey: "GA774A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z",
      role: "MAINTAINER",
    },
  });

  const maintainer2 = await prisma.user.create({
    data: {
      githubId: "soroban-maintainer",
      walletPublicKey: "GDX2U3V4W5X6Y7ZGA774A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0",
      role: "MAINTAINER",
    },
  });

  // 2. Create Sponsors
  const sponsor = await prisma.user.create({
    data: {
      githubId: "active-sponsor",
      walletPublicKey: "GBB3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9",
      role: "SPONSOR",
    },
  });

  // 3. Create Projects
  const project1 = await prisma.project.create({
    data: {
      ownerId: maintainer1.id,
      name: "Stellar Core",
      repoUrl: "stellar/stellar-core",
      description: "The backbone of the Stellar network, handling consensus, transactions, and ledger management.",
      fundingGoalXLM: 5000,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      ownerId: maintainer2.id,
      name: "Soroban SDK",
      repoUrl: "stellar/soroban-sdk",
      description: "Comprehensive Rust toolkit for building smart contracts on Soroban. Includes contract APIs.",
      fundingGoalXLM: 3000,
    },
  });

  // 4. Create Tiers
  await prisma.tier.createMany({
    data: [
      {
        projectId: project1.id,
        amountXLM: 10,
        label: "Coffee-sized sponsorship",
      },
      {
        projectId: project1.id,
        amountXLM: 50,
        label: "Developer lunch tier",
      },
      {
        projectId: project1.id,
        amountXLM: 250,
        label: "Enterprise backing tier",
      },
      {
        projectId: project2.id,
        amountXLM: 20,
        label: "Bronze tier backing",
      },
      {
        projectId: project2.id,
        amountXLM: 100,
        label: "Silver tier backing",
      },
    ],
  });

  console.log("Database seeded successfully with demo projects!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
