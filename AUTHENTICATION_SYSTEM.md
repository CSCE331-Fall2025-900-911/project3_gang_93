# Authentication & Session Management System

## Overview

This document explains how user authentication and session tracking currently works in the POS system, covering both customer (kiosk) users and employee (cashier/manager) users.

---

## Current Implementation

### 1. Kiosk Users (Customers) - Google OAuth

**Status:** ✅ Fully Implemented

#### How It Works

1. **Login Flow**
   - User clicks "Sign in with Google" in kiosk mode
   - Frontend redirects to: `GET /api/auth/google/login`
   - Backend redirects to Google OAuth consent screen
   - User authenticates with Google
   - Google redirects to: `GET /api/auth/google/callback?code=...`
   - Backend exchanges code for ID token, verifies it
   - Backend redirects to frontend with user info in URL params:
     ```
     http://localhost:5173?email=user@example.com&name=John+Doe&picture=...&sub=google_id
     ```

2. **Session Storage**
   - **Location:** `localStorage` with key `"kiosk_user"`
   - **Files:**
     - `frontend/src/components/KioskLoginPage.jsx` (lines 38-39, 49-56)
     - `frontend/src/App.jsx` (lines 45-53)
   - **Data Structure:**
     ```javascript
     {
       email: "user@example.com",
       name: "John Doe",
       picture: "https://...",
       sub: "google_user_id_123",
       firstName: "John",
       lastName: "Doe"
     }
     ```

3. **Session Persistence**
   - On app mount, checks `localStorage.getItem("kiosk_user")`
   - If found, automatically logs user in
   - Survives page refreshes and browser restarts
   - User stays logged in until they explicitly log out or clear localStorage

4. **Backend API**
   - **Login:** `GET /api/auth/google/login`
   - **Callback:** `GET /api/auth/google/callback`
   - **Environment Variables Required:**
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`
     - `GOOGLE_REDIRECT_URI`
     - `ALLOWED_GOOGLE_USERS` (optional email allowlist)

---

### 2. Employee Users (Cashiers & Managers)

**Status:** ⚠️ Partially Implemented (Backend only)

#### Backend Implementation

1. **Login Endpoint**
   - **Route:** `POST /api/auth/login`
   - **Request:**
     ```json
     {
       "employeeId": 123,
       "password": null  // Optional, currently not validated
     }
     ```
   - **Response:**
     ```json
     {
       "employeeId": 123,
       "firstName": "Jane",
       "lastName": "Smith",
       "authLevel": "Manager",
       "token": null  // Not implemented
     }
     ```
   - **Authentication:** Only checks if employeeId exists in database
   - **File:** `backend/app.py` (lines 995-1022)

2. **Logout Endpoint**
   - **Route:** `POST /api/auth/logout`
   - **Response:** `{"message": "Logged out successfully"}`
   - **Note:** No actual session cleanup since no sessions exist

3. **Authorization System (NEW)**
   - **Helper Function:** `verify_manager_auth()` in `backend/app.py` (lines 42-94)
   - **Required Headers:**
     - `X-Employee-Id`: Employee ID number
     - `X-Auth-Level`: "Manager" or "Barista"
   - **Validation:**
     - Checks headers are present
     - Verifies employee exists in database
     - Confirms authLevel matches header
     - Ensures user is a Manager for protected endpoints
   - **Protected Endpoints:**
     - `POST /api/menu` - Create menu item
     - `PUT /api/menu/{id}` - Update menu item
     - `DELETE /api/menu/{id}` - Delete menu item

#### Frontend Implementation

**Status:** ❌ Not Implemented

- **NO session storage** for employee users
- **NO React context** for current user
- **NO auth headers** sent with API requests
- Employee login returns data but it's not stored anywhere
- Manager view exists but has no way to authenticate API requests

---

## The Gap: What's Missing

### Problem

The backend now requires authentication headers for menu management:
```
X-Employee-Id: 123
X-Auth-Level: Manager
```

But the frontend has **no mechanism** to:
1. Store employee login information
2. Track which employee is currently logged in
3. Attach auth headers to API requests

### Impact

- ✅ Employees can theoretically "log in" via the backend API
- ❌ Frontend doesn't remember who's logged in
- ❌ Manager view cannot create/update/delete menu items
- ❌ No way to enforce manager-only features in UI

---

## What Needs to Be Implemented

### Phase 1: Employee Session Storage

#### 1.1 Store Employee Session
**File:** `frontend/src/services/api.js` or new auth service

```javascript
// After successful login
export const loginEmployee = async (employeeId) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId })
  });
  
  const data = await response.json();
  
  // Store in localStorage
  localStorage.setItem('employee_user', JSON.stringify(data));
  
  return data;
};

// Retrieve current employee
export const getCurrentEmployee = () => {
  const stored = localStorage.getItem('employee_user');
  return stored ? JSON.parse(stored) : null;
};

// Logout
export const logoutEmployee = () => {
  localStorage.removeItem('employee_user');
};
```

#### 1.2 Update API Service to Include Auth Headers
**File:** `frontend/src/services/api.js`

Modify the `apiRequest` function:

```javascript
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get current employee session
  const employee = getCurrentEmployee();
  
  const config = {
    headers: {
      "Content-Type": "application/json",
      // Add auth headers if employee is logged in
      ...(employee && {
        "X-Employee-Id": employee.employeeId.toString(),
        "X-Auth-Level": employee.authLevel
      }),
      ...options.headers,
    },
    ...options,
  };

  // ... rest of function
}
```

### Phase 2: Employee Login UI

#### 2.1 Create Employee Login Component
**New File:** `frontend/src/components/EmployeeLogin.jsx`

- Input field for employee ID
- Login button
- Error handling
- Store employee info on success

#### 2.2 Update App.jsx
- Track employee login state
- Show login prompt if not logged in
- Pass employee info to components that need it

#### 2.3 Update Header Component
- Display current employee name
- Show auth level (Manager/Barista)
- Functional logout button

### Phase 3: Protected Features

#### 3.1 Conditional Rendering
- Show/hide manager-only features based on authLevel
- Display appropriate error messages for unauthorized actions

#### 3.2 Manager View Updates
- Enable menu CRUD operations
- Handle 401/403 errors gracefully
- Show success/error notifications

---

## Technical Details

### Storage Comparison

| Aspect | Kiosk Users | Employee Users (Current) | Employee Users (Needed) |
|--------|-------------|--------------------------|-------------------------|
| Storage Method | localStorage | ❌ None | localStorage |
| Storage Key | `"kiosk_user"` | N/A | `"employee_user"` |
| Auth Method | Google OAuth | Employee ID only | Employee ID + Headers |
| Session Persistence | ✅ Yes | ❌ No | ✅ Yes |
| Auto-login on Refresh | ✅ Yes | ❌ No | ✅ Yes |
| Token/Session | Google sub | ❌ None | Headers (not JWT) |

### Security Notes

#### Current Security Model
- **Kiosk (Google OAuth):** ✅ Secure - Uses OAuth 2.0 with ID token verification
- **Employee Login:** ⚠️ Insecure - No password validation, trust-based
- **Authorization:** ⚠️ Basic - Headers can be spoofed by client

#### Limitations
1. **No JWT tokens** - Can't verify session server-side
2. **No password validation** - Employee login accepts any valid employee ID
3. **Client-side auth headers** - Frontend sends headers that backend trusts without verification
4. **No session expiration** - Users stay logged in indefinitely
5. **No refresh tokens** - Manual re-login required if session lost

#### Recommended Improvements (Future)
1. Implement JWT token-based authentication
2. Add password validation for employee login
3. Server-side session management
4. Token expiration and refresh
5. HTTPS enforcement in production
6. Rate limiting on auth endpoints

---

## API Endpoints Summary

### Authentication Endpoints

| Endpoint | Method | Purpose | Auth Required | Status |
|----------|--------|---------|---------------|--------|
| `/api/auth/google/login` | GET | Initiate Google OAuth | No | ✅ Working |
| `/api/auth/google/callback` | GET | Handle OAuth callback | No | ✅ Working |
| `/api/auth/login` | POST | Employee login | No | ✅ Working |
| `/api/auth/logout` | POST | Logout | No | ✅ Working |

### Protected Endpoints (Require Headers)

| Endpoint | Method | Purpose | Auth Required | Frontend Support |
|----------|--------|---------|---------------|------------------|
| `POST /api/menu` | POST | Create menu item | Manager | ❌ No headers sent |
| `PUT /api/menu/{id}` | PUT | Update menu item | Manager | ❌ No headers sent |
| `DELETE /api/menu/{id}` | DELETE | Delete menu item | Manager | ❌ No headers sent |

---

## Environment Variables

### Backend (.env)

```bash
# Database
DB_NAME=gang_93_db
DB_USER=gang_93
DB_PASSWORD=your_password
DB_HOST=csce-315-db.engr.tamu.edu
DB_PORT=5432

# Google OAuth (for kiosk users)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/google/callback
ALLOWED_GOOGLE_USERS="email1@gmail.com,email2@gmail.com"

# CORS
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
```

### Frontend (.env)

```bash
VITE_API_BASE_URL=http://localhost:8000
```

---

## Testing

### Test Kiosk Login (Works)
1. Navigate to http://localhost:5173
2. Switch to Kiosk Mode
3. Click "Sign in with Google"
4. Authenticate with Google
5. Verify user info is stored in localStorage
6. Refresh page - should stay logged in

### Test Employee Login (Backend Only)
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"employeeId": 1}'
```

### Test Menu Management (Requires Headers)
```bash
# This will work
curl -X POST http://localhost:8000/api/menu \
  -H "Content-Type: application/json" \
  -H "X-Employee-Id: 1" \
  -H "X-Auth-Level: Manager" \
  -d '{
    "menuItemName": "Test Drink",
    "price": 5.99,
    "ingredients": [],
    "isSeasonal": false
  }'

# This will fail (no headers)
curl -X POST http://localhost:8000/api/menu \
  -H "Content-Type: application/json" \
  -d '{...}'
# Response: 401 Unauthorized
```

---

## Next Steps

1. ✅ **Document current system** (this file)
2. ⏳ **Implement employee session storage** in frontend
3. ⏳ **Update API service** to send auth headers
4. ⏳ **Create employee login UI**
5. ⏳ **Test menu management** with proper authentication
6. ⏳ **Add conditional rendering** for manager-only features
7. 🔮 **Future:** Upgrade to JWT-based authentication

---

## Files Reference

### Backend
- `backend/app.py` (lines 42-94) - `verify_manager_auth()` helper
- `backend/app.py` (lines 995-1022) - Employee login endpoint
- `backend/app.py` (lines 1082-1158) - Google OAuth endpoints
- `backend/models.py` (lines 160-169) - Auth models

### Frontend
- `frontend/src/App.jsx` (lines 29-54) - Kiosk session restore
- `frontend/src/components/KioskLoginPage.jsx` - Google OAuth UI
- `frontend/src/services/api.js` - API service (needs auth headers)
- `frontend/src/components/ManagerView.jsx` - Manager UI (needs auth)

---

Last Updated: December 2024

