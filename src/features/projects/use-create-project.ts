"use client";

import { useReducer, useCallback } from "react";
import {
  createProjectReducer,
  initialCreateProjectState,
  CreateProjectState,
} from "./create-project-reducer";
import {
  buildUnsignedCreateProjectCall,
  submitCreateProject,
  CreateProjectParams,
} from "./contract-service";

export interface UseCreateProjectReturn {
  state: CreateProjectState;
  unsignedCall: ReturnType<typeof buildUnsignedCreateProjectCall> | null;
  buildReview: (params: CreateProjectParams) => void;
  submit: (
    params: CreateProjectParams,
    signAndSubmit: (unsignedXdr: string) => Promise<{ txHash: string; projectId: bigint }>
  ) => Promise<void>;
  reset: () => void;
}

export const PROJECT_REGISTRY_CONTRACT_ID =
  process.env.NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS ||
  "CDTINQP4HOUWLLCUCGOVTLPYHVHVP3KIYVVCKWHPIWQEIOGO775FIDN6";

export function useCreateProject(): UseCreateProjectReturn {
  const [state, dispatch] = useReducer(
    createProjectReducer,
    initialCreateProjectState
  );
  const [unsignedCall, setUnsignedCall] = useReducer(
    (
      _prev: ReturnType<typeof buildUnsignedCreateProjectCall> | null,
      next: ReturnType<typeof buildUnsignedCreateProjectCall> | null
    ) => next,
    null
  );

  const buildReview = useCallback((params: CreateProjectParams) => {
    const call = buildUnsignedCreateProjectCall(params);
    setUnsignedCall(call);
    dispatch({ type: "START_REVIEW" });
  }, []);

  const submit = useCallback(
    async (
      params: CreateProjectParams,
      signAndSubmit: (
        unsignedXdr: string
      ) => Promise<{ txHash: string; projectId: bigint }>
    ) => {
      dispatch({ type: "SUBMIT" });
      try {
        const result = await submitCreateProject(params, signAndSubmit);
        dispatch({ type: "RECEIVE_HASH", txHash: result.txHash });
        dispatch({ type: "SUCCESS", projectId: result.projectId });
      } catch (err) {
        dispatch({ type: "FAIL", error: err as Error });
      }
    },
    []
  );

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
    setUnsignedCall(null);
  }, []);

  return { state, unsignedCall, buildReview, submit, reset };
}
