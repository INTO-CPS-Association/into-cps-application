import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

const ErrorSnackbar = () => {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.showError((message: string | Error) => {
        const errorMessage = message instanceof Error ? message.message : message;
        console.log('Received error message in React:', errorMessage);
        setErrorMessage(errorMessage);
        setOpen(true);
      });
    }
  
    return () => {};
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
      <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
        {errorMessage}
      </Alert>
    </Snackbar>
  );
};

export default ErrorSnackbar;
