'use client';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/layout/Layout";
import { RoleGuard } from "./components/ui/RoleGuard";
import { AddLeadModal, LeadFormData } from "./components/ui/AddLeadModal";
import Papa from "papaparse";


export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [leads, setLeads] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
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

  // Add single lead to database
  const handleAddSingleLead = async (leadData: LeadFormData) => {
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    try {
      setIsSubmittingLead(true);
      
      // Format the lead data to match the expected structure
      const formattedLead = {
        Name: leadData.name,
        Email: leadData.email,
        Number: leadData.number,
        Bio: leadData.bio || ''
      };

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leads: [formattedLead], // Send as array to match existing API
          userEmail: user.email
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh the leads display
        await fetchLeads();
      } else {
        throw new Error(result.error || "Failed to add lead");
      }
    } catch (error) {
      console.error("Error adding lead:", error);
      throw error; // Re-throw to be handled by the modal
    } finally {
      setIsSubmittingLead(false);
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

  // Update lead stage
  const updateLeadStage = async (leadId: string, newStage: 'lead' | 'engaged' | 'warm') => {
    if (!user?.email) return;
    
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stage: newStage,
          stageUpdatedAt: new Date().toISOString(),
          stageUpdatedBy: user.email
        }),
      });

      if (response.ok) {
        await fetchLeads();
      } else {
        const data = await response.json();
        alert('Failed to update lead stage: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating lead stage:', error);
      alert('Error updating lead stage. Please try again.');
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
                onClick={() => setIsAddModalOpen(true)}
                disabled={loading || !user?.email}
                className={`flex items-center px-4 py-2 text-white font-medium rounded-lg shadow-sm transition duration-200 ${
                  loading || !user?.email
                    ? 'bg-purple-400 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {loading ? 'Loading...' : !user?.email ? 'Not Authenticated' : 'Add Lead'}
              </button>
            </RoleGuard>
            
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

        {/* Pipeline Overview */}
        {leads.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Pipeline Overview</h2>
              <a 
                href="/pipeline" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Full Pipeline →
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-blue-900">
                      {leads.filter(lead => (lead.stage || 'lead') === 'lead').length}
                    </div>
                    <div className="text-sm font-medium text-blue-700">New Leads</div>
                    <div className="text-xs text-blue-600">
                      {leads.length > 0 ? Math.round((leads.filter(lead => (lead.stage || 'lead') === 'lead').length / leads.length) * 100) : 0}% of total
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-yellow-900">
                      {leads.filter(lead => lead.stage === 'engaged').length}
                    </div>
                    <div className="text-sm font-medium text-yellow-700">Engaged Leads</div>
                    <div className="text-xs text-yellow-600">
                      {leads.length > 0 ? Math.round((leads.filter(lead => lead.stage === 'engaged').length / leads.length) * 100) : 0}% of total
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-green-900">
                      {leads.filter(lead => lead.stage === 'warm').length}
                    </div>
                    <div className="text-sm font-medium text-green-700">Warm Leads</div>
                    <div className="text-xs text-green-600">
                      {leads.length > 0 ? Math.round((leads.filter(lead => lead.stage === 'warm').length / leads.length) * 100) : 0}% of total
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-lg font-medium">No leads found</p>
                        <p className="text-sm">Add a single lead or upload a CSV file to get started.</p>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (lead.stage || 'lead') === 'lead' ? 'bg-blue-100 text-blue-800' :
                          (lead.stage || 'lead') === 'engaged' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {((lead.stage || 'lead').charAt(0).toUpperCase() + (lead.stage || 'lead').slice(1))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {lead.Bio || lead.bio || lead.biography || lead.Biography || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {/* Quick Stage Change Buttons */}
                          <RoleGuard resource="pipeline" action="update">
                            <div className="flex space-x-1">
                              {(lead.stage || 'lead') !== 'engaged' && (
                                <button
                                  onClick={() => updateLeadStage(lead._id, 'engaged')}
                                  className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition duration-200"
                                  title="Move to Engaged"
                                >
                                  Engaged
                                </button>
                              )}
                              {(lead.stage || 'lead') !== 'warm' && (
                                <button
                                  onClick={() => updateLeadStage(lead._id, 'warm')}
                                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition duration-200"
                                  title="Move to Warm"
                                >
                                  Warm
                                </button>
                              )}
                              {(lead.stage || 'lead') !== 'lead' && (
                                <button
                                  onClick={() => updateLeadStage(lead._id, 'lead')}
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition duration-200"
                                  title="Move back to Lead"
                                >
                                  Lead
                                </button>
                              )}
                            </div>
                          </RoleGuard>
                          
                          {/* Delete Button */}
                          <RoleGuard resource="leads" action="delete">
                            <button
                              onClick={() => handleDeleteSingleLead(lead._id)}
                              className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded-md transition duration-200"
                              title="Delete this lead"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </RoleGuard>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSingleLead}
        isSubmitting={isSubmittingLead}
      />
    </Layout>
  );
}
