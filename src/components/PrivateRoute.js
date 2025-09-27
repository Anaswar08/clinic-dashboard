import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const PrivateRoute = ({ children, allowedRole }) => {
  const { user, role, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!user) return <Navigate to="/" />;

  if (role !== allowedRole) return <Navigate to="/" />;

  return children;
};

export default PrivateRoute;
