import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import FamilyView from './pages/FamilyView';
import TreeView from './pages/TreeView';
import MemberProfile from './pages/MemberProfile';
import FamilyHistory from './pages/FamilyHistory';
import './style.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/signin" replace />;
    }

    return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route
                            path="/signin"
                            element={
                                <PublicRoute>
                                    <SignIn />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/signup"
                            element={
                                <PublicRoute>
                                    <SignUp />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/family/:familyId"
                            element={
                                <ProtectedRoute>
                                    <FamilyView />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/family/:familyId/tree"
                            element={
                                <ProtectedRoute>
                                    <TreeView />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/family/:familyId/member/:memberId"
                            element={
                                <ProtectedRoute>
                                    <MemberProfile />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/family/:familyId/history"
                            element={
                                <ProtectedRoute>
                                    <FamilyHistory />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </Router>
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;
