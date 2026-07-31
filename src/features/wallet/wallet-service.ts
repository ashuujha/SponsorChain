export interface HorizonAccountResponse {
  balances: {
    asset_type: string;
    balance: string;
  }[];
}

/**
 * Pure function to check if the given Horizon account needs funding
 * @param account The account details from Horizon, or null if account doesn't exist
 */
export function checkNeedsFunding(account: HorizonAccountResponse | null): boolean {
  if (!account) return true;
  const nativeBalance = account.balances.find((b) => b.asset_type === "native");
  if (!nativeBalance) return true;
  return parseFloat(nativeBalance.balance) <= 0;
}

/**
 * Extracts native XLM balance from Horizon account response
 */
export function getNativeBalance(account: HorizonAccountResponse | null): string {
  if (!account) return "0.0000000";
  const nativeBalance = account.balances.find((b) => b.asset_type === "native");
  return nativeBalance ? nativeBalance.balance : "0.0000000";
}

/**
 * Queries the Stellar Horizon API for account details
 */
export async function fetchAccountFromHorizon(publicKey: string): Promise<HorizonAccountResponse | null> {
  const url = `https://horizon-testnet.stellar.org/accounts/${publicKey}`;
  
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Stellar Horizon returned error status ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    if (error instanceof Error && error.message.includes("status 404")) {
      return null;
    }
    throw error;
  }
}

/**
 * Invokes Stellar Friendbot to fund a testnet account
 */
export async function fundAccountViaFriendbot(publicKey: string): Promise<void> {
  const url = `https://friendbot.stellar.org/?addr=${publicKey}`;
  
  try {
    const res = await fetch(url, {
      method: "GET",
    });

    if (res.status === 429) {
      throw new Error("Friendbot rate limit exceeded. Please try again in a few minutes.");
    }

    if (!res.ok) {
      throw new Error(`Friendbot failed with status ${res.status}`);
    }

    // Success response indicates account is successfully funded
    await res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to contact Friendbot network.");
  }
}

const balancesCache: Record<string, { balance: string; timestamp: number }> = {};
const CACHE_TTL_MS = 30000; // 30 seconds cache

/**
 * Fetches XLM balances for a batch of public keys in parallel, using a client-side cache.
 */
export async function fetchBatchBalances(publicKeys: string[]): Promise<Record<string, string>> {
  const now = Date.now();
  const results: Record<string, string> = {};
  const fetchPromises: Promise<void>[] = [];

  for (const pk of publicKeys) {
    if (!pk) continue;

    // Check memory cache
    if (balancesCache[pk] && now - balancesCache[pk].timestamp < CACHE_TTL_MS) {
      results[pk] = balancesCache[pk].balance;
      continue;
    }

    const p = fetchAccountFromHorizon(pk)
      .then((account) => {
        const balance = getNativeBalance(account);
        balancesCache[pk] = { balance, timestamp: now };
        results[pk] = balance;
      })
      .catch((err) => {
        console.error(`Failed to batch fetch balance for key ${pk}:`, err);
        results[pk] = "0.0000000"; // fallback
      });

    fetchPromises.push(p);
  }

  await Promise.all(fetchPromises);
  return results;
}
