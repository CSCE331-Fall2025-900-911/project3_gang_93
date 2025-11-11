// API Service for backend communication
import { API_BASE_URL, API_ENDPOINTS } from "../config/api";
import { getMenuIcon } from "../utils/menuIcons";

/**
 * Generic API request handler
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

/**
 * Menu API
 */
export const menuAPI = {
  // Get all menu items
  getAll: async () => {
    const data = await apiRequest(API_ENDPOINTS.MENU);
    // Transform backend response to frontend format
    return data.menuItems.map((item) => ({
      id: item.menuItemId,
      menuItemId: item.menuItemId,
      name: item.menuItemName,
      price: parseFloat(item.price),
      ingredients: item.ingredients,
      icon: getMenuIcon(item.menuItemName),
    }));
  },

  // Get single menu item
  getById: async (id) => {
    const data = await apiRequest(`${API_ENDPOINTS.MENU}/${id}`);
    return {
      id: data.menuItemId,
      menuItemId: data.menuItemId,
      name: data.menuItemName,
      price: parseFloat(data.price),
      ingredients: data.ingredients,
      icon: getMenuIcon(data.menuItemName),
    };
  },
};

/**
 * Transaction API
 */
export const transactionAPI = {
  // Create a new transaction
  create: async (transactionData) => {
    // Transform frontend cart to backend format
    // transactionData.items is an object with item IDs as keys
    const items = Object.values(transactionData.items || {}).map((item) => ({
      menuItemId: item.menuItemId || item.id,
      quantity: item.quantity || 1,
    }));

    // Build payload - backend will automatically set date/time to current values
    const payload = {
      items: items,
      transactionType: transactionData.transactionType || "card",
    };

    // Only include customerId if provided (not null/undefined)
    if (
      transactionData.customerId !== null &&
      transactionData.customerId !== undefined
    ) {
      payload.customerId = transactionData.customerId;
    }

    // Note: We don't send date/time - backend will use current date/time automatically

    return await apiRequest(API_ENDPOINTS.TRANSACTIONS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Get all transactions
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.date) params.append("date", filters.date);
    if (filters.customerId) params.append("customerId", filters.customerId);
    if (filters.limit) params.append("limit", filters.limit);
    if (filters.offset) params.append("offset", filters.offset);

    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.TRANSACTIONS}?${queryString}`
      : API_ENDPOINTS.TRANSACTIONS;

    return await apiRequest(endpoint);
  },

  // Get single transaction
  getById: async (id) => {
    return await apiRequest(`${API_ENDPOINTS.TRANSACTIONS}/${id}`);
  },
};

/**
 * Customer API
 */
export const customerAPI = {
  // Get all customers or search
  getAll: async (search = null) => {
    const endpoint = search
      ? `${API_ENDPOINTS.CUSTOMERS}?search=${encodeURIComponent(search)}`
      : API_ENDPOINTS.CUSTOMERS;
    return await apiRequest(endpoint);
  },

  // Get customer by ID
  getById: async (id) => {
    return await apiRequest(`${API_ENDPOINTS.CUSTOMERS}/${id}`);
  },

  // Get customer rewards
  getRewards: async (id) => {
    return await apiRequest(`${API_ENDPOINTS.CUSTOMERS}/${id}/rewards`);
  },
};

/**
 * Test API connection
 */
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    return await response.json();
  } catch (error) {
    console.error("Backend connection failed:", error);
    return null;
  }
};

export default {
  menuAPI,
  transactionAPI,
  customerAPI,
  testConnection,
};
