import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/global.css';
import App from './App';
import { AppProvider } from './store/AppStore';
import { MusicProvider } from './audio/MusicProvider';
import { trackInstallIfStandalone } from './analytics';

// If the app is opened from the home screen, an install happened — fire once.
trackInstallIfStandalone();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <MusicProvider>
          <App />
        </MusicProvider>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);
