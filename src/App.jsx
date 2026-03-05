import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import MasterData from './pages/MasterData';
import Stock from './pages/Stock';
import Billing from './pages/Billing';
import Orders from './pages/Orders';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SettingsProvider } from './contexts/SettingsContext';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <SettingsProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Main Application Routes guarded by Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="user-management" element={<UserManagement />} />
              <Route path="master-data" element={<MasterData />} />
              <Route path="stock" element={<Stock />} />
              <Route path="billing" element={<Billing />} />

              {/* Placeholders for other routes */}
              <Route path="orders" element={<Orders />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="reports" element={<div className="p-8"><h1 className="text-2xl font-bold">Reports</h1></div>} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </SettingsProvider>
  )
}

export default App
