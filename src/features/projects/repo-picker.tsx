"use client";

import React, { useState, useEffect } from "react";
import type { FilteredRepo } from "@/app/api/listing/repos/route";

type RepoPickerState =
  | { stage: "loading" }
  | { stage: "error"; message: string }
  | { stage: "empty" }
  | { stage: "ready"; repos: FilteredRepo[] };

interface Props {
  onSelect: (repo: FilteredRepo) => void;
}

export function RepoPicker({ onSelect }: Props) {
  const [state, setState] = useState<RepoPickerState>({ stage: "loading" });

  const fetchRepos = () => {
    setState({ stage: "loading" });
    fetch("/api/listing/repos")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) {
          setState({
            stage: "error",
            message: body.error || `GitHub API returned status ${res.status}.`,
          });
          return;
        }
        const repos: FilteredRepo[] = body.repos || [];
        if (repos.length === 0) {
          setState({ stage: "empty" });
          return;
        }
        setState({ stage: "ready", repos });
      })
      .catch(() => {
        setState({
          stage: "error",
          message:
            "Network error while connecting to GitHub. Please check your connection and try again.",
        });
      });
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  if (state.stage === "loading") {
    return (
      <div className="flex items-center gap-sm py-lg justify-center">
        <div className="w-5 h-5 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
        <span className="text-on-surface-variant text-body-sm font-medium">
          Fetching your repositories from GitHub...
        </span>
      </div>
    );
  }

  if (state.stage === "error") {
    return (
      <div className="space-y-md">
        <div className="p-md bg-error-container text-on-error-container rounded-lg border border-error/15 text-body-sm font-medium">
          {state.message}
        </div>
        <button
          onClick={fetchRepos}
          className="bg-surface border border-outline-variant text-on-surface-variant px-lg py-xs rounded-full text-body-sm font-semibold hover:bg-surface-container transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (state.stage === "empty") {
    return (
      <div className="text-center py-lg space-y-sm">
        <span className="material-symbols-outlined text-[40px] text-neutral-400">
          folder_off
        </span>
        <p className="text-on-surface-variant text-body-sm font-medium">
          No public, non-fork repositories found on your GitHub account.
        </p>
        <p className="text-secondary text-[12px]">
          Only repositories you own that are not forks can be listed on SponsorChain.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-sm max-h-[320px] overflow-y-auto pr-xs">
      {state.repos.map((repo) => (
        <button
          key={repo.id}
          onClick={() => onSelect(repo)}
          className="w-full text-left p-md bg-surface-container-low hover:bg-surface-container-high border border-outline-variant rounded-lg transition-all duration-150 group"
        >
          <div className="flex items-start justify-between gap-sm">
            <div className="min-w-0">
              <h3 className="font-semibold text-body-sm text-primary truncate font-mono-code">
                {repo.fullName}
              </h3>
              <p className="text-secondary text-[12px] line-clamp-2 leading-snug mt-xs">
                {repo.description || "No description provided"}
              </p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
              arrow_forward
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
