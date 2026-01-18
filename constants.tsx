
import React from 'react';
import { LayoutDashboard, FolderKanban, Settings, HelpCircle, Clock, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export const DISTRIBUTION_DATA = [
  { name: 'Req', count: 120 },
  { name: 'Design', count: 95 },
  { name: 'Code', count: 82 },
  { name: 'Test', count: 110 },
];

export const COVERAGE_DATA = [
  { name: 'W2', coverage: 65 },
  { name: 'W3', coverage: 72 },
  { name: 'W4', coverage: 78 },
  { name: 'W5', coverage: 82 },
];

export const MOCK_PROJECTS = [
  {
    id: '1',
    name: 'Apollo Guidance',
    description: 'System for navigation and control of the Apollo spacecraft.',
    type: 'Traceability Project' as const,
    members: ['Alice', 'Bob'],
    status: 'active' as const,
    progress: 78,
    lastUpdated: '2 hours ago'
  },
  {
    id: '2',
    name: 'Mars Rover OS',
    description: 'Real-time operating system for autonomous planetary exploration.',
    type: 'Knowledge Base' as const,
    members: ['Charlie', 'Dave'],
    status: 'active' as const,
    progress: 45,
    lastUpdated: '5 hours ago'
  }
];
