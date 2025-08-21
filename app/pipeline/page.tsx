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
  const [activeTab, setActiveTab] = useState<'steps' | 'tags'>('steps');
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

  const fetchSteps = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      // For now, we'll use localStorage to store pipeline steps
      // In a real app, this would be an API call
      const savedSteps = localStorage.getItem(`pipeline_steps_${user.email}`);
      if (savedSteps) {
        setSteps(JSON.parse(savedSteps));
      } else {
        // Default steps for new users
        const defaultSteps: PipelineStep[] = [
          {
            id: '1',
            title: 'New Leads',
            description: 'Fresh leads from various sources',
            color: 'blue',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            order: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Contacted',
            description: 'Leads that have been reached out to',
            color: 'yellow',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
            order: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '3',
            title: 'Qualified',
            description: 'Leads that meet our criteria',
            color: 'green',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            order: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setSteps(defaultSteps);
        localStorage.setItem(`pipeline_steps_${user.email}`, JSON.stringify(defaultSteps));
      }
    } catch (error) {
      console.error('Error fetching pipeline steps:', error);
      setError('Failed to load pipeline configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    if (!user?.email) return;

    try {
      const savedTags = localStorage.getItem(`pipeline_tags_${user.email}`);
      if (savedTags) {
        setTags(JSON.parse(savedTags));
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      setError('Failed to load tags');
    }
  };

  const saveSteps = (updatedSteps: PipelineStep[]) => {
    if (!user?.email) return;
    localStorage.setItem(`pipeline_steps_${user.email}`, JSON.stringify(updatedSteps));
    setSteps(updatedSteps);
  };

  const addStep = () => {
    if (!newStep.title.trim()) {
      setError('Step title is required');
      return;
    }

    const colorConfig = colorOptions.find(c => c.value === newStep.color) || colorOptions[0];
    const step: PipelineStep = {
      id: Date.now().toString(),
      title: newStep.title.trim(),
      description: newStep.description.trim(),
      color: newStep.color,
      bgColor: colorConfig.bgColor,
      borderColor: colorConfig.borderColor,
      order: steps.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedSteps = [...steps, step];
    saveSteps(updatedSteps);
    setNewStep({ title: '', description: '', color: 'blue', template: '' });
    setShowAddForm(false);
    setError('');
  };

  const addBulkSteps = () => {
    const validSteps = bulkSteps.steps.filter(step => step.title.trim());
    
    if (validSteps.length === 0) {
      setError('At least one step title is required');
      return;
    }

    const newSteps: PipelineStep[] = validSteps.map((step, index) => {
      const colorConfig = colorOptions.find(c => c.value === step.color) || colorOptions[0];
      return {
        id: (Date.now() + index).toString(),
        title: step.title.trim(),
        description: step.description.trim(),
        color: step.color,
        bgColor: colorConfig.bgColor,
        borderColor: colorConfig.borderColor,
        order: steps.length + index + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    const updatedSteps = [...steps, ...newSteps];
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

  const updateStep = (stepId: string, updates: Partial<PipelineStep>) => {
    const updatedSteps = steps.map(step => 
      step.id === stepId 
        ? { ...step, ...updates, updatedAt: new Date().toISOString() }
        : step
    );
    saveSteps(updatedSteps);
    setEditingStep(null);
  };

  const deleteStep = (stepId: string) => {
    if (steps.length <= 1) {
      setError('You must have at least one pipeline step');
      return;
    }
    
    const updatedSteps = steps.filter(step => step.id !== stepId);
    // Reorder remaining steps
    const reorderedSteps = updatedSteps.map((step, index) => ({
      ...step,
      order: index + 1,
      updatedAt: new Date().toISOString()
    }));
    saveSteps(reorderedSteps);
  };

  const reorderSteps = (draggedStepId: string, targetStepId: string) => {
    const draggedIndex = steps.findIndex(s => s.id === draggedStepId);
    const targetIndex = steps.findIndex(s => s.id === targetStepId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSteps = [...steps];
    const [draggedStep] = newSteps.splice(draggedIndex, 1);
    newSteps.splice(targetIndex, 0, draggedStep);

    // Update order numbers
    const reorderedSteps = newSteps.map((step, index) => ({
      ...step,
      order: index + 1,
      updatedAt: new Date().toISOString()
    }));

    saveSteps(reorderedSteps);
  };

  const saveTags = (updatedTags: Tag[]) => {
    if (!user?.email) return;
    localStorage.setItem(`pipeline_tags_${user.email}`, JSON.stringify(updatedTags));
    setTags(updatedTags);
  };

  const addTag = () => {
    if (!newTag.name.trim()) {
      setError('Tag name is required');
      return;
    }

    if (!newTag.description.trim()) {
      setError('Tag description is required');
      return;
    }

    // Check for duplicate tag names
    if (tags.some(tag => tag.name.toLowerCase() === newTag.name.trim().toLowerCase())) {
      setError('A tag with this name already exists');
      return;
    }

    const tag: Tag = {
      id: Date.now().toString(),
      name: newTag.name.trim(),
      description: newTag.description.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedTags = [...tags, tag];
    saveTags(updatedTags);
    setNewTag({ name: '', description: '' });
    setShowAddTagForm(false);
    setError('');
  };

  const updateTag = (tagId: string, updates: Partial<Tag>) => {
    const updatedTags = tags.map(tag => 
      tag.id === tagId 
        ? { ...tag, ...updates, updatedAt: new Date().toISOString() }
        : tag
    );
    saveTags(updatedTags);
    setEditingTag(null);
  };

  const deleteTag = (tagId: string) => {
    const updatedTags = tags.filter(tag => tag.id !== tagId);
    saveTags(updatedTags);
  };

  useEffect(() => {
    if (user) {
      fetchSteps();
      fetchTags();
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
          {/* Page Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pipeline Configuration</h1>
                <p className="text-gray-600 mt-1">
                  Set up and customize your sales funnel steps and tags
                </p>
              </div>
              <RoleGuard resource="pipeline" action="update">
                <div className="flex space-x-3">
                  {activeTab === 'steps' ? (
                    <>
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
                    </>
                  ) : (
                    <button
                      onClick={() => setShowAddTagForm(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>Add Tag</span>
                    </button>
                  )}
                </div>
              </RoleGuard>
            </div>
          </div>

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
                <span className="text-sm text-gray-500">{tags.length} tag{tags.length !== 1 ? 's' : ''}</span>
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
              <span className="text-sm text-gray-500">{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
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

          {/* Instructions */}
          {activeTab === 'steps' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Pipeline Setup Tips</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use "Add Step" for single steps or "Add Multiple" for bulk creation</li>
                    <li>Drag and drop steps to reorder them</li>
                    <li>Click the edit icon to modify step names and descriptions</li>
                    <li>Choose different colors to visually distinguish your steps</li>
                    <li>Your pipeline configuration is saved automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </RoleGuard>
    </Layout>
  );
}