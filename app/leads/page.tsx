'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { RoleGuard } from '../components/ui/RoleGuard';

interface Lead {
  _id: string;
  Name?: string;
  Number?: string;
  Email?: string;
  Bio?: string;
  name?: string;
  number?: string;
  email?: string;
  bio?: string;
  biography?: string;
  Biography?: string;
  uploadedBy: string;
  uploadedAt: string;
  stage: 'lead' | 'engaged' | 'warm';
  stageUpdatedAt?: string;
  stageUpdatedBy?: string;
  [key: string]: any;
}

type LeadStage = 'lead' | 'engaged' | 'warm';

export default function LeadsPage() {
  const { user, hasPermission } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<LeadStage | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLeads = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/leads?userEmail=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (response.ok) {
        // Ensure all leads have a stage property (default to 'lead' for existing leads)
        const leadsWithStages = data.map((lead: any) => ({
          ...lead,
          stage: lead.stage || 'lead'
        }));
        setLeads(leadsWithStages);
      } else {
        setError(data.error || 'Failed to fetch leads');
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setError('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const moveLeadToStage = async (leadId: string, newStage: LeadStage) => {
    if (!hasPermission('pipeline', 'update')) {
      setError('You do not have permission to update lead stages');
      return;
    }

    try {
      setUpdatingLeadId(leadId);
      setError('');

      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stage: newStage,
          stageUpdatedAt: new Date().toISOString(),
          stageUpdatedBy: user?.email
        }),
      });

      if (response.ok) {
        await fetchLeads();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update lead stage');
      }
    } catch (error) {
      console.error('Error updating lead stage:', error);
      setError('Failed to update lead stage');
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!hasPermission('leads', 'delete')) {
      setError('You do not have permission to delete leads');
      return;
    }

    if (!confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      setError('');
      const response = await fetch(`/api/leads/${leadId}?userEmail=${encodeURIComponent(user?.email || '')}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchLeads();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete lead');
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      setError('Failed to delete lead');
    }
  };

  const getLeadDisplayName = (lead: Lead) => {
    return lead.Name || lead.name || 'No name';
  };

  const getLeadDisplayEmail = (lead: Lead) => {
    return lead.Email || lead.email || 'No email';
  };

  const getLeadDisplayPhone = (lead: Lead) => {
    return lead.Number || lead.number || 'No phone';
  };

  const getLeadDisplayBio = (lead: Lead) => {
    return lead.Bio || lead.bio || lead.biography || lead.Biography || 'No bio';
  };

  const getStageBadgeColor = (stage: LeadStage) => {
    switch (stage) {
      case 'lead':
        return 'bg-blue-100 text-blue-800';
      case 'engaged':
        return 'bg-yellow-100 text-yellow-800';
      case 'warm':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesStage = filterStage === 'all' || lead.stage === filterStage;
    const matchesSearch = searchTerm === '' || 
      getLeadDisplayName(lead).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getLeadDisplayEmail(lead).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getLeadDisplayPhone(lead).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStage && matchesSearch;
  });

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leads...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <RoleGuard resource="leads" action="read" fallback={
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view leads.</p>
        </div>
      }>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Leads</h1>
                <p className="text-gray-600 mt-1">
                  View and manage all your leads in one place
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {filteredLeads.length} of {leads.length} lead{leads.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Leads
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="stage-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Stage
                </label>
                <select
                  id="stage-filter"
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value as LeadStage | 'all')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Stages</option>
                  <option value="lead">Leads</option>
                  <option value="engaged">Engaged</option>
                  <option value="warm">Warm</option>
                </select>
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

          {/* Leads Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Leads</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Lead Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Added
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="text-gray-400 mb-4">
                          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-900 mb-2">No leads found</p>
                        <p className="text-gray-600">
                          {searchTerm || filterStage !== 'all' 
                            ? 'Try adjusting your search or filter criteria.' 
                            : 'Upload a CSV file or add leads manually to get started.'
                          }
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getLeadDisplayName(lead)}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {getLeadDisplayBio(lead)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getLeadDisplayEmail(lead)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getLeadDisplayPhone(lead)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageBadgeColor(lead.stage)}`}>
                            {lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1)}
                          </span>
                          {lead.stageUpdatedAt && (
                            <div className="text-xs text-gray-400 mt-1">
                              Updated: {new Date(lead.stageUpdatedAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(lead.uploadedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {/* Stage Change Buttons */}
                            <RoleGuard resource="pipeline" action="update">
                              <div className="flex space-x-1">
                                {lead.stage !== 'engaged' && (
                                  <button
                                    onClick={() => moveLeadToStage(lead._id, 'engaged')}
                                    disabled={updatingLeadId === lead._id}
                                    className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
                                    title="Move to Engaged"
                                  >
                                    {updatingLeadId === lead._id ? '...' : 'Engaged'}
                                  </button>
                                )}
                                {lead.stage !== 'warm' && (
                                  <button
                                    onClick={() => moveLeadToStage(lead._id, 'warm')}
                                    disabled={updatingLeadId === lead._id}
                                    className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                                    title="Move to Warm"
                                  >
                                    {updatingLeadId === lead._id ? '...' : 'Warm'}
                                  </button>
                                )}
                                {lead.stage !== 'lead' && (
                                  <button
                                    onClick={() => moveLeadToStage(lead._id, 'lead')}
                                    disabled={updatingLeadId === lead._id}
                                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                                    title="Move back to Lead"
                                  >
                                    {updatingLeadId === lead._id ? '...' : 'Lead'}
                                  </button>
                                )}
                              </div>
                            </RoleGuard>
                            
                            {/* Delete Button */}
                            <RoleGuard resource="leads" action="delete">
                              <button
                                onClick={() => deleteLead(lead._id)}
                                className="text-red-600 hover:text-red-900 hover:bg-red-50 px-2 py-1 rounded text-xs"
                                title="Delete lead"
                              >
                                Delete
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

          {/* Summary Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{leads.length}</div>
                <div className="text-sm text-gray-600">Total Leads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {leads.filter(l => l.stage === 'lead').length}
                </div>
                <div className="text-sm text-gray-600">New Leads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {leads.filter(l => l.stage === 'engaged').length}
                </div>
                <div className="text-sm text-gray-600">Engaged</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {leads.filter(l => l.stage === 'warm').length}
                </div>
                <div className="text-sm text-gray-600">Warm Leads</div>
              </div>
            </div>
          </div>
        </div>
      </RoleGuard>
    </Layout>
  );
}