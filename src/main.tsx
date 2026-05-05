import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import App from 'src/containers/App';
import reportWebVitals from 'src/reportWebVitals';
import { GlobalStyle } from 'src/theme/globalStyles';
import { store } from 'src/redux/store';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import {ThemeProvider} from '@mui/material/styles';
import { theme } from 'src/theme/theme';
import 'maplibre-gl/dist/maplibre-gl.css';

Amplify.configure(outputs);

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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
