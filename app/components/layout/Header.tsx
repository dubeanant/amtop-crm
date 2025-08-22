'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, signOut } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateOrganizationModalOpen, setIsCreateOrganizationModalOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize with empty notifications
  const mockNotifications: Notification[] = [];

  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Dashboard';
      case '/leads':
        return 'Leads Management';
      case '/pipeline':
        return 'Pipeline Configuration';
      case '/analytics':
        return 'Analytics & Reports';
      case '/users':
        return 'User Management';
      case '/settings':
        return 'Settings';
      default:
        return 'Lead Management';
    }
  };

  const getPageDescription = () => {
    switch (pathname) {
      case '/':
        return 'Overview of your sales performance';
      case '/leads':
        return 'Manage and track your prospects';
      case '/pipeline':
        return 'Configure your sales funnel';
      case '/analytics':
        return 'Insights and performance metrics';
      case '/users':
        return 'Manage team members and permissions';
      case '/settings':
        return 'System configuration and preferences';
      default:
        return 'Manage your sales pipeline effectively';
    }
  };

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

  // Initialize notifications
  useEffect(() => {
    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
      <div className="flex items-center justify-between h-20 px-4 lg:px-8">
        {/* Left side - Menu button and page info */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 lg:hidden transition-all duration-200 hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="hidden lg:block">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{getPageTitle()}</h1>
                <p className="text-sm text-gray-500">{getPageDescription()}</p>
              </div>
            </div>
          </div>

          <div className="lg:hidden">
            <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
          </div>
        </div>

        {/* Center - Search bar */}
        <div className="hidden md:flex flex-1 max-w-lg mx-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads, contacts, or organizations..."
              className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl leading-5 bg-gray-50/50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Right side - Actions and profile */}
        <div className="flex items-center space-x-3">
          {/* Quick Actions */}
          <div className="hidden lg:flex items-center space-x-2">
            <button className="p-2.5 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 hover:scale-105">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2.5 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200/50 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-blue-50/30' : ''
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.type === 'success' ? 'bg-green-500' :
                            notification.type === 'warning' ? 'bg-yellow-500' :
                            notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-2">{notification.timestamp}</p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>



          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100/80 transition-all duration-200 hover:scale-105"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                  {user?.role}
                </p>
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 z-50 overflow-hidden">
                {/* User Info Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/50">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-semibold shadow-lg">
                        {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.displayName || user?.email}
                      </p>
                      <p className="text-xs text-gray-500 capitalize flex items-center mt-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                        {user?.role} • Online
                      </p>
                      {currentOrganization && (
                        <div className="flex items-center mt-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">
                            {currentOrganization.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Organizations Section */}
                {organizations.length > 0 && (
                  <div className="px-6 py-4 border-b border-gray-200/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900">Organizations</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {organizations.length}/3
                      </span>
                    </div>
                    {loadingOrganizations ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {organizations.map((org) => (
                          <button
                            key={org.id}
                            onClick={() => {
                              if (!org.isCurrent) {
                                handleSwitchOrganization(org.id);
                              }
                              setIsProfileMenuOpen(false);
                            }}
                            className={`w-full text-left p-3 rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                              org.isCurrent
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                : 'text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold ${
                                  org.isCurrent 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {org.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium truncate text-sm">{org.name}</p>
                                  <p className={`text-xs capitalize ${
                                    org.isCurrent ? 'text-blue-100' : 'text-gray-500'
                                  }`}>
                                    {org.userRole}
                                  </p>
                                </div>
                              </div>
                              {org.isCurrent && (
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Menu Items */}
                <div className="px-6 py-4 space-y-2">
                  <a
                    href="/profile"
                    className="flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Your Profile</span>
                  </a>
                  <a
                    href="/settings"
                    className="flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">Settings</span>
                  </a>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-gray-200/50">
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
                    className={`flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                      organizations.length >= 3
                        ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                        : 'text-blue-600 hover:bg-blue-50 bg-blue-50/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Create Organization</span>
                    </div>
                    {organizations.length >= 3 && (
                      <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded-full">
                        Limit reached
                      </span>
                    )}
                  </button>
                </div>

                {/* Sign Out */}
                <div className="px-6 py-4 border-t border-gray-200/50">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-[1.02] font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
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