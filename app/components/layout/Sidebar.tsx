'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { RoleGuard } from '../ui/RoleGuard';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  resource?: string;
  action?: string;
  allowedRoles?: string[];
  badge?: string;
  description?: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'Overview',
    items: [
      {
        name: 'Dashboard',
        href: '/',
        description: 'Overview and key metrics',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        ),
      },
      {
        name: 'Analytics',
        href: '/analytics',
        description: 'Reports and insights',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
        resource: 'analytics',
        action: 'read',
      },
    ]
  },
  {
    title: 'Sales',
    items: [
      {
        name: 'Audience',
        href: '/audience',
        description: 'Manage your audience',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        resource: 'audience',
        action: 'read',
      },
      {
        name: 'Pipeline',
        href: '/pipeline',
        description: 'Configure sales stages',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        resource: 'pipeline',
        action: 'read',
      },
    ]
  },
  {
    title: 'Management',
    items: [
      {
        name: 'Users',
        href: '/users',
        description: 'Team management',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        ),
        resource: 'users',
        action: 'read',
      },
      {
        name: 'Settings',
        href: '/settings',
        description: 'System configuration',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        resource: 'settings',
        action: 'read',
      },
    ]
  }
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionTitle: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionTitle)) {
      newCollapsed.delete(sectionTitle);
    } else {
      newCollapsed.add(sectionTitle);
    }
    setCollapsedSections(newCollapsed);
  };

  const renderNavItem = (item: SidebarItem) => {
    const isActive = pathname === item.href;
    
    // Special handling for Analytics - check for both 'read' and 'read_own' permissions
    if (item.name === 'Analytics') {
      const hasAnalyticsAccess = user && (
        user.permissions.some(p => 
          p.resource === 'analytics' && 
          (p.actions.includes('read') || p.actions.includes('read_own'))
        )
      );
      
      if (!hasAnalyticsAccess) {
        return null;
      }
      
      return (
        <Link
          key={item.name}
          href={item.href}
          className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] ${
            isActive
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
          onClick={() => onClose()}
        >
          <span className={`mr-3 transition-colors duration-200 ${
            isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
          }`}>
            {item.icon}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-medium">{item.name}</div>
            {item.description && (
              <div className={`text-xs mt-0.5 ${
                isActive ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {item.description}
              </div>
            )}
          </div>
          {item.badge && (
            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
              isActive 
                ? 'bg-white/20 text-white' 
                : 'bg-blue-100 text-blue-600'
            }`}>
              {item.badge}
            </span>
          )}
          {isActive && (
            <div className="absolute right-0 w-1 h-8 bg-white rounded-l-full"></div>
          )}
        </Link>
      );
    }
    
    // Regular RoleGuard for other items
    if (item.resource && item.action) {
      return (
        <RoleGuard
          key={item.name}
          resource={item.resource}
          action={item.action}
        >
          <Link
            href={item.href}
            className={`group relative flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] ${
              isActive
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
            onClick={() => onClose()}
          >
            <span className={`mr-3 transition-colors duration-200 ${
              isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
            }`}>
              {item.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{item.name}</div>
              {item.description && (
                <div className={`text-xs mt-0.5 ${
                  isActive ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {item.description}
                </div>
              )}
            </div>
            {item.badge && (
              <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {item.badge}
              </span>
            )}
            {isActive && (
              <div className="absolute right-0 w-1 h-8 bg-white rounded-l-full"></div>
            )}
          </Link>
        </RoleGuard>
      );
    }

    // Items without role restrictions
    return (
      <Link
        key={item.name}
        href={item.href}
        className={`group relative flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] ${
          isActive
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }`}
        onClick={() => onClose()}
      >
        <span className={`mr-3 transition-colors duration-200 ${
          isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
        }`}>
          {item.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{item.name}</div>
          {item.description && (
            <div className={`text-xs mt-0.5 ${
              isActive ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {item.description}
            </div>
          )}
        </div>
        {item.badge && (
          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
            isActive 
              ? 'bg-white/20 text-white' 
              : 'bg-blue-100 text-blue-600'
          }`}>
            {item.badge}
          </span>
        )}
        {isActive && (
          <div className="absolute right-0 w-1 h-8 bg-white rounded-l-full"></div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 shadow-2xl transform transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img 
                  src="/amTop-logo.jpg" 
                  alt="amTop Logo" 
                  className="w-10 h-10 rounded-xl shadow-lg ring-2 ring-white"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Lead Management</h1>
                <p className="text-xs text-gray-500">CRM System</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl hover:bg-white/50 text-gray-600 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>



          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
            {sidebarSections.map((section) => {
              const isCollapsed = collapsedSections.has(section.title);
              const hasVisibleItems = section.items.some(item => {
                if (item.name === 'Analytics') {
                  return user && user.permissions.some(p => 
                    p.resource === 'analytics' && 
                    (p.actions.includes('read') || p.actions.includes('read_own'))
                  );
                }
                return !item.resource || !item.action || (user && user.permissions.some(p => 
                  p.resource === item.resource && p.actions.includes(item.action!)
                ));
              });

              if (!hasVisibleItems) return null;

              return (
                <div key={section.title} className="space-y-2">
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors duration-200"
                  >
                    <span>{section.title}</span>
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className={`space-y-1 transition-all duration-300 overflow-hidden ${
                    isCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
                  }`}>
                    {section.items.map(renderNavItem)}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>© 2024 CRM System</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};