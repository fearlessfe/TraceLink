
// Import React to provide the React namespace for ReactNode
import React from 'react';

export type ProjectType = 'Knowledge Base' | 'Traceability Project';

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  members: string[];
  status: 'active' | 'archived';
  progress: number;
  lastUpdated: string;
}

export interface StatCardData {
  title: string;
  value: string | number;
  subtextText?: string;
  subtextValue?: string;
  icon: React.ReactNode;
  color: string;
}

export type ViewType = 'overview' | 'projects' | 'project-detail';

export type DataSourceType = 'LOCAL' | 'GIT' | 'JIRA';

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  status: 'Synced' | 'Syncing' | 'Error';
  lastUpdated: string;
}

export type DocStatus = 'ACTIVE' | 'PARSING' | 'PARSED' | 'PARSED_CONFIRMED' | 'STRUCTURING' | 'STRUCTURED';

export interface ManagedDocument {
  id: string;
  name: string;
  source: string;
  type: string;
  status: DocStatus;
  lastModified: string;
}

export interface DocChunk {
  id: string;
  type: string;
  content: string;
  confidence: number;
}

export interface StructuredNode {
  id: string;
  type: 'Requirement' | 'TestCase' | 'DesignElement';
  title: string;
  description: string;
  sourceId: string; // References a DocChunk id
  docId: string; // References the document
}
