'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/config';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteProfile = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type "DELETE" to confirm');
      return;
    }

    try {
      setIsDeleting(true);
      setError('');

      // Delete user profile from MongoDB first
      const response = await fetch(`/api/users/${user?.uid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestingUser: user?.email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete profile from database');
      }

      // Delete Firebase user account
      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
        } catch (firebaseError: any) {
          // If deletion fails due to recent login requirement, still sign out
          console.warn('Firebase user deletion failed:', firebaseError);
          if (firebaseError.code === 'auth/requires-recent-login') {
            setError('For security reasons, please sign out and sign back in, then try deleting your account again.');
            return;
          }
        }
      }

      // Sign out and redirect
      await signOut();
      router.push('/sign-in');
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      setError(error.message || 'Failed to delete profile');
    } finally {
      setIsDeleting(false);
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

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Display Name</label>
              <p className="mt-1 text-sm text-gray-900">{user?.displayName || 'Not set'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <p className="mt-1 text-sm text-gray-900 capitalize">{user?.role}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Team</label>
              <p className="mt-1 text-sm text-gray-900">{user?.teamId || 'No team assigned'}</p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
          <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-red-900">Delete Account</h3>
              <p className="text-sm text-red-700 mt-1">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete My Account
              </button>
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative mx-auto p-6 border w-full max-w-md shadow-2xl rounded-lg bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-center mx-auto w-12 h-12 rounded-full bg-red-100">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="mt-5 text-center">
                  <h3 className="text-lg font-medium text-gray-900">Delete Account</h3>
                  <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500 mb-4">
                      This will permanently delete your account and all associated data including:
                    </p>
                    <ul className="text-sm text-gray-500 text-left list-disc list-inside space-y-1 mb-4">
                      <li>Your profile information</li>
                      <li>All leads you've uploaded</li>
                      <li>Pipeline configurations</li>
                      <li>All account data</li>
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
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          deleteConfirmText === 'DELETE' 
                            ? 'border-green-300 focus:ring-green-500 focus:border-green-500' 
                            : 'border-gray-300 focus:ring-red-500 focus:border-red-500'
                        }`}
                        placeholder="DELETE"
                        autoComplete="off"
                      />
                      {deleteConfirmText && deleteConfirmText !== 'DELETE' && (
                        <p className="mt-1 text-xs text-red-600">Please type exactly "DELETE"</p>
                      )}
                      {deleteConfirmText === 'DELETE' && (
                        <p className="mt-1 text-xs text-green-600">✓ Confirmation text correct</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                        setError('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors"
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteProfile}
                      disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        'Delete Account'
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