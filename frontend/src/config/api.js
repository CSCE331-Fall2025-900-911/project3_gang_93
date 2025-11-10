// API Configuration
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
};

