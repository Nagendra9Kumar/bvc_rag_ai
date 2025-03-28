"use client";

import { useRoleAuth } from "@/hooks/useRoleAuth";
import { ReactNode } from "react";

export async function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = await useRoleAuth();

  if (isLoading) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}