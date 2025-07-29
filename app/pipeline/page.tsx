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

interface StageConfig {
  id: LeadStage;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

const stages: StageConfig[] = [
  {
    id: 'lead',
    title: 'Leads',
    description: 'New leads from CSV uploads',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    id: 'engaged',
    title: 'Engaged Leads',
    description: 'Leads who responded to outreach',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    )
  },
  {
    id: 'warm',
    title: 'Warm Leads',
    description: 'Leads who made small purchases',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

export default function PipelinePage() {
  const { user, hasPermission } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

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

  const bulkMoveLeads = async (leadIds: string[], newStage: LeadStage) => {
    if (!hasPermission('pipeline', 'update')) {
      setError('You do not have permission to update lead stages');
      return;
    }

    try {
      setError('');
      
      const promises = leadIds.map(leadId => 
        fetch(`/api/leads/${leadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            stage: newStage,
            stageUpdatedAt: new Date().toISOString(),
            stageUpdatedBy: user?.email
          }),
        })
      );

      await Promise.all(promises);
      setSelectedLeads(new Set());
      await fetchLeads();
    } catch (error) {
      console.error('Error bulk updating lead stages:', error);
      setError('Failed to update lead stages');
    }
  };

  const toggleLeadSelection = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const selectAllInStage = (stage: LeadStage) => {
    const stageLeads = leads.filter(lead => lead.stage === stage);
    const newSelected = new Set(selectedLeads);
    stageLeads.forEach(lead => newSelected.add(lead._id));
    setSelectedLeads(newSelected);
  };

  const getLeadsByStage = (stage: LeadStage) => {
    return leads.filter(lead => lead.stage === stage);
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
            <p className="mt-4 text-gray-600">Loading pipeline...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <RoleGuard resource="pipeline" action="read" fallback={
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view the pipeline.</p>
        </div>
      }>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
                <p className="text-gray-600 mt-1">
                  Manage leads through different stages of your sales process
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {leads.length} total lead{leads.length !== 1 ? 's' : ''}
                </span>
                {selectedLeads.size > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-600 font-medium">
                      {selectedLeads.size} selected
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => bulkMoveLeads(Array.from(selectedLeads), 'engaged')}
                        className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                      >
                        → Engaged
                      </button>
                      <button
                        onClick={() => bulkMoveLeads(Array.from(selectedLeads), 'warm')}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        → Warm
                      </button>
                    </div>
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

          {/* Pipeline Stages */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {stages.map((stage) => {
              const stageLeads = getLeadsByStage(stage.id);
              return (
                <div key={stage.id} className={`${stage.bgColor} ${stage.borderColor} border-2 rounded-lg`}>
                  {/* Stage Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={stage.color}>{stage.icon}</span>
                        <h3 className={`font-semibold ${stage.color}`}>{stage.title}</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${stage.color}`}>
                          {stageLeads.length}
                        </span>
                        {stageLeads.length > 0 && (
                          <button
                            onClick={() => selectAllInStage(stage.id)}
                            className={`text-xs px-2 py-1 rounded ${stage.color} hover:bg-white hover:bg-opacity-50`}
                            title="Select all in this stage"
                          >
                            Select All
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                  </div>

                  {/* Stage Content */}
                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {stageLeads.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-2">
                          <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">No leads in this stage</p>
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div
                          key={lead._id}
                          className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <input
                                type="checkbox"
                                checked={selectedLeads.has(lead._id)}
                                onChange={() => toggleLeadSelection(lead._id)}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {getLeadDisplayName(lead)}
                                </h4>
                                <p className="text-xs text-gray-600 truncate">
                                  {getLeadDisplayEmail(lead)}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {getLeadDisplayPhone(lead)}
                                </p>
                                {lead.stageUpdatedAt && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Updated: {new Date(lead.stageUpdatedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <RoleGuard resource="pipeline" action="update">
                              <div className="flex flex-col space-y-1 ml-2">
                                {stage.id === 'lead' && (
                                  <>
                                    <button
                                      onClick={() => moveLeadToStage(lead._id, 'engaged')}
                                      disabled={updatingLeadId === lead._id}
                                      className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
                                      title="Move to Engaged"
                                    >
                                      {updatingLeadId === lead._id ? '...' : '→ Engaged'}
                                    </button>
                                    <button
                                      onClick={() => moveLeadToStage(lead._id, 'warm')}
                                      disabled={updatingLeadId === lead._id}
                                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                                      title="Move to Warm"
                                    >
                                      {updatingLeadId === lead._id ? '...' : '→ Warm'}
                                    </button>
                                  </>
                                )}
                                {stage.id === 'engaged' && (
                                  <>
                                    <button
                                      onClick={() => moveLeadToStage(lead._id, 'lead')}
                                      disabled={updatingLeadId === lead._id}
                                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                                      title="Move back to Leads"
                                    >
                                      {updatingLeadId === lead._id ? '...' : '← Lead'}
                                    </button>
                                    <button
                                      onClick={() => moveLeadToStage(lead._id, 'warm')}
                                      disabled={updatingLeadId === lead._id}
                                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                                      title="Move to Warm"
                                    >
                                      {updatingLeadId === lead._id ? '...' : '→ Warm'}
                                    </button>
                                  </>
                                )}
                                {stage.id === 'warm' && (
                                  <>
                                    <button
                                      onClick={() => moveLeadToStage(lead._id, 'lead')}
                                      disabled={updatingLeadId === lead._id}
                                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                                      title="Move back to Leads"
                                    >
                                      {updatingLeadId === lead._id ? '...' : '← Lead'}
                                    </button>
                                    <button
                                      onClick={() => moveLeadToStage(lead._id, 'engaged')}
                                      disabled={updatingLeadId === lead._id}
                                      className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
                                      title="Move back to Engaged"
                                    >
                                      {updatingLeadId === lead._id ? '...' : '← Engaged'}
                                    </button>
                                  </>
                                )}
                              </div>
                            </RoleGuard>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pipeline Statistics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stages.map((stage) => {
                const stageLeads = getLeadsByStage(stage.id);
                const percentage = leads.length > 0 ? (stageLeads.length / leads.length * 100).toFixed(1) : '0';
                
                return (
                  <div key={stage.id} className="text-center">
                    <div className={`text-2xl font-bold ${stage.color}`}>
                      {stageLeads.length}
                    </div>
                    <div className="text-sm text-gray-600">{stage.title}</div>
                    <div className="text-xs text-gray-500">{percentage}% of total</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </RoleGuard>
    </Layout>
  );
}