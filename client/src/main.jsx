import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MediaProvider } from './contexts/MediaContext';
import './index.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <BrowserRouter>
      <ThemeProvider>
        <MediaProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '16px',
                padding: '16px',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              },
            }}
          />
        </AuthProvider>
        </MediaProvider>
      </ThemeProvider>
    </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
