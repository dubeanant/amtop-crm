'use client';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/layout/Layout";
import { RoleGuard } from "./components/ui/RoleGuard";
import Papa from "papaparse";


export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [leads, setLeads] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if user is authenticated before proceeding
    const currentUserEmail = user?.email;
    if (!currentUserEmail) {
      alert("Please wait for authentication to complete or log in again.");
      return;
    }
    
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        
        // Double-check user email is still available
        if (!currentUserEmail) {
          alert("User authentication lost. Please refresh and try again.");
          return;
        }
        
        try {
          // Send to API for MongoDB storage first
          const response = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              leads: results.data,
              userEmail: currentUserEmail
            }),
          });
          
          const result = await response.json();
          
          if (result.success) {
            // Fetch updated data from database
            await fetchLeads();
          } else {
            alert("Failed to upload data: " + result.error);
          }
        } catch (error) {
          console.error("Error uploading data:", error);
          alert("Error uploading data. Please try again.");
        }
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        alert("Error parsing CSV file. Please check the file format.");
      }
    });
  };

  // Fetch leads from MongoDB
  const fetchLeads = async () => {
    if (!user?.email) {
      return;
    }
    
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/leads?userEmail=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      
      if (res.ok && Array.isArray(data)) {
        setLeads(data);
      } else {
        setLeads([]);
      }
    } catch (error) {
      setLeads([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Delete single lead from database
  const handleDeleteSingleLead = async (leadId: string) => {
    if (!user?.email) {
      alert("User not authenticated");
      return;
    }
    
    if (!leadId) {
      alert("Lead ID not found");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this lead? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/leads/${leadId}?userEmail=${encodeURIComponent(user.email)}`, {
        method: "DELETE",
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh the leads display
        await fetchLeads();
      } else {
        alert("Failed to delete lead: " + result.error);
      }
    } catch (error) {
      alert("Error deleting lead. Please try again.");
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchLeads();
    }
  }, [user?.email]);



  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [user, loading, router]);
  
  // Custom upload button handler
  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <RoleGuard resource="leads" action="create">
              <button
                onClick={handleUploadClick}
                disabled={loading || !user?.email}
                className={`flex items-center px-4 py-2 text-white font-medium rounded-lg shadow-sm transition duration-200 ${
                  loading || !user?.email
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {loading ? 'Loading...' : !user?.email ? 'Not Authenticated' : 'Upload CSV'}
              </button>
            </RoleGuard>

            <button
              onClick={fetchLeads}
              disabled={isRefreshing}
              className={`flex items-center px-4 py-2 text-white font-medium rounded-lg shadow-sm transition duration-200 ${
                isRefreshing 
                  ? 'bg-green-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <svg 
                className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
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
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Leads</h2>
            <p className="text-sm text-gray-600 mt-1">
              {leads.length} lead{leads.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-lg font-medium">No leads found</p>
                        <p className="text-sm">Upload a CSV file to get started with your leads.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead, idx) => (
                    <tr key={lead._id || idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {lead.Name || lead.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.Number || lead.number || lead.numbers || lead.phone || lead.Phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.Email || lead.email || lead.emailid || lead.EmailId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {lead.Bio || lead.bio || lead.biography || lead.Biography || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <RoleGuard resource="leads" action="delete">
                          <button
                            onClick={() => handleDeleteSingleLead(lead._id)}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-md transition duration-200"
                            title="Delete this lead"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </RoleGuard>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
