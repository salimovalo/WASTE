import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Employees pages
import EmployeeDashboard from './EmployeeDashboard';
import EmployeeList from './EmployeeList';
import EmployeeTabel from './EmployeeTabel';
import EmployeeShtat from './EmployeeShtat';

const Employees = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/employees/dashboard" replace />} />
      <Route path="/dashboard" element={<EmployeeDashboard />} />
      <Route path="/list" element={<EmployeeList />} />
      <Route path="/tabel" element={<EmployeeTabel />} />
      <Route path="/tabel/:employeeId" element={<EmployeeTabel />} />
      <Route path="/shtat" element={<EmployeeShtat />} />
      <Route path="/schedule" element={<EmployeeDashboard />} /> {/* Placeholder */}
      {/* Qo'shimcha sahifalar */}
    </Routes>
  );
};

export default Employees;