"use client";

import HomeAnimado from "@/components/HomeAnimado";
import { useEffect } from "react";
import { getAuthToken } from "@/utils/auth";
import { useRouter } from "next/navigation";

export default function ClientHomeWrapper() {
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  return <HomeAnimado />;
}
