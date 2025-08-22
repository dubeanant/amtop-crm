'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { deleteUser } from 'firebase/auth';
import { auth } from '../firebase/config';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  

  
  // Organization states
  const [currentOrganization, setCurrentOrganization] = useState<any>(null);
  const [userOrganizations, setUserOrganizations] = useState<any[]>([]);
  const [showDeleteOrgConfirm, setShowDeleteOrgConfirm] = useState(false);
  const [deleteOrgConfirmText, setDeleteOrgConfirmText] = useState('');
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);
  const [orgError, setOrgError] = useState('');

  // Fetch user organizations using email as fallback
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user?.email) return;
      
      try {
        // First try to get user profile to get UID
        const userResponse = await fetch(`/api/users/by-email?email=${user.email}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.uid) {
            // Now fetch organizations using UID
            const orgResponse = await fetch(`/api/users/organizations-by-uid?uid=${userData.uid}`);
            const orgData = await orgResponse.json();
            
            if (orgData.success) {
              setUserOrganizations(orgData.organizations);
              // Find current organization
              const current = orgData.organizations.find((org: any) => org.id === userData.organizationId);
              setCurrentOrganization(current);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      }
    };

    fetchOrganizations();
  }, [user]);

  const handleDeleteOrganization = async () => {
    if (deleteOrgConfirmText !== 'DELETE') {
      setOrgError('Please type "DELETE" to confirm');
      return;
    }

    if (!currentOrganization) {
      setOrgError('No organization selected');
      return;
    }

    try {
      setIsDeletingOrg(true);
      setOrgError('');

      // Get user UID first
      const userResponse = await fetch(`/api/users/by-email?email=${user?.email}`);
      const userData = await userResponse.json();
      
      if (!userData.uid) {
        setOrgError('Unable to get user information');
        return;
      }

      const response = await fetch(`/api/organizations/${currentOrganization.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestingUserUid: userData.uid }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the page to update organization data
        window.location.reload();
      } else {
        setOrgError(data.error || 'Failed to delete organization');
      }
    } catch (error: any) {
      console.error('Error deleting organization:', error);
      setOrgError(error.message || 'Failed to delete organization');
    } finally {
      setIsDeletingOrg(false);
    }
  };



  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {/* Organization Management */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Management</h2>
          
          {currentOrganization ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-900">Delete Current Organization</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Permanently delete "{currentOrganization.name}" and all its data. This action cannot be undone.
                    </p>
                    {userOrganizations.length > 1 ? (
                      <button
                        onClick={() => setShowDeleteOrgConfirm(true)}
                        className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete Organization
                      </button>
                    ) : (
                      <p className="mt-2 text-xs text-amber-700">
                        Cannot delete your only organization. You must belong to at least one organization.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Loading organization data...</p>
            </div>
          )}
        </div>



        {/* Error Messages */}
        {orgError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-600">{orgError}</p>
              </div>
            </div>
          </div>
        )}



        {/* Delete Organization Confirmation Modal */}
        {showDeleteOrgConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-6 border w-full max-w-md shadow-2xl rounded-lg bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-center mx-auto w-12 h-12 rounded-full bg-red-100">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="mt-5 text-center">
                  <h3 className="text-lg font-medium text-gray-900">Delete Organization</h3>
                  <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500 mb-4">
                      This will permanently delete <strong>"{currentOrganization?.name}"</strong> and all associated data including:
                    </p>
                    <ul className="text-sm text-gray-500 text-left list-disc list-inside space-y-1 mb-4">
                      <li>All organization members</li>
                      <li>Organization settings and configurations</li>
                      <li>All data associated with this organization</li>
                      <li>Member access to organization resources</li>
                    </ul>
                    <p className="text-sm text-red-600 font-medium mb-4">
                      This action cannot be undone.
                    </p>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type "DELETE" to confirm:
                      </label>
                      <input
                        type="text"
                        value={deleteOrgConfirmText}
                        onChange={(e) => setDeleteOrgConfirmText(e.target.value.toUpperCase())}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          deleteOrgConfirmText === 'DELETE' 
                            ? 'border-green-300 focus:ring-green-500 focus:border-green-500' 
                            : 'border-gray-300 focus:ring-red-500 focus:border-red-500'
                        }`}
                        placeholder="DELETE"
                        autoComplete="off"
                      />
                      {deleteOrgConfirmText && deleteOrgConfirmText !== 'DELETE' && (
                        <p className="mt-1 text-xs text-red-600">Please type exactly "DELETE"</p>
                      )}
                      {deleteOrgConfirmText === 'DELETE' && (
                        <p className="mt-1 text-xs text-green-600">✓ Confirmation text correct</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => {
                        setShowDeleteOrgConfirm(false);
                        setDeleteOrgConfirmText('');
                        setOrgError('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors"
                      disabled={isDeletingOrg}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteOrganization}
                      disabled={isDeletingOrg || deleteOrgConfirmText !== 'DELETE'}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {isDeletingOrg ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        'Delete Organization'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}