import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Sahifalarni import qilish
import Vehicles from './Vehicles';
import Dashboard from './Dashboard';
import Fuel from './Fuel';
import DailyWorkStatus from './DailyWorkStatus';
import DailyWorkStatusEntry from './DailyWorkStatusEntry';
import DailyWorkStatusStatistics from './DailyWorkStatusStatistics';
import WorkStatusReasons from './WorkStatusReasons';

const VehiclesRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/vehicles/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/list" element={<Vehicles />} />
      <Route path="/daily-work-status" element={<DailyWorkStatus />} />
      <Route path="/fuel" element={<Fuel />} />
      <Route path="/report-206" element={
        <div style={{ padding: 24, background: 'white', borderRadius: 8, margin: 24 }}>
          <h2>206 Xisoboti</h2>
          <p>Bu sahifa hali ishlab chiqilmoqda...</p>
        </div>
      } />
      <Route path="/data-entry" element={
        <div style={{ padding: 24, background: 'white', borderRadius: 8, margin: 24 }}>
          <h2>Ma'lumotlar kiritish</h2>
          <p>Bu sahifa hali ishlab chiqilmoqda...</p>
        </div>
      } />
      <Route path="/historical" element={
        <div style={{ padding: 24, background: 'white', borderRadius: 8, margin: 24 }}>
          <h2>Tarixiy ma'lumotlar</h2>
          <p>Bu sahifa hali ishlab chiqilmoqda...</p>
        </div>
      } />
      <Route path="*" element={<Navigate to="/vehicles/dashboard" replace />} />
    </Routes>
  );
};

export default VehiclesRouter;
