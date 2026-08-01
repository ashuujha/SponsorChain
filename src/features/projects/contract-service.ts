/**
 * ProjectRegistry Soroban contract interaction service.
 *
 * This service constructs calls to the on-chain ProjectRegistry contract
 * (Phase N3).  In production it submits real Soroban transactions; during
 * development it can be mocked.
 */

export interface CreateProjectParams {
  contractId: string;
  owner: string;
  repoFullName: string;
  name: string;
  description: string;
}

export interface UnsignedContractCall {
  contractId: string;
  functionName: string;
  args: {
    owner: string;
    repo_full_name: string;
    name: string;
    description: string;
  };
  simulatedFee: string;
  networkPassphrase: "Test SDF Network ; September 2015";
}

/**
 * Builds a representation of the unsigned Soroban transaction that would
 * call `ProjectRegistry.create_project(owner, repo_full_name, name, description)`.
 *
 * This is used in the review step to show the user exactly what will be
 * submitted on-chain before they sign.
 *
 * In production, this would:
 * 1. Fetch the sponsor account's sequence number from Horizon/RPC
 * 2. Build an InvokeHostFunctionOp with the contract call
 * 3. Simulate via Soroban RPC to get the fee and validate
 * 4. Return the fully built (unsigned) Transaction XDR
 */
export function buildUnsignedCreateProjectCall(
  params: CreateProjectParams
): UnsignedContractCall {
  return {
    contractId: params.contractId,
    functionName: "create_project",
    args: {
      owner: params.owner,
      repo_full_name: params.repoFullName,
      name: params.name,
      description: params.description,
    },
    simulatedFee: "0.00001 XLM",
    networkPassphrase: "Test SDF Network ; September 2015",
  };
}

/**
 * Submits the create_project transaction via Soroban RPC.
 *
 * Flow:
 * 1. Build InvokeHostFunctionOp
 * 2. Simulate → get fee / validate
 * 3. Sign with wallet → get signed XDR
 * 4. POST /sendTransaction to Soroban RPC
 * 5. Poll GET /getTransaction until status is SUCCESS
 *
 * Returns the transaction hash and the returned project_id from the contract.
 */
export async function submitCreateProject(
  params: CreateProjectParams,
  _signAndSubmit: (unsignedXdr: string) => Promise<{ txHash: string; projectId: string }>
): Promise<{ txHash: string; projectId: string }> {
  const unsigned = buildUnsignedCreateProjectCall(params);

  // In production, build the actual XDR and call the wallet for signing.
  // For the checkpoint, the caller provides a signAndSubmit implementation
  // (mock in tests, real RPC+wallet in production).
  const unsignedXdr = JSON.stringify(unsigned);
  return _signAndSubmit(unsignedXdr);
}

/**
 * Fetches a project from the on-chain ProjectRegistry by ID.
 *
 * Reads the persistent storage entry for the given project_id directly
 * from the Soroban RPC's getLedgerEntries or via a contract simulation
 * of `get_project`.
 */
export async function fetchProjectFromChain(
  contractId: string,
  projectId: bigint
): Promise<{
  owner: string;
  repoFullName: string;
  name: string;
  description: string;
  totalRaised: string;
  sponsorCount: number;
}> {
  // In production, simulates get_project(projectId) on the Soroban RPC.
  throw new Error(`Chain fetch for project ${projectId} on contract ${contractId} not implemented`);
}

export { REGISTRY_CONTRACT_ID, MANAGER_CONTRACT_ID, XLM_SAC_ADDRESS } from "./contract-data";
