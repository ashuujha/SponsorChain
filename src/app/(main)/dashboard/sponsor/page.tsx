"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SponsorDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/activity");
  }, [router]);
  return null;
}
