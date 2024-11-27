import React, { useEffect, useState } from 'react';
import { Typography, Skeleton, Box } from '@mui/material';
import { renderJson } from '../../utils/renderJson';

const Cosimulation: React.FC = () => {
  const filePath = 'cosimulation/2018may7/coe.json';
  const [jsonData, setJsonData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJson = async () => {
      try {
        console.log('window.electronAPI:', window?.electronAPI);
        console.log('readJsonFile exists:', typeof window?.electronAPI?.readJsonFile === 'function');
  
        console.log('Fetching JSON from:', filePath);
        const data = await window?.electronAPI?.readJsonFile(filePath); // Dovrebbe ora ricevere i dati
        console.log('Data fetched:', data); // Dovrebbe loggare il JSON correttamente
        setJsonData(data);
      } catch (err) {
        console.error('Error fetching JSON:', err);
        setError('Failed to load JSON file.');
      }
    };
  
    fetchJson();
  }, []);
  

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Cosimulation
      </Typography>
      <Typography variant="h6" component="h6" gutterBottom>
        {filePath}
      </Typography>
      {error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : jsonData ? (
        renderJson(jsonData)
      ) : (
        <Skeleton animation="wave" />
      )}
    </Box>
  );  
};

export default Cosimulation;