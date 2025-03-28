import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";

// Define possible user roles
export type UserRole = "user" | "admin" | "editor";

// Define the return type for better type safety
interface RoleAuthState {
  role: UserRole | null;
  isLoading: boolean;
  hasPermission: (requiredRole: UserRole) => boolean;
  error: string | null;
}

// Debounce utility function
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  const debouncedFn = function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };

  debouncedFn.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debouncedFn;
};

export function useRoleAuth(debounceMs: number = 300): RoleAuthState {
  const { isSignedIn, userId } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  useEffect(() => {
    // Skip fetching if not signed in
    if (!isSignedIn || !userId) {
      setRole(null);
      setIsLoading(false);
      return;
    }
    
    // Initialize loading state
    setIsLoading(true);
    
    // Cache expiry time (5 minutes)
    const CACHE_EXPIRY = 5 * 60 * 1000;
    const now = Date.now();
    
    // If we have a cached role and it's not expired, use it
    if (role && (now - lastFetchTime < CACHE_EXPIRY)) {
      setIsLoading(false);
      return;
    }

    // Debounced fetch function
    const fetchUserRoleDebounced = debounce(async () => {
      try {
        const response = await fetch(`/api/user-role?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch role: ${response.status}`);
        }
        
        const data = await response.json();
        setRole(data.role as UserRole);
        setLastFetchTime(Date.now());
        setError(null);
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        // Default to regular user on error for least privilege
        setRole("user");
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    fetchUserRoleDebounced();
    
    // Clean up the debounce on unmount
    return () => {
      fetchUserRoleDebounced.cancel?.();
    };
  }, [isSignedIn, userId, debounceMs]);

  // Helper function to check if user has the required role
  const hasPermission = (requiredRole: UserRole): boolean => {
    if (isLoading || !isSignedIn) return false;
    
    // Implement role hierarchy
    if (role === "admin") return true; // Admin has all permissions
    if (role === "editor" && (requiredRole === "editor" || requiredRole === "user")) return true;
    if (role === "user" && requiredRole === "user") return true;
    
    return false;
  };

  return {
    role,
    isLoading,
    hasPermission,
    error
  };
}