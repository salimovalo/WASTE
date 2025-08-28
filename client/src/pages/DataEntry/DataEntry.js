import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Data Entry sahifalarini import qilish
import TripSheetTable from '../Vehicles/TripSheetTable';
import TripSheetFormPage from '../Vehicles/TripSheetFormPage';
import TripSheetView from '../Vehicles/TripSheetView';
import VehicleMonthlyCard from '../Vehicles/VehicleMonthlyCard';

const DataEntry = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/data-entry/206-report" replace />} />
      <Route path="/206-report" element={<TripSheetTable />} />
      <Route path="/trip-sheet-form" element={<TripSheetFormPage />} />
      <Route path="/trip-sheet-view/:id" element={<TripSheetView />} />
      <Route path="/vehicle-card/:vehicleId" element={<VehicleMonthlyCard />} />
    </Routes>
  );
};

export default DataEntry;
