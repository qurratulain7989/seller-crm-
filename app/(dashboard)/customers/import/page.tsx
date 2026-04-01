"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Import is now part of the Add Customer page (/customers/new)
export default function ImportRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/customers/new");
  }, [router]);
  return null;
}
