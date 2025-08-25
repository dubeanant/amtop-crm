'use client';
import React, { useState, useRef, useEffect } from 'react';

interface NotesDropdownProps {
  audienceId: string;
  currentNotes: string;
  onSaveNotes: (audienceId: string, notes: string) => Promise<void>;
  isUpdating: boolean;
}

export const NotesDropdown: React.FC<NotesDropdownProps> = ({
  audienceId,
  currentNotes,
  onSaveNotes,
  isUpdating
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(currentNotes);
  const [isEditing, setIsEditing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotes(currentNotes);
  }, [currentNotes]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSave = async () => {
    try {
      await onSaveNotes(audienceId, notes);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const handleCancel = () => {
    setNotes(currentNotes);
    setIsEditing(false);
  };

  const hasNotes = currentNotes && currentNotes.trim() !== '';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`inline-flex items-center px-2 py-1 text-xs rounded-md transition-colors ${
          hasNotes 
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {hasNotes ? 'View Notes' : 'Add Notes'}
        {isUpdating && (
          <div className="ml-1 animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Notes</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  rows={4}
                  placeholder="Enter your notes here..."
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {hasNotes ? (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                    {currentNotes}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No notes added yet.
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {hasNotes ? 'Edit Notes' : 'Add Notes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

