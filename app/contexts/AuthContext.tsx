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
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Fetch user profile from MongoDB
  const fetchUserProfile = async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      console.log('🔍 Fetching profile for:', firebaseUser.email, 'UID:', firebaseUser.uid);
      const response = await fetch(`/api/users/${firebaseUser.uid}`);
      console.log('📡 Profile fetch response:', response.status);
      
      if (response.ok) {
        const userData: UserProfile = await response.json();
        console.log('✅ User data found:', userData);
        
        // Check if user needs migration (has domain-based teamId)
        const emailDomain = firebaseUser.email!.split('@')[1];
        const hasDomainBasedTeam = userData.teamId === emailDomain || (!userData.organizationId && userData.teamId);
        
        if (hasDomainBasedTeam) {
          console.log('🔄 User needs migration, triggering...');
          // Trigger migration which will remove profile and trigger onboarding
          const migrationResponse = await fetch('/api/users/migrate-to-org', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userUid: firebaseUser.uid }),
          });
          
          if (migrationResponse.ok) {
            const migrationData = await migrationResponse.json();
            if (migrationData.needsOnboarding) {
              console.log('🎯 Migration complete, triggering onboarding');
              setNeedsOnboarding(true);
              return null;
            }
          }
        }
        
        return userData;
      } else if (response.status === 404) {
        // User doesn't exist in MongoDB, trigger onboarding
        console.log('❌ User not found (404), triggering onboarding');
        setNeedsOnboarding(true);
        setShowOnboardingModal(true);
        return null;
      }
      console.log('❌ Unexpected response status:', response.status);
      return null;
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      return null;
    }
  };

  // Create user profile in MongoDB with company name
  const createUserProfile = async (firebaseUser: User, companyName: string): Promise<UserProfile | null> => {
    try {
      console.log('🏢 Creating organization:', companyName);
      // First create the organization
      const orgResponse = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName,
          createdBy: firebaseUser.uid,
          creatorEmail: firebaseUser.email!
        }),
      });

      let organizationId = companyName; // fallback to company name
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        organizationId = orgData.organization.id;
        console.log('✅ Organization created with ID:', organizationId);
      } else {
        console.warn('⚠️ Organization creation failed, using fallback ID:', organizationId);
        const errorText = await orgResponse.text();
        console.warn('Organization error:', errorText);
      }

      // Then create the user profile
      const newUserProfile: Omit<UserProfile, 'permissions'> = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || '',
        role: DEFAULT_ROLE,
        organizationId: organizationId,
        organizations: [organizationId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      console.log('👤 Creating user profile:', newUserProfile);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserProfile),
      });

      console.log('📡 User creation response status:', response.status);
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User created successfully:', userData);
        const userRole = (userData.user?.role || userData.role) as UserRole;
        return {
          ...userData.user || userData, // Handle different response formats
          permissions: ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS[DEFAULT_ROLE]
        };
      } else {
        const errorText = await response.text();
        console.error('❌ User creation failed:', response.status, errorText);
        return null;
      }
    } catch (error) {
      console.error('❌ Error in createUserProfile:', error);
      return null;
    }
  };

  // Complete onboarding process
  const completeOnboarding = async (companyName: string): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const userProfile = await createUserProfile(auth.currentUser, companyName);
      if (userProfile) {
        setUser(userProfile);
        setNeedsOnboarding(false);
        setShowOnboardingModal(false);
      } else {
        throw new Error('Failed to create user profile');
      }
    } catch (error) {
      throw error;
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
    if (!auth || typeof auth.signInWithEmailAndPassword !== 'function') {
      throw new Error('Firebase authentication is not properly configured. Please check your environment variables.');
    }
    
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
    if (!auth || typeof auth.createUserWithEmailAndPassword !== 'function') {
      throw new Error('Firebase authentication is not properly configured. Please check your environment variables.');
    }
    
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
    if (!auth || typeof auth.signOut !== 'function') {
      console.warn('Firebase auth not properly initialized, clearing local state only');
      setUser(null);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('user');
      }
      return;
    }
    
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
    // Check if Firebase auth is properly initialized
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      console.warn('⚠️ Firebase auth not properly initialized, skipping auth state listener');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      setFirebaseUser(currentFirebaseUser);
      
      if (currentFirebaseUser) {
        const userProfile = await fetchUserProfile(currentFirebaseUser);
        if (userProfile) {
          setUser({
            ...userProfile,
            permissions: ROLE_PERMISSIONS[userProfile.role] || ROLE_PERMISSIONS[DEFAULT_ROLE]
          });
          setNeedsOnboarding(false);
        }
      } else {
        setUser(null);
        setNeedsOnboarding(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (firebaseUser) {
      const userProfile = await fetchUserProfile(firebaseUser);
      if (userProfile) {
        setUser({
          ...userProfile,
          permissions: ROLE_PERMISSIONS[userProfile.role] || ROLE_PERMISSIONS[DEFAULT_ROLE]
        });
        setNeedsOnboarding(false);
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    needsOnboarding,
    firebaseUser,
    signIn,
    signUp,
    signOut,
    updateUserRole,
    hasPermission,
    completeOnboarding,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Global onboarding modal */}
      {showOnboardingModal && firebaseUser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to CRM!
              </h1>
              <p className="text-gray-600">
                Let's set up your organization
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-blue-800">
                <p><strong>Email:</strong> {firebaseUser.email}</p>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const companyName = formData.get('companyName') as string;
              if (companyName.trim()) {
                try {
                  await completeOnboarding(companyName.trim());
                } catch (error) {
                  alert('Failed to complete onboarding. Please try again.');
                }
              }
            }}>
              <div className="mb-4">
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your company name"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Complete Setup
              </button>
            </form>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};