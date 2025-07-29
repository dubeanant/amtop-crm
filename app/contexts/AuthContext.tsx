'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { AuthContextType, UserProfile, UserRole, ROLE_PERMISSIONS, DEFAULT_ROLE } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from MongoDB
  const fetchUserProfile = async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      const response = await fetch(`/api/users/${firebaseUser.uid}`);
      if (response.ok) {
        const userData: UserProfile = await response.json();
        return userData;
      } else if (response.status === 404) {
        // User doesn't exist in MongoDB, create profile
        return await createUserProfile(firebaseUser);
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Create user profile in MongoDB
  const createUserProfile = async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      const newUserProfile: Omit<UserProfile, 'permissions'> = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || '',
        role: DEFAULT_ROLE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserProfile),
      });

      if (response.ok) {
        const userData: UserProfile = await response.json();
        return {
          ...userData,
          permissions: ROLE_PERMISSIONS[userData.role] || ROLE_PERMISSIONS[DEFAULT_ROLE]
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Check if user has permission for a specific action on a resource
  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    
    const resourcePermissions = user.permissions.find(p => p.resource === resource);
    return resourcePermissions?.actions.includes(action) || false;
  };

  // Sign in function
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      // Clear any session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Update user role (admin only)
  const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
    if (!hasPermission('users', 'manage_roles')) {
      throw new Error('Insufficient permissions to update user roles');
    }

    if (!user?.email) {
      throw new Error('User email not available');
    }

    try {
      const response = await fetch(`/api/users/${userId}/role?requestingUser=${encodeURIComponent(user.email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }

      // If updating current user's role, refresh the user data
      if (userId === user?.uid) {
        const updatedUser = await fetchUserProfile(auth.currentUser!);
        if (updatedUser) {
          setUser({
            ...updatedUser,
            permissions: ROLE_PERMISSIONS[updatedUser.role]
          });
        }
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await fetchUserProfile(firebaseUser);
        if (userProfile) {
          setUser({
            ...userProfile,
            permissions: ROLE_PERMISSIONS[userProfile.role] || ROLE_PERMISSIONS[DEFAULT_ROLE]
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};