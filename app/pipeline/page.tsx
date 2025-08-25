'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/layout/Layout';
import { RoleGuard } from '../components/ui/RoleGuard';

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

interface NewStepForm {
  title: string;
  description: string;
  color: string;
  template?: string;
}

interface BulkStepForm {
  steps: NewStepForm[];
}

interface Tag {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface NewTagForm {
  name: string;
  description: string;
}

interface Lead {
  _id: string;
  Name?: string;
  name?: string;
  Email?: string;
  email?: string;
  Bio?: string;
  bio?: string;
  stage: string;
  uploadedAt: string;
  uploadedBy: string;
  [key: string]: any;
}

interface StepTemplate {
  id: string;
  title: string;
  description: string;
  color: string;
  category: string;
}

const basicStepTemplates: StepTemplate[] = [
  {
    id: 'qualification',
    title: 'Qualification',
    description: 'Assess if the lead meets your ideal customer criteria',
    color: 'purple',
    category: 'Basic'
  },
  {
    id: 'discovery',
    title: 'Discovery',
    description: 'Understanding problems, goals, and buying process',
    color: 'yellow',
    category: 'Basic'
  },
  {
    id: 'proposal',
    title: 'Proposal',
    description: 'Present solution and pricing to the prospect',
    color: 'green',
    category: 'Basic'
  },
  {
    id: 'evaluation',
    title: 'Evaluation',
    description: 'Customer compares options, asks questions, raises concerns',
    color: 'indigo',
    category: 'Basic'
  },
  {
    id: 'negotiation',
    title: 'Negotiation',
    description: 'Pricing, contract terms, and approvals',
    color: 'red',
    category: 'Basic'
  },
  {
    id: 'customer',
    title: 'Customer',
    description: 'Successful conversion and onboarding',
    color: 'green',
    category: 'Basic'
  }
];

const advancedStepTemplates: StepTemplate[] = [
  {
    id: 'lead-generation',
    title: 'Lead Generation (Awareness)',
    description: 'Attracting potential leads through ads, SEO, events, referrals',
    color: 'blue',
    category: 'Awareness'
  },
  {
    id: 'lead-nurturing',
    title: 'Lead Nurturing (Engagement)',
    description: 'Educating, sending content, building trust before qualification',
    color: 'indigo',
    category: 'Engagement'
  },
  {
    id: 'mql',
    title: 'Marketing Qualified Lead (MQL)',
    description: 'Shows intent/interest through downloads, webinar sign-ups, etc.',
    color: 'purple',
    category: 'Qualification'
  },
  {
    id: 'sal',
    title: 'Sales Accepted Lead (SAL)',
    description: 'Sales team confirms the lead meets targeting criteria',
    color: 'pink',
    category: 'Qualification'
  },
  {
    id: 'sql',
    title: 'Sales Qualified Lead (SQL)',
    description: 'Deeper check: budget, authority, need, timeline (BANT)',
    color: 'red',
    category: 'Qualification'
  },
  {
    id: 'discovery',
    title: 'Discovery / Needs Analysis',
    description: 'Understanding problems, goals, and buying process',
    color: 'yellow',
    category: 'Sales Process'
  },
  {
    id: 'solution-design',
    title: 'Solution Design / Demo',
    description: 'Showing product/service fit through demo, trial, or tailored proposal',
    color: 'green',
    category: 'Sales Process'
  },
  {
    id: 'value-justification',
    title: 'Value Justification / Business Case',
    description: 'ROI analysis, case studies, stakeholder buy-in',
    color: 'blue',
    category: 'Sales Process'
  },
  {
    id: 'evaluation',
    title: 'Evaluation / Objection Handling',
    description: 'Customer compares options, asks questions, raises concerns',
    color: 'indigo',
    category: 'Sales Process'
  },
  {
    id: 'negotiation',
    title: 'Negotiation / Decision',
    description: 'Pricing, contract terms, and approvals',
    color: 'purple',
    category: 'Closing'
  },
  {
    id: 'closed-won',
    title: 'Closed-Won (Customer)',
    description: 'Successful conversion',
    color: 'green',
    category: 'Closing'
  },
  {
    id: 'onboarding',
    title: 'Onboarding',
    description: 'Training, setup, ensuring first success',
    color: 'blue',
    category: 'Post-Sale'
  },
  {
    id: 'retention',
    title: 'Retention / Expansion',
    description: 'Upsells, cross-sells, renewals, referrals',
    color: 'green',
    category: 'Post-Sale'
  }
];

const colorOptions = [
  { name: 'Blue', value: 'blue', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { name: 'Green', value: 'green', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  { name: 'Yellow', value: 'yellow', color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  { name: 'Red', value: 'red', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  { name: 'Purple', value: 'purple', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { name: 'Indigo', value: 'indigo', color: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  { name: 'Pink', value: 'pink', color: 'text-pink-700', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  { name: 'Gray', value: 'gray', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
];

export default function PipelinePage() {
  const { user, hasPermission } = useAuth();
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editingStep, setEditingStep] = useState<PipelineStep | null>(null);
  const [draggedStep, setDraggedStep] = useState<PipelineStep | null>(null);
  const [newStep, setNewStep] = useState<NewStepForm>({
    title: '',
    description: '',
    color: 'blue',
    template: ''
  });
  const [showAdvancedTemplates, setShowAdvancedTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState<'steps' | 'tags' | 'funnel'>('steps');
  const [tags, setTags] = useState<Tag[]>([]);
  const [showAddTagForm, setShowAddTagForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTag, setNewTag] = useState<NewTagForm>({
    name: '',
    description: ''
  });
  const [bulkSteps, setBulkSteps] = useState<BulkStepForm>({
    steps: [
      { title: '', description: '', color: 'blue', template: '' },
      { title: '', description: '', color: 'green', template: '' },
      { title: '', description: '', color: 'yellow', template: '' }
    ]
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);

  const fetchSteps = async () => {
    console.log('🔍 fetchSteps called with user:', user);
    console.log('🔍 user.organizationId:', user?.organizationId);
    
    if (!user?.organizationId) {
      console.log('❌ No organizationId found, stopping fetch');
      setLoading(false);
      setError('No organization ID found. Please ensure you are part of an organization.');
      return;
    }

    try {
      setLoading(true);
      console.log('📡 Fetching steps for organization:', user.organizationId);
      const response = await fetch(`/api/pipeline/steps?organizationId=${user.organizationId}`);
      const data = await response.json();
      console.log('📡 API response:', data);
      
      if (data.success) {
        if (data.steps.length === 0) {
          console.log('📝 No steps found, creating defaults');
          // Create default steps for new organizations
          await createDefaultSteps();
        } else {
          console.log('✅ Steps loaded:', data.steps);
          setSteps(data.steps);
        }
      } else {
        console.error('❌ API error:', data.error);
        setError(data.error || 'Failed to load pipeline configuration');
      }
    } catch (error) {
      console.error('❌ Error fetching pipeline steps:', error);
      setError('Failed to load pipeline configuration');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSteps = async () => {
    const defaultStepsData = [
      {
        title: 'New Leads',
        description: 'Fresh leads from various sources',
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      {
        title: 'Contacted',
        description: 'Leads that have been reached out to',
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      {
        title: 'Qualified',
        description: 'Leads that meet our criteria',
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      }
    ];

    try {
      const response = await fetch('/api/pipeline/steps/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: defaultStepsData,
          organizationId: user?.organizationId,
          createdBy: user?.uid || user?.email
        })
      });

      const data = await response.json();
      if (data.success) {
        setSteps(data.steps);
      }
    } catch (error) {
      console.error('Error creating default steps:', error);
    }
  };

  const fetchTags = async () => {
    if (!user?.organizationId) return;

    try {
      const response = await fetch(`/api/pipeline/tags?organizationId=${user.organizationId}`);
      const data = await response.json();
      
      if (data.success) {
        setTags(data.tags);
      } else {
        setError(data.error || 'Failed to load tags');
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      setError('Failed to load tags');
    }
  };

  const fetchLeads = async () => {
    if (!user?.email) return;

    try {
      setLoadingLeads(true);
      const response = await fetch(`/api/audience?userEmail=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (response.ok) {
        setLeads(data);
      } else {
        setError(data.error || 'Failed to fetch leads');
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setError('Failed to fetch leads');
    } finally {
      setLoadingLeads(false);
    }
  };

  const getLeadsByStage = (stageTitle: string) => {
    return leads.filter(lead => lead.stage === stageTitle);
  };

  const getLeadDisplayName = (lead: Lead) => {
    return lead.Name || lead.name || 'Unknown';
  };

  const getLeadDisplayEmail = (lead: Lead) => {
    return lead.Email || lead.email || 'No email';
  };

  const getLeadDisplayBio = (lead: Lead) => {
    const bioFields = [
      'Bio', 'bio', 'Biography', 'biography', 'Description', 'description', 
      'Notes', 'notes', 'Comment', 'comment', 'About', 'about', 'Summary', 'summary'
    ];
    
    for (const field of bioFields) {
      if (lead[field] && lead[field].trim()) {
        return lead[field];
      }
    }
    
    return 'No bio';
  };

  const saveSteps = (updatedSteps: PipelineStep[]) => {
    setSteps(updatedSteps);
  };

  const addStep = async () => {
    setError('');
    setSuccess('');
    
    if (!newStep.title.trim()) {
      setError('Step title is required');
      return;
    }

    if (!user?.organizationId) {
      setError('Organization ID is required');
      return;
    }

    try {
      const colorConfig = colorOptions.find(c => c.value === newStep.color) || colorOptions[0];
      
      const response = await fetch('/api/pipeline/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newStep.title.trim(),
          description: newStep.description.trim(),
          color: newStep.color,
          bgColor: colorConfig.bgColor,
          borderColor: colorConfig.borderColor,
          organizationId: user.organizationId,
          createdBy: user.uid || user.email
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const updatedSteps = [...steps, data.step];
        saveSteps(updatedSteps);
        setNewStep({ title: '', description: '', color: 'blue', template: '' });
        setShowAddForm(false);
        setError('');
      } else {
        setError(data.error || 'Failed to create pipeline step');
      }
    } catch (error) {
      console.error('Error adding step:', error);
      setError('Failed to create pipeline step');
    }
  };

  const addBulkSteps = async () => {
    setError('');
    setSuccess('');
    
    const validSteps = bulkSteps.steps.filter(step => step.title.trim());
    
    if (validSteps.length === 0) {
      setError('At least one step title is required');
      return;
    }

    if (!user?.organizationId) {
      setError('Organization ID is required');
      return;
    }

    try {
      const stepsData = validSteps.map(step => {
        const colorConfig = colorOptions.find(c => c.value === step.color) || colorOptions[0];
        return {
          title: step.title.trim(),
          description: step.description.trim(),
          color: step.color,
          bgColor: colorConfig.bgColor,
          borderColor: colorConfig.borderColor
        };
      });

      const response = await fetch('/api/pipeline/steps/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: stepsData,
          organizationId: user.organizationId,
          createdBy: user.uid || user.email
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const updatedSteps = [...steps, ...data.steps];
        saveSteps(updatedSteps);
        setBulkSteps({
          steps: [
            { title: '', description: '', color: 'blue', template: '' },
            { title: '', description: '', color: 'green', template: '' },
            { title: '', description: '', color: 'yellow', template: '' }
          ]
        });
        setShowBulkForm(false);
        setError('');
      } else {
        setError(data.error || 'Failed to create pipeline steps');
      }
    } catch (error) {
      console.error('Error adding bulk steps:', error);
      setError('Failed to create pipeline steps');
    }
  };

  const addBulkStepRow = () => {
    setBulkSteps({
      steps: [...bulkSteps.steps, { title: '', description: '', color: 'blue', template: '' }]
    });
  };

  const getCurrentTemplates = () => {
    return showAdvancedTemplates ? advancedStepTemplates : basicStepTemplates;
  };

  const getAllTemplates = () => {
    return [...basicStepTemplates, ...advancedStepTemplates];
  };

  const selectTemplate = (templateId: string) => {
    const template = getAllTemplates().find(t => t.id === templateId);
    if (template) {
      setNewStep({
        title: template.title,
        description: template.description,
        color: template.color,
        template: templateId
      });
    }
  };

  const selectBulkTemplate = (index: number, templateId: string) => {
    const template = getAllTemplates().find(t => t.id === templateId);
    if (template) {
      const updatedSteps = bulkSteps.steps.map((step, i) => 
        i === index ? {
          title: template.title,
          description: template.description,
          color: template.color,
          template: templateId
        } : step
      );
      setBulkSteps({ steps: updatedSteps });
    }
  };

  const removeBulkStepRow = (index: number) => {
    if (bulkSteps.steps.length > 1) {
      setBulkSteps({
        steps: bulkSteps.steps.filter((_, i) => i !== index)
      });
    }
  };

  const updateBulkStep = (index: number, field: keyof NewStepForm, value: string) => {
    const updatedSteps = bulkSteps.steps.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    );
    setBulkSteps({ steps: updatedSteps });
  };

  const updateStep = async (stepId: string, updates: Partial<PipelineStep>) => {
    setError('');
    setSuccess('');
    
    if (!user?.organizationId) {
      setError('Organization ID is required');
      return;
    }

    try {
      const response = await fetch(`/api/pipeline/steps/${stepId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          organizationId: user.organizationId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const updatedSteps = steps.map(step => 
          step.id === stepId 
            ? { ...step, ...updates, updatedAt: new Date().toISOString() }
            : step
        );
        saveSteps(updatedSteps);
        setEditingStep(null);
      } else {
        setError(data.error || 'Failed to update pipeline step');
      }
    } catch (error) {
      console.error('Error updating step:', error);
      setError('Failed to update pipeline step');
    }
  };

  const deleteStep = async (stepId: string) => {
    setError('');
    setSuccess('');
    
    if (steps.length <= 1) {
      setError('You must have at least one pipeline step');
      return;
    }

    if (!user?.organizationId) {
      setError('Organization ID is required');
      return;
    }

    // Find the step to be deleted for confirmation message
    const stepToDelete = steps.find(step => step.id === stepId);
    if (!stepToDelete) {
      setError('Step not found');
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${stepToDelete.title}"?\n\n` +
      `This will:\n` +
      `• Remove this step from your pipeline\n` +
      `• Move any leads in this step to the first available step\n` +
      `• Reorder the remaining steps\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/pipeline/steps/${stepId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: user.organizationId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh steps from server to get updated order
        await fetchSteps();
        setError(''); // Clear any previous errors
        setSuccess(`Pipeline step "${stepToDelete.title}" deleted successfully. Any leads in that step have been moved to the first available step.`);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Failed to delete pipeline step');
      }
    } catch (error) {
      console.error('Error deleting step:', error);
      setError('Failed to delete pipeline step');
    } finally {
      setLoading(false);
    }
  };

  const reorderSteps = async (draggedStepId: string, targetStepId: string) => {
    const draggedIndex = steps.findIndex(s => s.id === draggedStepId);
    const targetIndex = steps.findIndex(s => s.id === targetStepId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    if (!user?.organizationId) {
      setError('Organization ID is required');
      return;
    }

    const newSteps = [...steps];
    const [draggedStep] = newSteps.splice(draggedIndex, 1);
    newSteps.splice(targetIndex, 0, draggedStep);

    // Update order numbers
    const reorderedSteps = newSteps.map((step, index) => ({
      ...step,
      order: index + 1,
      updatedAt: new Date().toISOString()
    }));

    // Optimistically update UI
    saveSteps(reorderedSteps);

    try {
      const response = await fetch('/api/pipeline/steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: reorderedSteps,
          organizationId: user.organizationId
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Failed to reorder pipeline steps');
        // Revert on error
        await fetchSteps();
      }
    } catch (error) {
      console.error('Error reordering steps:', error);
      setError('Failed to reorder pipeline steps');
      // Revert on error
      await fetchSteps();
    }
  };

  const saveTags = (updatedTags: Tag[]) => {
    setTags(updatedTags);
  };

  const addTag = async () => {
    if (!newTag.name.trim()) {
      setError('Tag name is required');
      return;
    }

    if (!newTag.description.trim()) {
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
          name: newTag.name.trim(),
          description: newTag.description.trim(),
          organizationId: user.organizationId,
          createdBy: user.uid || user.email
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const updatedTags = [...tags, data.tag];
        saveTags(updatedTags);
        setNewTag({ name: '', description: '' });
        setShowAddTagForm(false);
        setError('');
      } else {
        setError(data.error || 'Failed to create tag');
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      setError('Failed to create tag');
    }
  };

  const updateTag = async (tagId: string, updates: Partial<Tag>) => {
    if (!user?.organizationId) {
      setError('Organization ID is required');
      return;
    }

    try {
      const response = await fetch(`/api/pipeline/tags/${tagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          organizationId: user.organizationId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const updatedTags = tags.map(tag => 
          tag.id === tagId 
            ? { ...tag, ...updates, updatedAt: new Date().toISOString() }
            : tag
        );
        saveTags(updatedTags);
        setEditingTag(null);
      } else {
        setError(data.error || 'Failed to update tag');
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      setError('Failed to update tag');
    }
  };

  const deleteTag = async (tagId: string) => {
    if (!user?.organizationId) {
      setError('Organization ID is required');
      return;
    }

    try {
      const response = await fetch(`/api/pipeline/tags/${tagId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: user.organizationId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const updatedTags = tags.filter(tag => tag.id !== tagId);
        saveTags(updatedTags);
      } else {
        setError(data.error || 'Failed to delete tag');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      setError('Failed to delete tag');
    }
  };

  const moveLeadToStage = async (leadId: string, newStage: string) => {
    if (!user?.email) {
      setError('User email is required');
      return;
    }

    try {
      setUpdatingLeadId(leadId);
      setError('');

      const response = await fetch(`/api/audience/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stage: newStage,
          stageUpdatedAt: new Date().toISOString(),
          stageUpdatedBy: user.email
        }),
      });

      if (response.ok) {
        // Update the local state
        setLeads(prevLeads => 
          prevLeads.map(lead => 
            lead._id === leadId 
              ? { ...lead, stage: newStage }
              : lead
          )
        );
        setSuccess(`Lead moved to ${newStage} successfully`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to move lead');
      }
    } catch (error) {
      console.error('Error moving lead:', error);
      setError('Failed to move lead');
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const getNextStage = (currentStage: string) => {
    const currentStepIndex = steps.findIndex(step => step.title === currentStage);
    if (currentStepIndex >= 0 && currentStepIndex < steps.length - 1) {
      return steps[currentStepIndex + 1].title;
    }
    return null;
  };

  const getPreviousStage = (currentStage: string) => {
    const currentStepIndex = steps.findIndex(step => step.title === currentStage);
    if (currentStepIndex > 0) {
      return steps[currentStepIndex - 1].title;
    }
    return null;
  };

  useEffect(() => {
    console.log('🔄 useEffect triggered with user:', user);
    if (user) {
      console.log('👤 User found, fetching data...');
      fetchSteps();
      fetchTags();
      fetchLeads();
    } else {
      console.log('❌ No user found');
    }
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pipeline configuration...</p>
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
          <p className="text-gray-600">You don't have permission to configure the pipeline.</p>
        </div>
      }>
        <div className="space-y-6">

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('steps')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'steps'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Pipeline Steps
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {steps.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('tags')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'tags'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Tags
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {tags.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('funnel')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'funnel'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Funnel View
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {leads.length}
                  </span>
                </button>
              </nav>
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

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Add Step Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Pipeline Step</h3>
              
              {/* Template Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Choose a Template (Optional)
                  </label>
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm ${!showAdvancedTemplates ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                      Basic
                    </span>
                    <button
                      onClick={() => setShowAdvancedTemplates(!showAdvancedTemplates)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        showAdvancedTemplates ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showAdvancedTemplates ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm ${showAdvancedTemplates ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                      Advanced
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {getCurrentTemplates().map((template) => (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template.id)}
                      className={`text-left p-3 rounded-lg border-2 transition-colors ${
                        newStep.template === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900 mb-1">
                        {template.title}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        {template.category}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-2">
                        {template.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step Title *
                  </label>
                  <input
                    type="text"
                    value={newStep.title}
                    onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Qualified Leads"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Theme
                  </label>
                  <select
                    value={newStep.color}
                    onChange={(e) => setNewStep({ ...newStep, color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {colorOptions.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step Goal & Description *
                  </label>
                  <textarea
                    value={newStep.description}
                    onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Explain the goal of this step and what happens here. Be specific about:
• What actions are taken in this step?
• What criteria must be met to move to the next step?
• What tools or processes are used?
• What outcomes indicate success?

This helps AI understand your funnel better for automation and insights."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewStep({ title: '', description: '', color: 'blue', template: '' });
                    setError('');
                    setSuccess('');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addStep}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Step
                </button>
              </div>
            </div>
          )}

          {/* Bulk Add Steps Form */}
          {showBulkForm && (
            <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Multiple Pipeline Steps</h3>
                <button
                  onClick={addBulkStepRow}
                  className="text-green-600 hover:text-green-700 flex items-center space-x-1 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Row</span>
                </button>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {bulkSteps.steps.map((step, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Step #{index + 1}</span>
                      <div className="flex items-center space-x-2">
                        <select
                          value={step.template || ''}
                          onChange={(e) => selectBulkTemplate(index, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Choose Template</option>
                          <optgroup label="Basic Templates">
                            {basicStepTemplates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.title}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Advanced Templates">
                            {advancedStepTemplates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.title}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                        {bulkSteps.steps.length > 1 && (
                          <button
                            onClick={() => removeBulkStepRow(index)}
                            className="text-red-400 hover:text-red-600 p-1"
                            title="Remove this step"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => updateBulkStep(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          placeholder="Step title"
                        />
                      </div>
                      <div>
                        <select
                          value={step.color}
                          onChange={(e) => updateBulkStep(index, 'color', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                        >
                          {colorOptions.map((color) => (
                            <option key={color.value} value={color.value}>
                              {color.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <textarea
                          value={step.description}
                          onChange={(e) => updateBulkStep(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-none"
                          rows={2}
                          placeholder="Goal & description - what happens in this step?"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-600">
                  {bulkSteps.steps.filter(s => s.title.trim()).length} of {bulkSteps.steps.length} steps have titles
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowBulkForm(false);
                      setBulkSteps({
                        steps: [
                          { title: '', description: '', color: 'blue', template: '' },
                          { title: '', description: '', color: 'green', template: '' },
                          { title: '', description: '', color: 'yellow', template: '' }
                        ]
                      });
                      setError('');
                      setSuccess('');
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addBulkSteps}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add All Steps
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Tag Form */}
          {showAddTagForm && (
            <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Tag</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tag Name *
                  </label>
                  <input
                    type="text"
                    value={newTag.name}
                    onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., High Priority, VIP Customer"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newTag.description}
                    onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={3}
                    placeholder="Describe what this tag represents and when to use it"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowAddTagForm(false);
                    setNewTag({ name: '', description: '' });
                    setError('');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Add Tag
                </button>
              </div>
            </div>
          )}

          {/* Tags Content */}
          {activeTab === 'tags' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Your Tags</h2>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">{tags.length} tag{tags.length !== 1 ? 's' : ''}</span>
                  <RoleGuard resource="pipeline" action="update">
                    <button
                      onClick={() => setShowAddTagForm(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>Add Tag</span>
                    </button>
                  </RoleGuard>
                </div>
              </div>

              {tags.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tags Created</h3>
                  <p className="text-gray-600 mb-4">Create tags to organize and categorize your leads</p>
                  <RoleGuard resource="pipeline" action="update">
                    <button
                      onClick={() => setShowAddTagForm(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                    >
                      Create Your First Tag
                    </button>
                  </RoleGuard>
                </div>
              ) : (
                <div className="space-y-3">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                              {editingTag?.id === tag.id ? (
                                <input
                                  type="text"
                                  value={editingTag.name}
                                  onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                                  className="bg-white px-2 py-1 rounded border border-gray-300 text-sm min-w-0"
                                  onBlur={() => updateTag(tag.id, { name: editingTag.name })}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      updateTag(tag.id, { name: editingTag.name });
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                tag.name
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              Created {new Date(tag.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {editingTag?.id === tag.id ? (
                              <textarea
                                value={editingTag.description}
                                onChange={(e) => setEditingTag({ ...editingTag, description: e.target.value })}
                                className="w-full bg-white px-2 py-1 rounded border border-gray-300 text-sm resize-none"
                                rows={2}
                                onBlur={() => updateTag(tag.id, { description: editingTag.description })}
                              />
                            ) : (
                              tag.description
                            )}
                          </p>
                        </div>
                        <RoleGuard resource="pipeline" action="update">
                          <div className="flex space-x-1 ml-4">
                            <button
                              onClick={() => setEditingTag(tag)}
                              className="text-gray-400 hover:text-gray-600 p-1"
                              title="Edit tag"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteTag(tag.id)}
                              className="text-red-400 hover:text-red-600 p-1"
                              title="Delete tag"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </RoleGuard>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pipeline Steps */}
          {activeTab === 'steps' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Your Pipeline Steps</h2>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
                <RoleGuard resource="pipeline" action="update">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Step</span>
                    </button>
                    <button
                      onClick={() => setShowBulkForm(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>Add Multiple</span>
                    </button>
                  </div>
                </RoleGuard>
              </div>
            </div>

            {steps.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pipeline Steps</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first pipeline step</p>
                <RoleGuard resource="pipeline" action="update">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Add Your First Step
                    </button>
                    <button
                      onClick={() => setShowBulkForm(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Add Multiple Steps
                    </button>
                  </div>
                </RoleGuard>
              </div>
            ) : (
              <div className="space-y-4">
                {steps
                  .sort((a, b) => a.order - b.order)
                  .map((step, index) => {
                    const colorConfig = colorOptions.find(c => c.value === step.color) || colorOptions[0];
                    return (
                      <div
                        key={step.id}
                        draggable
                        onDragStart={() => setDraggedStep(step)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedStep && draggedStep.id !== step.id) {
                            reorderSteps(draggedStep.id, step.id);
                          }
                          setDraggedStep(null);
                        }}
                        className={`${colorConfig.bgColor} ${colorConfig.borderColor} border-2 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow w-full`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="bg-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-600">
                              {index + 1}
                            </span>
                            <h3 className={`font-semibold ${colorConfig.color}`}>
                              {editingStep?.id === step.id ? (
                                <input
                                  type="text"
                                  value={editingStep.title}
                                  onChange={(e) => setEditingStep({ ...editingStep, title: e.target.value })}
                                  className="bg-white px-2 py-1 rounded border border-gray-300 text-sm"
                                  onBlur={() => updateStep(step.id, { title: editingStep.title })}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      updateStep(step.id, { title: editingStep.title });
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                step.title
                              )}
                            </h3>
                          </div>
                          <RoleGuard resource="pipeline" action="update">
                            <div className="flex space-x-1">
                              <button
                                onClick={() => setEditingStep(step)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                                title="Edit step"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteStep(step.id)}
                                className="text-red-400 hover:text-red-600 p-1"
                                title="Delete step"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </RoleGuard>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {editingStep?.id === step.id ? (
                            <textarea
                              value={editingStep.description}
                              onChange={(e) => setEditingStep({ ...editingStep, description: e.target.value })}
                              className="w-full bg-white px-2 py-1 rounded border border-gray-300 text-sm resize-none"
                              rows={2}
                              onBlur={() => updateStep(step.id, { description: editingStep.description })}
                            />
                          ) : (
                            step.description || 'No description'
                          )}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Step {step.order}</span>
                          <span>Updated {new Date(step.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
          )}

          

                                {/* Funnel View */}
            {activeTab === 'funnel' && (
              <div className="space-y-6">

               {loadingLeads ? (
                 <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                   <p className="mt-4 text-gray-600">Loading leads...</p>
                 </div>
               ) : steps.length === 0 ? (
                 <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                   <div className="text-gray-400 mb-4">
                     <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                     </svg>
                   </div>
                   <h3 className="text-lg font-medium text-gray-900 mb-2">No Pipeline Steps</h3>
                   <p className="text-gray-600">Create pipeline steps first to view your funnel</p>
                 </div>
               ) : (
                 <div className="bg-white rounded-lg shadow-sm">
                   <div className="flex">
                     {/* Vertical Tabs - Left Sidebar */}
                     <div className="w-80 border-r border-gray-200 bg-gray-50">
                       <div className="p-4 border-b border-gray-200">
                         <h3 className="text-sm font-medium text-gray-900">Pipeline Steps</h3>
                         <p className="text-xs text-gray-500 mt-1">Click to view leads</p>
                       </div>
                       <div className="overflow-y-auto max-h-96">
                         {steps
                           .sort((a, b) => a.order - b.order)
                           .map((step, index) => {
                             const colorConfig = colorOptions.find(c => c.value === step.color) || colorOptions[0];
                             const stepLeads = getLeadsByStage(step.title);
                             const isSelected = selectedStep === step.title;
                             
                             return (
                               <button
                                 key={step.id}
                                 onClick={() => setSelectedStep(step.title)}
                                 className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-100 transition-colors ${
                                   isSelected ? 'bg-white border-r-2 border-r-green-500' : ''
                                 }`}
                               >
                                 <div className="flex items-center justify-between mb-2">
                                   <div className="flex items-center space-x-2">
                                     <span className={`rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium ${
                                       isSelected ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                                     }`}>
                                       {index + 1}
                                     </span>
                                     <h4 className={`font-medium text-sm ${
                                       isSelected ? 'text-green-700' : 'text-gray-900'
                                     }`}>
                                       {step.title}
                                     </h4>
                                   </div>
                                   <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                     stepLeads.length > 0 
                                       ? 'bg-green-100 text-green-700' 
                                       : 'bg-gray-100 text-gray-500'
                                   }`}>
                                     {stepLeads.length}
                                   </span>
                                 </div>
                                 <p className="text-xs text-gray-500 line-clamp-2">
                                   {step.description || 'No description'}
                                 </p>
                               </button>
                             );
                           })}
                       </div>
                     </div>

                     {/* Content Area - Right Side */}
                     <div className="flex-1">
                       {selectedStep ? (
                         <div className="p-6">
                           <div className="flex items-center justify-between mb-4">
                             <div>
                               <h3 className="text-lg font-semibold text-gray-900">
                                 {selectedStep}
                               </h3>
                               <p className="text-sm text-gray-500">
                                 {getLeadsByStage(selectedStep).length} leads in this stage
                               </p>
                             </div>
                             <button
                               onClick={() => setSelectedStep(null)}
                               className="text-gray-400 hover:text-gray-600"
                             >
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                               </svg>
                             </button>
                           </div>

                           {getLeadsByStage(selectedStep).length > 0 ? (
                             <div className="space-y-3 max-h-96 overflow-y-auto">
                               {getLeadsByStage(selectedStep).map((lead) => {
                                 const nextStage = getNextStage(lead.stage);
                                 const previousStage = getPreviousStage(lead.stage);
                                 const availableStages = steps
                                   .filter(step => step.title !== lead.stage)
                                   .map(step => step.title);
                                 
                                 return (
                                   <div key={lead._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                                     <div className="flex items-start justify-between">
                                       <div className="flex-1 min-w-0">
                                         <div className="flex items-center space-x-2 mb-1">
                                           <p className="text-sm font-medium text-gray-900 truncate">
                                             {getLeadDisplayName(lead)}
                                           </p>
                                           <span className="text-xs text-gray-400">•</span>
                                           <p className="text-xs text-gray-500 truncate">
                                             {getLeadDisplayEmail(lead)}
                                           </p>
                                         </div>
                                         <p className="text-xs text-gray-600 line-clamp-2">
                                           {getLeadDisplayBio(lead)}
                                         </p>
                                         <div className="flex items-center justify-between mt-2">
                                           <div className="text-xs text-gray-400">
                                             <span>Added {new Date(lead.uploadedAt).toLocaleDateString()}</span>
                                             <span className="mx-1">•</span>
                                             <span>by {lead.uploadedBy}</span>
                                           </div>
                                           
                                           {/* Action Dropdown */}
                                           <div className="flex items-center space-x-2">
                                             {nextStage && (
                                               <button
                                                 onClick={() => moveLeadToStage(lead._id, nextStage)}
                                                 disabled={updatingLeadId === lead._id}
                                                 className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                 title={`Move to ${nextStage}`}
                                               >
                                                 {updatingLeadId === lead._id ? 'Moving...' : '→ Next'}
                                               </button>
                                             )}
                                             
                                             {previousStage && (
                                               <button
                                                 onClick={() => moveLeadToStage(lead._id, previousStage)}
                                                 disabled={updatingLeadId === lead._id}
                                                 className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                 title={`Move to ${previousStage}`}
                                               >
                                                 {updatingLeadId === lead._id ? 'Moving...' : '← Previous'}
                                               </button>
                                             )}
                                             
                                             <select
                                               onChange={(e) => {
                                                 if (e.target.value) {
                                                   moveLeadToStage(lead._id, e.target.value);
                                                 }
                                               }}
                                               disabled={updatingLeadId === lead._id}
                                               className="px-2 py-1 text-xs border border-gray-300 rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                               defaultValue=""
                                             >
                                               <option value="">Custom Stage</option>
                                               {availableStages.map((stage) => (
                                                 <option key={stage} value={stage}>
                                                   {stage}
                                                 </option>
                                               ))}
                                             </select>
                                           </div>
                                         </div>
                                       </div>
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>
                           ) : (
                             <div className="text-center py-12">
                               <div className="text-gray-400 mb-4">
                                 <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                 </svg>
                               </div>
                               <h4 className="text-sm font-medium text-gray-900 mb-1">No leads in this stage</h4>
                               <p className="text-sm text-gray-500">Leads will appear here when they reach this stage</p>
                             </div>
                           )}
                         </div>
                       ) : (
                         <div className="flex items-center justify-center h-64">
                           <div className="text-center">
                             <div className="text-gray-400 mb-4">
                               <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                               </svg>
                             </div>
                             <h4 className="text-sm font-medium text-gray-900 mb-1">Select a Pipeline Step</h4>
                             <p className="text-sm text-gray-500">Choose a step from the left to view its leads</p>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               )}
             </div>
           )}
        </div>
      </RoleGuard>
    </Layout>
  );
}