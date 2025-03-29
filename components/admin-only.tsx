"use client";

import { useRoleAuth } from "@/hooks/useRoleAuth";
import { ReactNode } from "react";
import { useToast } from "./ui/use-toast";

export async function AdminOnly({ children }: { children: ReactNode }) {
  const { role, isLoading } = await useRoleAuth();
  const isAdmin = role === 'admin';
  const { toast } = useToast();
  if (isLoading) {
    return null;
  }

  if (!isAdmin) {
    
    console.log("Unauthorized access attempt to admin-only component");
    return (
      toast({
        title: "Access Denied",
        description: "You do not have administrator privileges",
        variant: "destructive"
      })
    )
  }

  return <>{children}</>;
}