'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { CreateOrganizationModal } from '../teams/CreateTeamModal';

interface HeaderProps {
  onMenuClick: () => void;
}

interface Organization {
  id: string;
  name: string;
  userRole: string;
  isActive: boolean;
  isCurrent: boolean;
  memberCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, signOut } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCreateOrganizationModalOpen, setIsCreateOrganizationModalOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to sign-in page after successful logout
      router.push('/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const fetchUserOrganizations = async () => {
    if (!user?.email) return;
    
    try {
      setLoadingOrganizations(true);
      const response = await fetch(`/api/users/organizations?userEmail=${encodeURIComponent(user.email)}`);
      const data = await response.json();
      
      if (data.success) {
        setOrganizations(data.organizations || []);
        setCurrentOrganization(data.currentOrganization || null);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  const handleSwitchOrganization = async (organizationId: string) => {
    if (!user?.email) return;
    
    try {
      const response = await fetch('/api/users/switch-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          organizationId
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh the page to load the new organization context
        window.location.reload();
      } else {
        alert('Failed to switch organization: ' + data.error);
      }
    } catch (error) {
      console.error('Error switching organization:', error);
      alert('Failed to switch organization');
    }
  };

  // Fetch organizations when user changes or profile menu opens
  useEffect(() => {
    if (user?.email && isProfileMenuOpen) {
      fetchUserOrganizations();
    }
  }, [user?.email, isProfileMenuOpen]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left side - Menu button and title */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="ml-2 text-xl font-semibold text-gray-900 lg:ml-0">
            Lead Management
          </h1>
        </div>

        {/* Right side - Search and profile */}
        <div className="flex items-center space-x-4">
          {/* Search bar */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search leads..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>



          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.displayName || user?.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role} Account
                  </p>
                  {currentOrganization && (
                    <p className="text-xs text-blue-600 mt-1">
                      {currentOrganization.name}
                    </p>
                  )}
                </div>

                {/* Organizations Section */}
                {organizations.length > 0 && (
                  <>
                    <div className="px-4 py-2 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Your Organizations
                        </p>
                        <span className="text-xs text-gray-400">
                          {organizations.length}/3
                        </span>
                      </div>
                      {loadingOrganizations ? (
                        <div className="flex items-center justify-center py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {organizations.map((org) => (
                            <button
                              key={org.id}
                              onClick={() => {
                                if (!org.isCurrent) {
                                  handleSwitchOrganization(org.id);
                                }
                                setIsProfileMenuOpen(false);
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                                org.isCurrent
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium truncate">{org.name}</p>
                                  <p className="text-xs text-gray-500 capitalize">
                                    {org.userRole}
                                  </p>
                                </div>
                                {org.isCurrent && (
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <a
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  Your Profile
                </a>
                <a
                  href="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  Settings
                </a>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    if (organizations.length >= 3) {
                      alert('You have reached the maximum limit of 3 organizations. Please contact support if you need more.');
                      return;
                    }
                    setIsProfileMenuOpen(false);
                    setIsCreateOrganizationModalOpen(true);
                  }}
                  disabled={organizations.length >= 3}
                  className={`block w-full text-left px-4 py-2 text-sm font-medium ${
                    organizations.length >= 3
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Create New Organization</span>
                    </div>
                    {organizations.length >= 3 && (
                      <span className="text-xs text-gray-400">Limit reached</span>
                    )}
                  </div>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={isCreateOrganizationModalOpen}
        onClose={() => setIsCreateOrganizationModalOpen(false)}
        onOrganizationCreated={() => {
          // Refresh organizations list
          fetchUserOrganizations();
          console.log('Organization created successfully');
        }}
      />
    </header>
  );
};