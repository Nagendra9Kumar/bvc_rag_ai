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
  { href: '/admin', label: 'Admin', requiredRole: 'admin' },
  { href: '/admin/documents', label: 'Documents', requiredRole: 'admin' },
  { href: '/admin/websites', label: 'Websites', requiredRole: 'admin' },
  { href: '/admin/databases', label: 'Databases', requiredRole: 'admin' },
  { href: '/admin/settings', label: 'Settings', requiredRole: 'admin' },
  { href: '/admin/users', label: 'Users', requiredRole: 'admin' },
];