import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ProjectContextType {
  projectPath: string | null;
  setProjectPath: (path: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projectPath, setProjectPath] = useState<string | null>(null);

  useEffect(() => {
    const handleProjectCreated = (path: string) => {
      console.log("[ProjectContext] New project created at:", path);
      setProjectPath(path);
    };

    const handleProjectSelected = (path: string) => {
      console.log("[ProjectContext] Existing project selected:", path);
      setProjectPath(path);
    };

    window.electronAPI?.onProjectCreated(handleProjectCreated);
    window.electronAPI?.onProjectSelected(handleProjectSelected);

    return () => {
    };
  }, []);

  return (
    <ProjectContext.Provider value={{ projectPath, setProjectPath }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};