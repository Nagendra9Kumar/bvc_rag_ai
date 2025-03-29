import { UserRole } from "@/hooks/useRoleAuth";

export interface Route {
  href: string;
  label: string;
  requiredRole?: UserRole;
  description?: string;
}

export const routes: Route[] = [
  { href: '/', label: 'Home' },
  { href: '/chat', label: 'Chat' },
  { href: '/about', label: 'About' },
  { href: '/admin', label: 'Admin', requiredRole: 'admin' }
];