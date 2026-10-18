import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { routes } from './routes';
import ChatBot from './Components/ChatBot/ChatBot';

import { Provider } from './store/Provider';

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Provider>
            <Router>
                <ScrollToTop />
                <Routes>
                    {routes.map((route, index) => (
                        <Route key={index} path={route.path} element={route.component} />
                    ))}
                </Routes>
                <ChatBot />
            </Router>
        </Provider>
    </StrictMode>,
);

