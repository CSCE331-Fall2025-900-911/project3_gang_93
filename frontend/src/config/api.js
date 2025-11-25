// API Configuration
// To change the backend URL, edit the .env file in the frontend directory
// Set VITE_API_BASE_URL to your desired backend URL
// Example: VITE_API_BASE_URL=https://your-backend.com
// Default: http://localhost:8000
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  MENU: '/api/menu',
  TRANSACTIONS: '/api/transactions',
  CUSTOMERS: '/api/customers',
  INVENTORY: '/api/inventory',
  SALES: '/api/sales',
  EMPLOYEES: '/api/employees',
  AUTH: '/api/auth',
  MANAGEMENT: '/api/management',
  REPORTS: '/api/reports',
};

