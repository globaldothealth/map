import ReactGA from 'react-ga4';
import { useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import ErrorAlert from 'src/components/ErrorAlert';
import ErrorFallback from 'src/components/ErrorFallback';
import Loader from 'src/components/Loader';
import PopupSmallScreens from 'src/components/PopupSmallScreens';
import SideBar from 'src/components/SideBar';
import TopBar from 'src/components/TopBar';
import { CountryView } from 'src/containers/CountryView';
import { RegionalView } from 'src/containers/RegionalView';
import { StateView } from 'src/containers/StateView';
import { useCookieBanner } from 'src/hooks/useCookieBanner';
import { selectIsLoading, selectError } from 'src/redux/App/selectors';
import { fetchAppData } from 'src/redux/App/thunks';
import { useAppDispatch, useAppSelector } from 'src/redux/hooks';
import { selectIsCountryViewLoading } from 'src/redux/Country/selectors';
import { selectIsRegionalViewLoading } from 'src/redux/Regional/selectors';
import { selectIsStateViewLoading } from 'src/redux/State/selectors';

import { ErrorContainer } from './styled';

const App = () => {
    const env = import.meta.env.VITE_NODE_ENV;
    const gaTrackingId = import.meta.env.VITE_GA_TRACKING_ID || '';

    useEffect(() => {
        if (env !== 'production' || gaTrackingId === '') return;

        ReactGA.initialize(gaTrackingId);
    }, [env, gaTrackingId]);

    // Init IUBENDA cookie banner
    const { initCookieBanner } = useCookieBanner();

    useEffect(() => {
        initCookieBanner();
    }, []);

    const location = useLocation();
    const dispatch = useAppDispatch();

    const isLoading = useAppSelector(selectIsLoading);
    const isCountryViewLoading = useAppSelector(selectIsCountryViewLoading);
    const isStateViewLoading = useAppSelector(selectIsStateViewLoading);
    const isRegionalViewLoading = useAppSelector(selectIsRegionalViewLoading);
    const error = useAppSelector(selectError);

    useEffect(() => {
        dispatch(fetchAppData());
    }, [dispatch]);

    // Track page views
    useEffect(() => {
        if (env !== 'production') return;

        ReactGA.send({ hitType: 'pageview', page: location.pathname });
    }, [env, location]);

    return (
        <div className="App">
            {(isLoading ||
                isCountryViewLoading ||
                isStateViewLoading ||
                isRegionalViewLoading) && <Loader />}
            <TopBar />
            <PopupSmallScreens />
            <ErrorBoundary
                FallbackComponent={ErrorFallback}
                onReset={() => window.location.reload()}
            >
                <SideBar />
                <Routes>
                    <Route
                        path="/"
                        element={<Navigate replace to="/country" />}
                    />
                    <Route path="/country" element={<CountryView />} />
                    <Route path="/state" element={<StateView />} />
                    <Route path="/region" element={<RegionalView />} />
                </Routes>
                {error && (
                    <ErrorContainer>
                        <ErrorAlert errorMessage={error} />
                    </ErrorContainer>
                )}
            </ErrorBoundary>
        </div>
    );
};

export default App;
