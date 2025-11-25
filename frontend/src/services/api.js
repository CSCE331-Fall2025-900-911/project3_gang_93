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
      const errorData = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      
      // Handle FastAPI validation errors (422) - detail is an array
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          // Format validation errors nicely
          const errorMessages = errorData.detail.map(err => 
            `${err.loc?.join('.') || 'field'}: ${err.msg || err}`
          ).join(', ');
          throw new Error(errorMessages || `Validation error: ${response.status}`);
        } else {
          throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
      }
      
      // Handle other error formats
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
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

    // Include tip if provided
    if (transactionData.tip !== null && transactionData.tip !== undefined) {
      payload.tip = transactionData.tip;
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
 * Inventory API
 */
export const inventoryAPI = {
  getAll: async () => {
    return await apiRequest(API_ENDPOINTS.INVENTORY);
  },
  getById: async (id) => {
    return await apiRequest(`${API_ENDPOINTS.INVENTORY}/${id}`);
  },
  update: async (id, quantity, reason = null) => {
    // Ensure quantity is a valid number
    const quantityValue = typeof quantity === 'number' ? quantity : parseFloat(quantity);
    
    if (isNaN(quantityValue) || quantityValue < 0) {
      throw new Error("Invalid quantity value. Must be a non-negative number.");
    }
    
    const payload = { 
      quantity: quantityValue,
    };
    
    // Only include reason if it's provided and not empty
    if (reason !== null && reason !== undefined && reason.trim() !== '') {
      payload.reason = reason;
    }
    
    return await apiRequest(`${API_ENDPOINTS.INVENTORY}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  getLowStock: async (threshold = 10) => {
    return await apiRequest(
      `${API_ENDPOINTS.INVENTORY}/low-stock?threshold=${threshold}`
    );
  },
};

/**
 * Sales API
 */
export const salesAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.date) params.append("date", filters.date);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.itemName) params.append("itemName", filters.itemName);
    if (filters.limit) params.append("limit", filters.limit);

    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.SALES}?${queryString}`
      : API_ENDPOINTS.SALES;
    return await apiRequest(endpoint);
  },
  getSummary: async (startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.SALES}/summary?${queryString}`
      : `${API_ENDPOINTS.SALES}/summary`;
    return await apiRequest(endpoint);
  },
};

/**
 * Reports API
 */
export const reportsAPI = {
  getXReport: async (reportDate = null) => {
    const endpoint = reportDate
      ? `${API_ENDPOINTS.REPORTS}/x-report?report_date=${reportDate}`
      : `${API_ENDPOINTS.REPORTS}/x-report`;
    return await apiRequest(endpoint);
  },
  getZReport: async (reportDate = null) => {
    const endpoint = reportDate
      ? `${API_ENDPOINTS.REPORTS}/z-report?report_date=${reportDate}`
      : `${API_ENDPOINTS.REPORTS}/z-report`;
    return await apiRequest(endpoint);
  },
  getProductUsage: async (startDate, endDate) => {
    return await apiRequest(
      `${API_ENDPOINTS.REPORTS}/product-usage?start_date=${startDate}&end_date=${endDate}`
    );
  },
};

/**
 * Management API
 */
export const managementAPI = {
  getDashboard: async () => {
    return await apiRequest(`${API_ENDPOINTS.MANAGEMENT}/dashboard`);
  },
};

/**
 * Employee API
 */
export const employeeAPI = {
  getAll: async () => {
    return await apiRequest(API_ENDPOINTS.EMPLOYEES);
  },
  getById: async (id) => {
    return await apiRequest(`${API_ENDPOINTS.EMPLOYEES}/${id}`);
  },
};

/**
 * Customer API - Extended
 */
export const customerAPIExtended = {
  ...customerAPI,
  create: async (customerData) => {
    return await apiRequest(API_ENDPOINTS.CUSTOMERS, {
      method: "POST",
      body: JSON.stringify(customerData),
    });
  },
  updatePoints: async (id, points, reason = null) => {
    return await apiRequest(`${API_ENDPOINTS.CUSTOMERS}/${id}/points`, {
      method: "PUT",
      body: JSON.stringify({ points, reason }),
    });
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
  customerAPI: customerAPIExtended,
  inventoryAPI,
  salesAPI,
  reportsAPI,
  managementAPI,
  employeeAPI,
  testConnection,
};
