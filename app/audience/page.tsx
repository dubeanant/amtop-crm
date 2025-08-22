'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { RoleGuard } from '../components/ui/RoleGuard';

interface Audience {
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
  stage: string;
  stageUpdatedAt?: string;
  stageUpdatedBy?: string;
  [key: string]: any;
}

interface PipelineStep {
  id: string;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function AudiencePage() {
  const { user, hasPermission } = useAuth();
  const [audience, setAudience] = useState<Audience[]>([]);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [updatingAudienceId, setUpdatingAudienceId] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newAudience, setNewAudience] = useState({
    name: '',
    email: '',
    bio: ''
  });
  const [uploadData, setUploadData] = useState({
    name: '',
    tag: '',
    newTag: '',
    useExistingTag: true,
    existingTags: [] as string[]
  });
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagData, setNewTagData] = useState({
    name: '',
    description: ''
  });

  const fetchAudience = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/audience?userEmail=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (response.ok) {
        // Ensure all audience members have a stage property (default to first pipeline step for existing ones)
        const audienceWithStages = data.map((audience: any) => ({
          ...audience,
          stage: audience.stage || (pipelineSteps.length > 0 ? pipelineSteps[0].title : 'New')
        }));
        setAudience(audienceWithStages);
      } else {
        setError(data.error || 'Failed to fetch audience');
      }
    } catch (error) {
      console.error('Error fetching audience:', error);
      setError('Failed to fetch audience');
    } finally {
      setLoading(false);
    }
  };

  const fetchPipelineSteps = async () => {
    if (!user?.organizationId) return;

    try {
      const response = await fetch(`/api/pipeline/steps?organizationId=${user.organizationId}`);
      const data = await response.json();
      
      if (data.success) {
        setPipelineSteps(data.steps);
      } else {
        console.error('Failed to fetch pipeline steps:', data.error);
      }
    } catch (error) {
      console.error('Error fetching pipeline steps:', error);
    }
  };

  const fetchTags = async () => {
    if (!user?.organizationId) return;

    try {
      const response = await fetch(`/api/pipeline/tags?organizationId=${user.organizationId}`);
      const data = await response.json();
      
      if (data.success) {
        setUploadData(prev => ({
          ...prev,
          existingTags: data.tags.map((tag: any) => tag.name)
        }));
      } else {
        console.error('Failed to fetch tags:', data.error);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const createTag = async () => {
    if (!newTagData.name.trim()) {
      setError('Tag name is required');
      return;
    }

    if (!newTagData.description.trim()) {
      setError('Tag description is required');
      return;
    }

    if (!user?.organizationId) {
      setError('Organization ID is required');
      return;
    }

    try {
      const response = await fetch('/api/pipeline/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTagData.name.trim(),
          description: newTagData.description.trim(),
          organizationId: user.organizationId,
          createdBy: user.uid || user.email
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the existing tags list
        await fetchTags();
        // Set the new tag as selected
        setUploadData(prev => ({
          ...prev,
          tag: newTagData.name.trim(),
          useExistingTag: true
        }));
        setNewTagData({ name: '', description: '' });
        setShowTagModal(false);
        setError('');
      } else {
        setError(data.error || 'Failed to create tag');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      setError('Failed to create tag');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !uploadData.name.trim()) {
      setError('Please select a file and provide a name for this upload');
      return;
    }

    if (!uploadData.tag.trim()) {
      setError('Please select a tag');
      return;
    }

    try {
      setUploadingFile(true);
      setError('');
      setUploadProgress(0);

      // Read file on frontend
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const csvContent = e.target?.result as string;
          const parsedData = parseCSV(csvContent);
          
          // Validate data
          const validationResult = validateAudienceData(parsedData);
          if (!validationResult.isValid) {
            setError(validationResult.error);
            setUploadingFile(false);
            return;
          }

          // Check entry limit
          if (parsedData.length > 100000) {
            setError('Maximum 100,000 entries allowed per upload. Please contact us for larger uploads.');
            setUploadingFile(false);
            return;
          }

          // Upload to database
          const response = await fetch('/api/audience/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audience: parsedData,
              name: uploadData.name.trim(),
              tag: uploadData.tag.trim(),
              userEmail: user?.email
            }),
          });

          if (response.ok) {
            const data = await response.json();
            await fetchAudience();
            setShowUploadModal(false);
            setSelectedFile(null);
            setUploadData({
              name: '',
              tag: '',
              newTag: '',
              useExistingTag: true,
              existingTags: []
            });
            setUploadProgress(0);
          } else {
            const errorData = await response.json();
            setError(errorData.error || 'Failed to upload data');
          }
        } catch (error) {
          console.error('Error processing file:', error);
          setError('Failed to process file');
        } finally {
          setUploadingFile(false);
        }
      };

      fileReader.readAsText(selectedFile);

    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
      setUploadingFile(false);
    }
  };

  const parseCSV = (csvContent: string) => {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    return data;
  };

  const validateAudienceData = (data: any[]) => {
    // Check for required fields
    const requiredFields = ['Name', 'Email'];
    const hasRequiredFields = data.some(row => 
      requiredFields.some(field => 
        (row[field] && row[field].trim() !== '') || 
        (row[field.toLowerCase()] && row[field.toLowerCase()].trim() !== '')
      )
    );

    if (!hasRequiredFields) {
      return {
        isValid: false,
        error: 'CSV must contain Name and Email columns'
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = data.filter(row => {
      const email = row.Email || row.email;
      return email && email.trim() !== '' && !emailRegex.test(email);
    });

    if (invalidEmails.length > 0) {
      return {
        isValid: false,
        error: `Found ${invalidEmails.length} invalid email addresses`
      };
    }

    // Check for suspicious content
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i
    ];

    const suspiciousContent = data.some(row => {
      return Object.values(row).some(value => 
        typeof value === 'string' && 
        suspiciousPatterns.some(pattern => pattern.test(value))
      );
    });

    if (suspiciousContent) {
      return {
        isValid: false,
        error: 'Suspicious content detected in the data'
      };
    }

    // Check data size limits
    const oversizedFields = data.some(row => {
      return Object.values(row).some(value => 
        typeof value === 'string' && value.length > 1000
      );
    });

    if (oversizedFields) {
      return {
        isValid: false,
        error: 'Some fields contain data that is too large (max 1000 characters)'
      };
    }

    return { isValid: true };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Only allow CSV files
      if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
        setError('Please select a valid CSV file');
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setError('');
    }
  };

  const moveAudienceToStage = async (audienceId: string, newStage: string) => {
    if (!hasPermission('pipeline', 'update')) {
      setError('You do not have permission to update audience stages');
      return;
    }

    try {
      setUpdatingAudienceId(audienceId);
      setError('');

      const response = await fetch(`/api/audience/${audienceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stage: newStage,
          stageUpdatedAt: new Date().toISOString(),
          stageUpdatedBy: user?.email
        }),
      });

      if (response.ok) {
        await fetchAudience();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update audience stage');
      }
    } catch (error) {
      console.error('Error updating audience stage:', error);
      setError('Failed to update audience stage');
    } finally {
      setUpdatingAudienceId(null);
    }
  };

  const deleteAudience = async (audienceId: string) => {
    if (!hasPermission('audience', 'delete')) {
      setError('You do not have permission to delete audience members');
      return;
    }

    if (!confirm('Are you sure you want to delete this audience member?')) {
      return;
    }

    try {
      setError('');
      const response = await fetch(`/api/audience/${audienceId}?userEmail=${encodeURIComponent(user?.email || '')}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchAudience();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete audience member');
      }
    } catch (error) {
      console.error('Error deleting audience member:', error);
      setError('Failed to delete audience member');
    }
  };

  const addAudience = async () => {
    if (!hasPermission('audience', 'create')) {
      setError('You do not have permission to add audience members');
      return;
    }

    if (!newAudience.name.trim() || !newAudience.email.trim()) {
      setError('Name and email are required');
      return;
    }

    if (!uploadData.tag.trim()) {
      setError('Please select a tag');
      return;
    }

    try {
      setError('');
      const response = await fetch('/api/audience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience: [{
            Name: newAudience.name.trim(),
            Email: newAudience.email.trim(),
            Bio: newAudience.bio.trim(),
            tag: uploadData.tag.trim()
          }],
          userEmail: user?.email
        }),
      });

      if (response.ok) {
        await fetchAudience();
        setNewAudience({ name: '', email: '', bio: '' });
        setUploadData({
          name: '',
          tag: '',
          newTag: '',
          useExistingTag: true,
          existingTags: uploadData.existingTags
        });
        setShowUploadModal(false);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add audience member');
      }
    } catch (error) {
      console.error('Error adding audience member:', error);
      setError('Failed to add audience member');
    }
  };

  const getAudienceDisplayName = (audience: Audience) => {
    return audience.Name || audience.name || 'No name';
  };

  const getAudienceDisplayEmail = (audience: Audience) => {
    return audience.Email || audience.email || 'No email';
  };

  const getAudienceDisplayPhone = (audience: Audience) => {
    return audience.Number || audience.number || 'No phone';
  };

  const getAudienceDisplayBio = (audience: Audience) => {
    return audience.Bio || audience.bio || audience.biography || audience.Biography || 'No bio';
  };

  const getStageBadgeColor = (stage: string) => {
    const pipelineStep = pipelineSteps.find(step => step.title === stage);
    if (pipelineStep) {
      return `${pipelineStep.bgColor} ${pipelineStep.color.replace('text-', 'text-')}`;
    }
    return 'bg-gray-100 text-gray-800';
  };

  const filteredAudience = audience.filter(audienceMember => {
    const matchesStage = filterStage === 'all' || audienceMember.stage === filterStage;
    const matchesSearch = searchTerm === '' || 
      getAudienceDisplayName(audienceMember).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getAudienceDisplayEmail(audienceMember).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStage && matchesSearch;
  });

  useEffect(() => {
    if (user) {
      fetchPipelineSteps();
      fetchTags();
      fetchAudience();
    }
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading audience...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <RoleGuard resource="audience" action="read" fallback={
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view audience.</p>
        </div>
      }>
        <div className="space-y-6">


          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Audience
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name or email..."
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
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Stages</option>
                  {pipelineSteps.map((step) => (
                    <option key={step.id} value={step.title}>
                      {step.title}
                    </option>
                  ))}
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

          {/* Add Audience Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Audience Member</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newAudience.name}
                    onChange={(e) => setNewAudience({ ...newAudience, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newAudience.email}
                    onChange={(e) => setNewAudience({ ...newAudience, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newAudience.phone}
                    onChange={(e) => setNewAudience({ ...newAudience, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio / Notes
                  </label>
                  <textarea
                    value={newAudience.bio}
                    onChange={(e) => setNewAudience({ ...newAudience, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter any additional notes or bio"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewAudience({ name: '', email: '', phone: '', bio: '' });
                    setError('');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addAudience}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Audience Member
                </button>
              </div>
            </div>
          )}

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Add Audience Members</h3>
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                      setUploadData({
                        name: '',
                        tag: '',
                        newTag: '',
                        useExistingTag: true,
                        existingTags: []
                      });
                      setError('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                                 {/* Tabs */}
                 <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                   <button
                     onClick={() => setShowAddForm(false)}
                     className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                       !showAddForm ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                     }`}
                   >
                     Upload CSV File
                   </button>
                   <button
                     onClick={() => setShowAddForm(true)}
                     className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                       showAddForm ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                     }`}
                   >
                     Add Single Contact
                   </button>
                 </div>

                {/* File Upload Section */}
                {!showAddForm && (
                  <div className="space-y-6">
                                         {/* File Upload */}
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Upload CSV File *
                       </label>
                       <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                         <input
                           type="file"
                           accept=".csv"
                           onChange={handleFileSelect}
                           className="hidden"
                           id="file-upload"
                         />
                         <label htmlFor="file-upload" className="cursor-pointer">
                           <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                           </svg>
                           <p className="text-sm text-gray-600">
                             {selectedFile ? selectedFile.name : 'Click to select CSV file'}
                           </p>
                           <p className="text-xs text-gray-500 mt-1">
                             Supports .csv files only (max 10MB)
                           </p>
                         </label>
                       </div>
                     </div>

                     {/* Entry Limit Info */}
                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                       <div className="flex items-start">
                         <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         <div className="ml-3">
                           <h4 className="text-sm font-medium text-blue-800">Entry Limit</h4>
                           <p className="text-sm text-blue-700 mt-1">
                             Maximum 100,000 entries per upload. For larger uploads, please contact our support team.
                           </p>
                         </div>
                       </div>
                     </div>

                    {/* Upload Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Name *
                      </label>
                      <input
                        type="text"
                        value={uploadData.name}
                        onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Marketing Campaign Leads, Event Attendees"
                      />
                    </div>

                    {/* Tag Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tag *
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="existing-tag"
                            checked={uploadData.useExistingTag}
                            onChange={() => setUploadData({ ...uploadData, useExistingTag: true })}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="existing-tag" className="text-sm text-gray-700">
                            Use existing tag
                          </label>
                        </div>
                        {uploadData.useExistingTag && (
                          <select
                            value={uploadData.tag}
                            onChange={(e) => setUploadData({ ...uploadData, tag: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select a tag</option>
                            {uploadData.existingTags.map((tag) => (
                              <option key={tag} value={tag}>
                                {tag}
                              </option>
                            ))}
                          </select>
                        )}

                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="new-tag"
                            checked={!uploadData.useExistingTag}
                            onChange={() => setUploadData({ ...uploadData, useExistingTag: false })}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="new-tag" className="text-sm text-gray-700">
                            Create new tag
                          </label>
                        </div>
                        {!uploadData.useExistingTag && (
                          <input
                            type="text"
                            value={uploadData.newTag}
                            onChange={(e) => setUploadData({ ...uploadData, newTag: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter new tag name"
                          />
                        )}
                      </div>
                    </div>

                    {/* Upload Progress */}
                    {uploadingFile && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={() => {
                          setShowUploadModal(false);
                          setSelectedFile(null);
                          setUploadData({
                            name: '',
                            tag: '',
                            newTag: '',
                            useExistingTag: true,
                            existingTags: []
                          });
                          setError('');
                        }}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        disabled={uploadingFile}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleFileUpload}
                        disabled={uploadingFile || !selectedFile || !uploadData.name.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingFile ? 'Uploading...' : 'Upload File'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Single Contact Form */}
                {showAddForm && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={newAudience.name}
                          onChange={(e) => setNewAudience({ ...newAudience, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={newAudience.email}
                          onChange={(e) => setNewAudience({ ...newAudience, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter email address"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tag *
                        </label>
                        <div className="space-y-2">
                          <select
                            value={uploadData.tag}
                            onChange={(e) => setUploadData({ ...uploadData, tag: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select a tag</option>
                            {uploadData.existingTags.map((tag) => (
                              <option key={tag} value={tag}>
                                {tag}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowTagModal(true)}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                          >
                            Create New Tag
                          </button>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bio / Notes
                        </label>
                        <textarea
                          value={newAudience.bio}
                          onChange={(e) => setNewAudience({ ...newAudience, bio: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          placeholder="Enter any additional notes or bio"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={() => {
                          setShowUploadModal(false);
                          setNewAudience({ name: '', email: '', bio: '' });
                          setUploadData({
                            name: '',
                            tag: '',
                            newTag: '',
                            useExistingTag: true,
                            existingTags: []
                          });
                          setError('');
                        }}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addAudience}
                        disabled={!newAudience.name.trim() || !newAudience.email.trim() || !uploadData.tag.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Contact
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audience Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Audience</h2>
              <RoleGuard resource="audience" action="create">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Audience</span>
                </button>
              </RoleGuard>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Audience Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Email
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
                  {filteredAudience.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="text-gray-400 mb-4">
                          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-900 mb-2">No audience found</p>
                        <p className="text-gray-600">
                          {searchTerm || filterStage !== 'all' 
                            ? 'Try adjusting your search or filter criteria.' 
                            : 'Upload a CSV file or add audience members manually to get started.'
                          }
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredAudience.map((audienceMember) => (
                      <tr key={audienceMember._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getAudienceDisplayName(audienceMember)}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {getAudienceDisplayBio(audienceMember)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getAudienceDisplayEmail(audienceMember)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageBadgeColor(audienceMember.stage)}`}>
                            {audienceMember.stage.charAt(0).toUpperCase() + audienceMember.stage.slice(1)}
                          </span>
                          {audienceMember.stageUpdatedAt && (
                            <div className="text-xs text-gray-400 mt-1">
                              Updated: {new Date(audienceMember.stageUpdatedAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(audienceMember.uploadedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {/* Stage Change Buttons */}
                            <RoleGuard resource="pipeline" action="update">
                              <div className="flex flex-wrap gap-1">
                                {pipelineSteps
                                  .filter(step => step.title !== audienceMember.stage)
                                  .map((step) => (
                                    <button
                                      key={step.id}
                                      onClick={() => moveAudienceToStage(audienceMember._id, step.title)}
                                      disabled={updatingAudienceId === audienceMember._id}
                                      className={`text-xs px-2 py-1 rounded hover:opacity-80 disabled:opacity-50 ${step.bgColor} ${step.color}`}
                                      title={`Move to ${step.title}`}
                                    >
                                      {updatingAudienceId === audienceMember._id ? '...' : step.title}
                                    </button>
                                  ))}
                              </div>
                            </RoleGuard>
                            
                            {/* Delete Button */}
                            <RoleGuard resource="audience" action="delete">
                              <button
                                onClick={() => deleteAudience(audienceMember._id)}
                                className="text-red-600 hover:text-red-900 hover:bg-red-50 px-2 py-1 rounded text-xs"
                                title="Delete audience member"
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

          {/* Tag Creation Modal */}
          {showTagModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Tag</h3>
                </div>
                
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tag Name *
                    </label>
                    <input
                      type="text"
                      value={newTagData.name}
                      onChange={(e) => setNewTagData({ ...newTagData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter tag name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={newTagData.description}
                      onChange={(e) => setNewTagData({ ...newTagData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Enter tag description"
                    />
                  </div>
                </div>
                
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowTagModal(false);
                      setNewTagData({ name: '', description: '' });
                      setError('');
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createTag}
                    disabled={!newTagData.name.trim() || !newTagData.description.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Tag
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </RoleGuard>
    </Layout>
  );
}