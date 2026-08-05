import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchOnChainProjects,
  fetchOnChainActivityEvents,
  OnChainEvent,
} from "@/lib/soroban-client";
import { ProjectData } from "@/features/projects/contract-data";
import {
  fetchHorizonAccountTransactions,
  HorizonTransactionRecord,
} from "@/features/payments/payment-service";

const BASE_POLL_INTERVAL = 15000; // 15 seconds
const MAX_POLL_INTERVAL = 60000; // 60 seconds

export function useOnChainProjects() {
  const [data, setData] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const pollIntervalRef = useRef<number>(BASE_POLL_INTERVAL);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async (isManual: boolean = false) => {
    if (isManual) {
      setIsRefreshing(true);
    }
    try {
      const projects = await fetchOnChainProjects();
      setData(projects);
      setError(null);
      pollIntervalRef.current = BASE_POLL_INTERVAL;
    } catch (err) {
      console.error("useOnChainProjects fetch error:", err);
      setError(err instanceof Error ? err : new Error("Failed to load projects from Stellar Mainnet"));
      pollIntervalRef.current = Math.min(pollIntervalRef.current * 2, MAX_POLL_INTERVAL);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const scheduleNextPoll = () => {
      timerRef.current = setTimeout(async () => {
        if (!isMounted) return;
        await loadData(false);
        if (isMounted) {
          scheduleNextPoll();
        }
      }, pollIntervalRef.current);
    };

    loadData(false).then(() => {
      if (isMounted) {
        scheduleNextPoll();
      }
    });

    return () => {
      isMounted = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [loadData]);

  const refetch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    pollIntervalRef.current = BASE_POLL_INTERVAL;
    return loadData(true);
  }, [loadData]);

  return { data, isLoading, isRefreshing, error, refetch };
}

export function useOnChainActivity() {
  const [data, setData] = useState<OnChainEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const pollIntervalRef = useRef<number>(BASE_POLL_INTERVAL);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async (isManual: boolean = false) => {
    if (isManual) {
      setIsRefreshing(true);
    }
    try {
      const events = await fetchOnChainActivityEvents();
      setData(events);
      setError(null);
      pollIntervalRef.current = BASE_POLL_INTERVAL;
    } catch (err) {
      console.error("useOnChainActivity fetch error:", err);
      setError(err instanceof Error ? err : new Error("Failed to load activity events"));
      pollIntervalRef.current = Math.min(pollIntervalRef.current * 2, MAX_POLL_INTERVAL);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const scheduleNextPoll = () => {
      timerRef.current = setTimeout(async () => {
        if (!isMounted) return;
        await loadData(false);
        if (isMounted) {
          scheduleNextPoll();
        }
      }, pollIntervalRef.current);
    };

    loadData(false).then(() => {
      if (isMounted) {
        scheduleNextPoll();
      }
    });

    return () => {
      isMounted = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [loadData]);

  const refetch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    pollIntervalRef.current = BASE_POLL_INTERVAL;
    return loadData(true);
  }, [loadData]);

  return { data, isLoading, isRefreshing, error, refetch };
}

export function useOnChainTransactions(address?: string) {
  const [data, setData] = useState<HorizonTransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const pollIntervalRef = useRef<number>(BASE_POLL_INTERVAL);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async (isManual: boolean = false) => {
    if (!address) {
      setData([]);
      setIsLoading(false);
      return;
    }
    if (isManual) {
      setIsRefreshing(true);
    }
    try {
      const txs = await fetchHorizonAccountTransactions(address);
      setData(txs);
      setError(null);
      pollIntervalRef.current = BASE_POLL_INTERVAL;
    } catch (err) {
      console.error("useOnChainTransactions fetch error:", err);
      setError(err instanceof Error ? err : new Error("Failed to load transactions"));
      pollIntervalRef.current = Math.min(pollIntervalRef.current * 2, MAX_POLL_INTERVAL);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [address]);

  useEffect(() => {
    let isMounted = true;

    const scheduleNextPoll = () => {
      timerRef.current = setTimeout(async () => {
        if (!isMounted) return;
        await loadData(false);
        if (isMounted) {
          scheduleNextPoll();
        }
      }, pollIntervalRef.current);
    };

    loadData(false).then(() => {
      if (isMounted) {
        scheduleNextPoll();
      }
    });

    return () => {
      isMounted = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [loadData]);

  const refetch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    pollIntervalRef.current = BASE_POLL_INTERVAL;
    return loadData(true);
  }, [loadData]);

  return { data, isLoading, isRefreshing, error, refetch };
}
