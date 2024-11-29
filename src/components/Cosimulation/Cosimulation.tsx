import React, { useEffect, useState } from 'react';
import { Typography, Skeleton, Box } from '@mui/material';
import { renderJson } from '../../utils/renderJson';

const Cosimulation: React.FC = () => {
  const filePath = 'cosimulation/2018may7/coe.json';
  const [jsonData, setJsonData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<string>('Idle');

  useEffect(() => {
    const fetchJson = async () => {
      try {
        console.log('Fetching JSON from:', filePath);
        const data = await window?.electronAPI?.readJsonFile(filePath);
        console.log('Data fetched:', data);
        setJsonData(data);
      } catch (err) {
        console.error('Error fetching JSON:', err);
        setError('Failed to load JSON file.');
      }
    };

    fetchJson();
  }, []);

  useEffect(() => {
    const handleSimulationStatusUpdate = (event: any, status: string) => {
      console.log('Simulation status updated:', status);
      setSimulationStatus(status);
    };
  
    window?.electronAPI?.onSimulationStatus(handleSimulationStatusUpdate);
  
    return () => {
      window?.electronAPI?.removeSimulationStatusListener(handleSimulationStatusUpdate);
    };
  }, []);  

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Cosimulation
      </Typography>
      <Typography variant="h6" component="h6" gutterBottom>
        {filePath}
      </Typography>
      <Typography variant="subtitle1" color="primary">
        Simulation Status: {simulationStatus}
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
