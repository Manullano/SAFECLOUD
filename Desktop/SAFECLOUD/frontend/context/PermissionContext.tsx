/**
 * Permission Context for RBAC
 * Provides role-based access control information to React components
 */
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/stores/auth';

export type UserRole = 'SUPERADMIN' | 'STAFF_PM' | 'STAFF_SUPPORT' | 'CLIENT_ADMIN' | 'CLIENT_USER' | 'CLIENT_VIEWER';

export interface PermissionContextType {
  role: UserRole | null;
  permissions: string[];
  isLoading: boolean;
  canAccess: (module: string, action: string) => boolean;
  canAccessModule: (module: string) => boolean;
}

// Module names
export const MODULES = {
  AUTH: 'AUTH',
  COMPANIES: 'COMPANIES',
  USERS: 'USERS',
  PROJECTS: 'PROJECTS',
  TASKS: 'TASKS',
  DOCUMENTS: 'DOCUMENTS',
  TICKETS: 'TICKETS',
  COMMENTS: 'COMMENTS',
  AUDIT: 'AUDIT',
  SETTINGS: 'SETTINGS',
} as const;

// Actions
export const ACTIONS = {
  VIEW: 'VIEW',
  CREATE: 'CREATE',
  EDIT: 'EDIT',
  DELETE: 'DELETE',
  EXPORT: 'EXPORT',
  ASSIGN: 'ASSIGN',
  DOWNLOAD: 'DOWNLOAD',
} as const;

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export interface PermissionProviderProps {
  children: ReactNode;
}

// Define permissions by role
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPERADMIN: [], // SUPERADMIN has all access (checked separately)
  STAFF_PM: [
    'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
    'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
    'documents.view', 'documents.create', 'documents.edit', 'documents.delete', 'documents.download',
    'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.delete',
    'comments.view', 'comments.create', 'comments.edit', 'comments.delete',
    'audit.view',
  ],
  STAFF_SUPPORT: [
    'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.delete',
    'comments.view', 'comments.create', 'comments.edit', 'comments.delete',
    'audit.view',
  ],
  CLIENT_ADMIN: [
    'projects.view', 'tasks.view', 'tasks.create', 'tasks.edit',
    'documents.view', 'documents.create', 'documents.download',
    'comments.view', 'comments.create', 'comments.edit',
  ],
  CLIENT_USER: [
    'projects.view',
    'tasks.view', 'tasks.create',
    'documents.view', 'documents.download',
    'comments.view', 'comments.create',
  ],
  CLIENT_VIEWER: [
    'projects.view',
    'documents.view',
  ],
};

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtener el rol del usuario desde el store de autenticación
    if (authLoading) {
      return;
    }

    if (user && user.role) {
      const userRole = user.role as UserRole;
      console.log('[PermissionContext] Setting role from auth store:', userRole);
      setRole(userRole);
      
      // Asignar permisos basados en el rol
      setPermissions(ROLE_PERMISSIONS[userRole] || []);
    } else {
      setRole(null);
      setPermissions([]);
    }
    
    setIsLoading(false);
  }, [user, authLoading]);

  const canAccess = (module: string, action: string): boolean => {
    if (!role) return false;

    // SUPERADMIN has access to everything
    if (role === 'SUPERADMIN') return true;

    const permissionCode = `${module.toLowerCase()}.${action.toLowerCase()}`;
    return permissions.includes(permissionCode);
  };

  const canAccessModule = (module: string): boolean => {
    if (!role) return false;

    // SUPERADMIN has access to everything
    if (role === 'SUPERADMIN') return true;

    // Check if user has any permission in this module
    const modulePrefix = module.toLowerCase();
    return permissions.some((perm) => perm.startsWith(modulePrefix));
  };

  const value: PermissionContextType = {
    role,
    permissions,
    isLoading,
    canAccess,
    canAccessModule,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within PermissionProvider');
  }
  return context;
};
