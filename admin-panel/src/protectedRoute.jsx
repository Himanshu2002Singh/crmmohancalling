import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  // Check for any valid login token (admin, superadmin, or employee)
  const adminToken = localStorage.getItem("adminToken");
  const superadminToken = localStorage.getItem("superadminToken");
  const employeeToken = localStorage.getItem("employeeToken");
  
  const isLogin = adminToken || superadminToken || employeeToken;

  if (!isLogin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
