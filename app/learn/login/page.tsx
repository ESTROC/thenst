"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LearnLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sign-in?redirect=/learn");
  }, [router]);

  return null;
}
