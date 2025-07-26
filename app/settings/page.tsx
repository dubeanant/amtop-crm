'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { Layout } from "../components/layout/Layout";
import { RoleGuard } from "../components/ui/RoleGuard";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [user, loading, router]);

  // Delete all leads from database
  const handleDeleteAllLeads = async () => {
    if (!user?.email) {
      alert("User not authenticated");
      return;
    }
    
    // Create appropriate confirmation message based on user role
    let confirmMessage = "Are you sure you want to delete all YOUR leads? This action cannot be undone.";
    if (user.role === 'admin') {
      confirmMessage = "⚠️ DANGER: Are you sure you want to delete ALL LEADS in the system? This will delete leads from all users and cannot be undone.";
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    // Double confirmation for destructive actions
    const secondConfirm = user.role === 'admin' 
      ? "This will permanently delete ALL leads from ALL users. Type 'DELETE ALL' to confirm:"
      : "This will permanently delete all your leads. Type 'DELETE MY LEADS' to confirm:";
    
    const expectedText = user.role === 'admin' 
      ? 'DELETE ALL'
      : 'DELETE MY LEADS';
    
    const userInput = prompt(secondConfirm);
    if (userInput !== expectedText) {
      alert("Confirmation text did not match. Operation cancelled.");
      return;
    }
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/leads?userEmail=${encodeURIComponent(user.email)}`, {
        method: "DELETE",
      });
      
      const result = await response.json();
      
      if (result.success) {
        
        // Create appropriate success message based on user role
        let successMessage = `Successfully deleted ${result.deletedCount} of your leads from database`;
        if (user.role === 'admin') {
          successMessage = `Successfully deleted ${result.deletedCount} leads from the entire system`;
        }
        
        alert(successMessage);
      } else {
        alert("Failed to delete leads: " + result.error);
      }
    } catch (error) {
      alert("Error deleting leads. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return null; // Will redirect to sign-in
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and system preferences
          </p>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-semibold mr-4">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
              <p className="text-sm text-gray-600">Manage your personal details and preferences</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <label className="text-sm font-medium text-gray-700">Email Address</label>
              </div>
              <p className="text-base text-gray-900 font-medium">{user.email}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <label className="text-sm font-medium text-gray-700">Display Name</label>
              </div>
              <p className="text-base text-gray-900 font-medium">{user.displayName || 'Not set'}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <label className="text-sm font-medium text-gray-700">Account Role</label>
              </div>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                user.role === 'admin' ? 'bg-red-200 text-red-900 border-2 border-red-300' :
                user.role === 'user' ? 'bg-blue-200 text-blue-900 border-2 border-blue-300' :
                'bg-amber-200 text-amber-900 border-2 border-amber-300'
              }`}>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <label className="text-sm font-medium text-gray-700">Account Status</label>
              </div>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-900">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <RoleGuard resource="leads" action="delete">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <h2 className="text-lg font-semibold text-red-900 mb-4">
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Danger Zone
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {user.role === 'admin' 
                ? "As an admin, this will delete ALL leads from ALL users in the system."
                : "This will permanently delete all your leads from the database."
              }
            </p>
            <button
              onClick={handleDeleteAllLeads}
              disabled={isDeleting}
              className={`flex items-center px-4 py-2 text-white font-medium rounded-lg shadow-sm transition duration-200 ${
                isDeleting
                  ? 'bg-red-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {isDeleting ? 'Deleting...' : 
                user.role === 'admin' ? 'Delete All System Leads' :
                'Delete All My Leads'
              }
            </button>
          </div>
        </RoleGuard>
      </div>
    </Layout>
  );
}