import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import type { NotificationType } from '../types/global';

const ErrorSnackbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<NotificationType>('info');

  useEffect(() => {
    const handleError = (msg: string) => {
      setMessage(msg);
      setSeverity('error');
      setOpen(true);
    };

    const handleNotification = (msg: string, type: NotificationType) => {
      setMessage(msg);
      setSeverity(type);
      setOpen(true);
    };

    if (window?.electronAPI?.addErrorListener) {
      window.electronAPI.addErrorListener(handleError);
    }
    if (window?.electronAPI?.addNotificationListener) {
      window.electronAPI.addNotificationListener(handleNotification);
    } 

    return () => {
      if (window?.electronAPI?.removeErrorListener) {
        window.electronAPI.removeErrorListener();
      }
      if (window?.electronAPI?.removeNotificationListener) {
        window.electronAPI.removeNotificationListener();
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
