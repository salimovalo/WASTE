import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ConfigProvider, App as AntdApp } from 'antd';
import uzUZ from './locales/uz_UZ';
import 'antd/dist/reset.css';
import moment from 'moment';
import 'moment/locale/uz-latn';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout/Layout';
import PermissionGuard from './components/PermissionGuard/PermissionGuard';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Companies from './pages/SuperAdmin/Companies';
import Districts from './pages/SuperAdmin/Districts';
import Neighborhoods from './pages/SuperAdmin/Neighborhoods';
import Users from './pages/SuperAdmin/Users';
import PhysicalPersons from './pages/PhysicalPersons/PhysicalPersons';
import LegalEntities from './pages/LegalEntities/LegalEntities';
import VehiclesRouter from './pages/Vehicles/VehiclesRouter';
import DataEntry from './pages/DataEntry/DataEntry';
import ServiceQuality from './pages/ServiceQuality/ServiceQuality';
import Employees from './pages/Employees/Employees';
import FuelStations from './pages/FuelStations/FuelStations';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';

// Global moment.js locale sozlamalari
// Avval locale yaratish, keyin o'rnatish
if (!moment.locales().includes('uz-latn')) {
  moment.defineLocale('uz-latn', {
    months: [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ],
    monthsShort: [
      'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun',
      'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'
    ],
    weekdays: [
      'Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'
    ],
    weekdaysShort: ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'],
    weekdaysMin: ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'],
    week: {
      dow: 1, // Monday is the first day of the week
      doy: 4  // The week that contains Jan 4th is the first week of the year
    }
  });
}
moment.locale('uz-latn');

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 daqiqa
    },
  },
});

// Antd theme configuration
const theme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 6,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#001529',
      siderBg: '#001529',
    },
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17',
    },
  },
};

// Protected Route komponenti
const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route komponenti (faqat login qilmagan foydalanuvchilar uchun)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme} locale={uzUZ}>
        <AntdApp>
          <Router 
            future={{ 
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <div className="App">
            <Routes>
              {/* Public routes */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              
              {/* Protected routes */}
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        {/* Dashboard */}
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        
                        {/* Super Admin moduli */}
                        <Route path="/admin/companies" element={<Companies />} />
                        <Route path="/admin/districts" element={<Districts />} />
                        <Route path="/admin/neighborhoods" element={<Neighborhoods />} />
                        <Route path="/admin/users" element={<Users />} />
                        
                        {/* Asosiy modullar */}
                        <Route path="/physical-persons/*" element={<PhysicalPersons />} />
                        <Route path="/legal-entities/*" element={<LegalEntities />} />
                        <Route path="/vehicles/*" element={
                          <PermissionGuard permission="view_vehicles">
                            <VehiclesRouter />
                          </PermissionGuard>
                        } />
                        <Route path="/data-entry/*" element={<DataEntry />} />
                        <Route path="/service-quality/*" element={<ServiceQuality />} />
                        <Route path="/employees/*" element={<Employees />} />
                        <Route path="/fuel-stations/*" element={
                          <PermissionGuard permission="view_fuel_stations">
                            <FuelStations />
                          </PermissionGuard>
                        } />
                        <Route path="/reports/*" element={<Reports />} />
                        <Route path="/settings/*" element={<Settings />} />
                        
                        {/* 404 page */}
                        <Route path="*" element={
                          <div style={{ 
                            padding: '50px', 
                            textAlign: 'center',
                            fontSize: '18px' 
                          }}>
                            Sahifa topilmadi - 404
                          </div>
                        } />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
            </Routes>
            </div>
          </Router>
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
