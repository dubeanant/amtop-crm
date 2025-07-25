// Authentication and Role Types
export type UserRole = 'admin' | 'user' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
}

// Role-based permissions configuration
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { resource: 'leads', actions: ['create', 'read', 'update', 'delete', 'manage_all'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'manage_roles'] },
    { resource: 'pipeline', actions: ['create', 'read', 'update', 'delete', 'manage_stages'] },
    { resource: 'analytics', actions: ['read', 'export'] },
    { resource: 'settings', actions: ['read', 'update'] },
  ],
  user: [
    { resource: 'leads', actions: ['create', 'read', 'update', 'delete', 'view_own'] },
    { resource: 'pipeline', actions: ['read', 'update_own'] },
    { resource: 'analytics', actions: ['read_own'] },
  ],
  viewer: [
    { resource: 'leads', actions: ['read', 'view_own'] },
    { resource: 'pipeline', actions: ['read'] },
    { resource: 'analytics', actions: ['read_own'] },
  ],
};

export const DEFAULT_ROLE: UserRole = 'user';