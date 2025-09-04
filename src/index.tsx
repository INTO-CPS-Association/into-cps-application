import React from 'react';
import App from './App';
import { HashRouter as Router } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
const container = document.getElementById('app');
const root = createRoot(container!);

root.render(
    <React.StrictMode>
        <Router>
            <App />
        </Router>
    </React.StrictMode>
);