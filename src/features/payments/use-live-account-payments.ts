import { useEffect, useState, useRef, useCallback } from "react";
import { fetchAccountFromHorizon, getNativeBalance } from "../wallet/wallet-service";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected" | "polling";

export interface HorizonPaymentEvent {
  id: string;
  type: string;
  source_account: string;
  to: string;
  from: string;
  amount: string;
  transaction_hash: string;
  created_at: string;
}

// Pure state transitions for the stream status machine
export interface StreamState {
  status: ConnectionStatus;
  errorCount: number;
}

export function handleStreamError(state: StreamState, maxRetries: number = 3): StreamState {
  const nextErrorCount = state.errorCount + 1;
  const status = nextErrorCount >= maxRetries ? "polling" : "reconnecting";
  return {
    status,
    errorCount: nextErrorCount,
  };
}

export function handleStreamOpen(): StreamState {
  return {
    status: "connected",
    errorCount: 0,
  };
}

export function useLiveAccountPayments(accountId: string | null) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [payments, setPayments] = useState<HorizonPaymentEvent[]>([]);
  const [totalRaised, setTotalRaised] = useState<string>("0.0000000");
  
  const errorCountRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);

  // Manual/Initial data fetch
  const fetchCurrentData = useCallback(async (targetId: string) => {
    try {
      // 1. Fetch account native balance
      const account = await fetchAccountFromHorizon(targetId);
      if (isComponentMounted.current) {
        setTotalRaised(getNativeBalance(account));
      }

      // 2. Fetch recent payments
      const paymentsUrl = `https://horizon-testnet.stellar.org/accounts/${targetId}/payments?limit=10&order=desc`;
      const res = await fetch(paymentsUrl);
      if (res.ok) {
        const data = await res.json();
        const paymentsList = data._embedded?.records || [];
        if (isComponentMounted.current) {
          setPayments(paymentsList);
        }
      }
    } catch (err) {
      console.error("Error fetching live data:", err);
    }
  }, []);

  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!accountId) {
      setStatus("disconnected");
      setPayments([]);
      setTotalRaised("0.0000000");
      return;
    }

    // Load initial data
    fetchCurrentData(accountId);

    // Setup SSE connection
    let eventSource: EventSource | null = null;
    const pollIntervalSeconds = 10;
    
    const stopStream = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    const stopPolling = () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };

    const startPolling = () => {
      stopPolling();
      setStatus("polling");
      
      // Perform immediate fetch then set interval
      fetchCurrentData(accountId);
      
      pollingTimerRef.current = setInterval(() => {
        if (!isComponentMounted.current) return;
        fetchCurrentData(accountId);
      }, pollIntervalSeconds * 1000);
    };

    const startSSE = () => {
      stopPolling();
      stopStream();

      if (!isComponentMounted.current) return;

      const url = `https://horizon-testnet.stellar.org/accounts/${accountId}/payments?cursor=now`;
      
      try {
        eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          if (!isComponentMounted.current) return;
          const nextState = handleStreamOpen();
          setStatus(nextState.status);
          errorCountRef.current = nextState.errorCount;
        };

        eventSource.onmessage = (event) => {
          if (!isComponentMounted.current) return;
          try {
            const data: HorizonPaymentEvent = JSON.parse(event.data);
            
            // Only add payment if it is incoming and a payment operation
            if (data.type === "payment" && data.to === accountId) {
              setPayments((prev) => [data, ...prev.slice(0, 9)]);
              // Refresh account balance live when a new payment occurs
              fetchCurrentData(accountId);
            }
          } catch (err) {
            console.error("Error parsing live payment data:", err);
          }
        };

        eventSource.onerror = () => {
          if (!isComponentMounted.current) return;
          
          const nextState = handleStreamError(
            { status: "reconnecting", errorCount: errorCountRef.current },
            3 // max retries before fallback
          );

          errorCountRef.current = nextState.errorCount;
          setStatus(nextState.status);

          if (nextState.status === "polling") {
            stopStream();
            startPolling();
          }
        };
      } catch (err) {
        console.error("Failed to construct EventSource:", err);
        startPolling();
      }
    };

    startSSE();

    return () => {
      stopStream();
      stopPolling();
    };
  }, [accountId, fetchCurrentData]);

  return {
    status,
    payments,
    totalRaised,
    refresh: () => accountId && fetchCurrentData(accountId),
  };
}
