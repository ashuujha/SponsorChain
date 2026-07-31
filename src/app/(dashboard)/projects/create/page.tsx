"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateProjectRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/list-project");
  }, [router]);
  return (
    <div className="flex-grow flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
    </div>
  );
}
