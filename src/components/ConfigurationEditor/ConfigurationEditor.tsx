import React, { useEffect, useState } from 'react';
import { Typography, Box, Button } from '@mui/material';
import Editor from '../Editor';
import { styleConstants } from '../../utils/constants/style/styleConstants';

const ConfigurationEditor: React.FC<{ sidebarOpen: boolean }> = ({ sidebarOpen }) => {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      const config = await window.cosimulationAPI.getConfig();
      if (config?.multiModels) {
        setFilePath(config.multiModels);
        const fileContent = await window.electronAPI.readFile(config.multiModels);
        setContent(fileContent);
      }
      setLoading(false);
    };

    fetchConfig();

    const handleMultiModelPath = async (path: string) => {
      setFilePath(path);
      const fileContent = await window.electronAPI.readFile(path);
      setContent(fileContent);
      setLoading(false);
    };

    window.cosimulationAPI.addMultiModelPathListener(handleMultiModelPath);

    return () => {
      window.cosimulationAPI.removeMultiModelPathListener(handleMultiModelPath);
    };
  }, []);

  const handleSave = async () => {
    if (filePath) {
      try {
        await window.electronAPI.writeFile(filePath, content);
        window.electronAPI.sendNotification('File saved successfully', 'success');
      } catch (error) {
        console.error('Error saving file:', error);
        window.electronAPI.sendNotification('Error saving file', 'error');
      }
    }
  };

  return (
    <Box
    sx={{
      marginLeft: sidebarOpen ? `${styleConstants.DRAWER_WIDTH}px` : `${styleConstants.COLLAPSED_WIDTH}px`,
      padding: 3,
      paddingTop: `${styleConstants.TOOLBAR_HEIGHT}px`,
      paddingBottom: '70px',
      height: '100vh',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      transition: `margin-left ${styleConstants.TRANSITION_DURATION}s ease`,
      overflow: 'hidden',
    }}
  >
    <Typography variant="h4" component="h1" gutterBottom>
      Multi-Model Editor
    </Typography>
  
    <Typography variant="subtitle1" color="primary" gutterBottom>
      {filePath ? filePath.split(/[\\/]/).pop() : 'No file selected'}
    </Typography>
  
    <Box sx={{ flexGrow: 1, mt: 2, border: '1px solid #ccc', borderRadius: 2, overflow: 'hidden', minHeight: 0 }}>
      {!loading && (
        <Editor
          value={content}
          onChange={setContent}
          language="json"
        />
      )}
    </Box>
  
    <Button
      variant="contained"
      color="primary"
      onClick={handleSave}
      sx={{ mt: 2, alignSelf: 'flex-start' }}
    >
      Save
    </Button>
  </Box>
  
  );
};

export default ConfigurationEditor;