import React from 'react';
import { Typography, List, ListItem, Box } from '@mui/material';

export const renderJson = (data: any): JSX.Element | null => {
  if (data === null || data === undefined) {
    return (
      <Typography variant="body2" color="textSecondary">
        Null or undefined
      </Typography>
    );
  }

  if (typeof data === 'object' && !Array.isArray(data)) {
    return (
      <List disablePadding>
        {Object.entries(data).map(([key, value]) => (
          <ListItem key={key} sx={{ display: 'block', paddingLeft: 2 }}>
            <Typography variant="subtitle2" component="div">
              {key}:
            </Typography>
            <Box sx={{ paddingLeft: 2 }}>
              {typeof value === 'object' ? renderJson(value) : (
                <Typography variant="body2">{String(value)}</Typography>
              )}
            </Box>
          </ListItem>
        ))}
      </List>
    );
  }

  if (Array.isArray(data)) {
    return (
      <List disablePadding>
        {data.map((item, index) => (
          <ListItem key={index} sx={{ display: 'block', paddingLeft: 2 }}>
            {renderJson(item)}
          </ListItem>
        ))}
      </List>
    );
  }

  return (
    <Typography variant="body2" component="span">
      {String(data)}
    </Typography>
  );
};
