import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

const ErrorSnackbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'info' | 'error' | 'warning' | 'success'>('error');

  useEffect(() => {
    const handleError = (errorMessage: string) => {
      setMessage(errorMessage);
      setSeverity('error');
      setOpen(true);
    };

    if (window?.electronAPI?.addErrorListener) {
      window.electronAPI.addErrorListener(handleError);
    }

    return () => {
      if (window?.electronAPI?.removeErrorListener) {
        window.electronAPI.removeErrorListener();
      }
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default ErrorSnackbar;