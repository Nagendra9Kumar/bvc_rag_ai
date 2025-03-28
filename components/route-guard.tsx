"use client";

import { useRoleAuth } from "@/hooks/useRoleAuth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

type RouteGuardProps = {
  children: ReactNode;
  requiredRole: "user" | "admin" | "superadmin";
  fallbackUrl?: string;
};

export async function RouteGuard({ 
  children, 
  requiredRole, 
  fallbackUrl = "/" 
}: RouteGuardProps) {
  const { hasRole, isLoading } = await useRoleAuth();

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!hasRole(requiredRole)) {
    redirect(fallbackUrl);
  }

  return <>{children}</>;
}