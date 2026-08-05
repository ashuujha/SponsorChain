import '@testing-library/jest-dom';

// Test-only Soroban contract IDs. Production code remains environment-only;
// these valid contract-shaped addresses let RPC transaction builders be
// exercised without accidentally requiring Testnet deployment credentials.
process.env.NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS ||=
  'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHK3M';
process.env.NEXT_PUBLIC_SPONSORSHIP_MANAGER_ADDRESS ||=
  'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHK3M';
