import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

Amplify.configure(outputs, {
    API: {
        REST: {
            headers: async () => ({}),
        },
    },
});

// Ensure guest credentials are available
import { fetchAuthSession } from 'aws-amplify/auth';
fetchAuthSession().catch(console.error);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from 'src/containers/App';
import { GlobalStyle } from 'src/theme/globalStyles';
import { store } from 'src/redux/store';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import {ThemeProvider} from '@mui/material/styles';
import { theme } from 'src/theme/theme';
import 'maplibre-gl/dist/maplibre-gl.css';

// Prevent browser page zoom (trackpad pinch / Ctrl+scroll) while allowing
// the map to handle its own zoom via its internal event listeners.
document.addEventListener(
    'wheel',
    (e) => {
        if (e.ctrlKey) e.preventDefault();
    },
    { passive: false },
);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <Router>
                    <GlobalStyle />
                    <App />
                </Router>
            </ThemeProvider>
        </Provider>
    </StrictMode>,
);
