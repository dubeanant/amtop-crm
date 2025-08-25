'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { RoleGuard } from '../components/ui/RoleGuard';
import { UserRole } from '../types/auth';
import { AddTeamMemberModal } from '../components/teams/AddTeamMemberModal';

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationId?: string;
  teamId?: string; // backward compatibility
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const { user, hasPermission, updateUserRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationSuccess, setMigrationSuccess] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const fetchUsers = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/users?requestingUser=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setError('');
    setRefreshSuccess(false);
    await fetchUsers();
    
    // Show success message briefly
    setRefreshSuccess(true);
    setTimeout(() => setRefreshSuccess(false), 2000);
  };

  const handleMigration = async () => {
    if (!user?.email || user.role !== 'admin') {
      setError('Only admins can run migrations');
      return;
    }

    try {
      setIsMigrating(true);
      setError('');
      setMigrationSuccess(false);

      const response = await fetch('/api/users/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestingUser: user.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMigrationSuccess(true);
        setTimeout(() => setMigrationSuccess(false), 3000);
        await fetchUsers(); // Refresh users list
      } else {
        setError(data.error || 'Migration failed');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setError('Migration failed');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!hasPermission('users', 'manage_roles')) {
      setError('You do not have permission to change user roles');
      return;
    }

    try {
      setUpdatingUserId(userId);
      setError('');
      
      await updateUserRole(userId, newRole);
      
      // Refresh users list
      await fetchUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      setError(error.message || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    if (!hasPermission('users', 'update')) {
      setError('You do not have permission to update user status');
      return;
    }

    try {
      setUpdatingUserId(userId);
      setError('');

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Failed to update user status');
    } finally {
      setUpdatingUserId(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-200 text-red-900 border-2 border-red-300';
      case 'user':
        return 'bg-blue-200 text-blue-900 border-2 border-blue-300';
      case 'viewer':
        return 'bg-amber-200 text-amber-900 border-2 border-amber-300';
      default:
        return 'bg-gray-200 text-gray-900 border-2 border-gray-300';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <RoleGuard resource="users" action="read" fallback={
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view team management.</p>
        </div>
      }>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                <p className="text-gray-600 mt-1">
                  Manage your team members and their roles
                </p>
                {(user?.organizationId || user?.teamId) && (
                  <p className="text-sm text-blue-600 mt-1">
                    Organization: {user.organizationId || user.teamId}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {users.length} team member{users.length !== 1 ? 's' : ''}
                </span>
                <RoleGuard resource="users" action="create">
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Team Member</span>
                  </button>
                </RoleGuard>
                {user?.role === 'admin' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleManualRefresh}
                      disabled={loading}
                      className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                        refreshSuccess 
                          ? 'text-green-700 bg-green-50 border-green-300' 
                          : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                      title="Refresh users list"
                    >
                      {refreshSuccess ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg 
                          className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                          />
                        </svg>
                      )}
                      <span>{refreshSuccess ? 'Refreshed!' : 'Refresh'}</span>
                    </button>
                    <button
                      onClick={handleMigration}
                      disabled={isMigrating}
                      className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                        migrationSuccess 
                          ? 'text-green-700 bg-green-50 border-green-300' 
                          : 'text-purple-700 bg-purple-50 border-purple-300 hover:bg-purple-100'
                      }`}
                      title="Migrate users to add team IDs"
                    >
                      {migrationSuccess ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg 
                          className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" 
                          />
                        </svg>
                      )}
                      <span>{migrationSuccess ? 'Migrated!' : isMigrating ? 'Migrating...' : 'Migrate Teams'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                <div className="text-sm text-gray-500">
                  Only showing users from your team/organization
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((userItem) => (
                    <tr key={userItem.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {userItem.displayName ? userItem.displayName.charAt(0).toUpperCase() : userItem.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {userItem.displayName || 'No name'}
                            </div>
                            <div className="text-sm text-gray-700">
                              {userItem.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RoleGuard resource="users" action="manage_roles" fallback={
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(userItem.role)}`}>
                            {userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
                          </span>
                        }>
                          <div className="relative">
                            <select
                              value={userItem.role}
                              onChange={(e) => handleRoleChange(userItem.uid, e.target.value as UserRole)}
                              disabled={updatingUserId === userItem.uid || userItem.uid === user?.uid}
                              className={`appearance-none text-xs rounded-full px-3 py-1.5 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed pr-6 ${getRoleBadgeColor(userItem.role)}`}
                            >
                              <option value="admin">Admin</option>
                              <option value="user">User</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </RoleGuard>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(userItem.isActive)}`}>
                          {userItem.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(userItem.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <RoleGuard resource="users" action="update">
                          <button
                            onClick={() => toggleUserStatus(userItem.uid, userItem.isActive)}
                            disabled={updatingUserId === userItem.uid || userItem.uid === user?.uid}
                            className={`text-sm px-3 py-1 rounded-md transition duration-200 disabled:cursor-not-allowed ${
                              userItem.isActive
                                ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                                : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                            }`}
                          >
                            {updatingUserId === userItem.uid ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : (
                              userItem.isActive ? 'Deactivate' : 'Activate'
                            )}
                          </button>
                        </RoleGuard>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add Team Member Modal */}
        <AddTeamMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          onMemberAdded={() => {
            fetchUsers();
            setShowAddMemberModal(false);
          }}
        />
      </RoleGuard>
    </Layout>
  );
}