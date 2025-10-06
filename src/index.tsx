import React from 'react';
import App from './App';
import { HashRouter as Router } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('app')!);

root.render(
    <React.StrictMode>
        <Router>
            <App />
        </Router>
    </React.StrictMode>
);