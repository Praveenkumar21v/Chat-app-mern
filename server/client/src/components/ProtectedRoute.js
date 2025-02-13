import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const token = useSelector((state) => state.user.token) || localStorage.getItem('token'); 

  if (!token) {
    return <Navigate to="/email" />;  
  }

  return children;
};

export default ProtectedRoute;
