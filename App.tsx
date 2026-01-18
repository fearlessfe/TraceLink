
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProjectsList } from './components/ProjectsList';
import { ProjectDetail } from './components/ProjectDetail';
import { NewProjectModal } from './components/NewProjectModal';
import { ViewType, Project } from './types';
import { MOCK_PROJECTS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('overview');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);

  const handleCreateProject = (newProject: Omit<Project, 'id' | 'status' | 'progress' | 'lastUpdated'>) => {
    // New project created with progress 0 and status active
    // Document and source data is managed locally in ProjectDetail based on ID
    const project: Project = {
      ...newProject,
      id: Math.random().toString(36).substr(2, 9),
      status: 'active',
      progress: 0,
      lastUpdated: 'Just now',
    };
    setProjects(prev => [project, ...prev]);
    setIsModalOpen(false);
    setCurrentView('projects');
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setCurrentView('project-detail');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'overview':
        return (
          <Dashboard 
            onViewProjects={() => setCurrentView('projects')} 
            onCreateProject={() => setIsModalOpen(true)}
          />
        );
      case 'projects':
        return (
          <ProjectsList 
            projects={projects} 
            onCreateProject={() => setIsModalOpen(true)}
            onSelectProject={handleSelectProject}
          />
        );
      case 'project-detail':
        return selectedProject ? (
          <ProjectDetail 
            project={selectedProject} 
            onBack={() => setCurrentView('projects')} 
          />
        ) : (
          <Dashboard 
            onViewProjects={() => setCurrentView('projects')} 
            onCreateProject={() => setIsModalOpen(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderContent()}
      
      {isModalOpen && (
        <NewProjectModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleCreateProject}
        />
      )}
    </Layout>
  );
};

export default App;
