# POS System Frontend

React + Vite frontend for the POS System.

## Quick Start

### Prerequisites
- Node.js installed
- Backend server running (see `../backend/README.md`)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Frontend will run on http://localhost:5173

### Build

```bash
npm run build
```

## Connection to Backend

The frontend automatically connects to the backend API at `http://localhost:8000`.

### API Configuration

Default backend URL: `http://localhost:8000`

To change the API URL, create a `.env` file:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### How It Works

1. **Menu Loading**: Fetches menu items from `GET /api/menu`
2. **Transactions**: Sends transactions to `POST /api/transactions`
3. **Error Handling**: Shows errors if backend is unavailable
4. **Loading States**: Shows loading indicator while fetching data

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx              # Main app component
│   ├── config/
│   │   └── api.js           # API configuration
│   ├── services/
│   │   └── api.js           # API service functions
│   ├── components/          # React components
│   ├── constants/           # Constants (TAX_RATE, etc.)
│   └── utils/               # Utility functions
├── .env.example             # Environment template
└── README.md                # This file
```

## Running Frontend + Backend

### Terminal 1: Backend
```bash
cd backend
python start_server.py
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

### Browser
Open http://localhost:5173

## API Endpoints Used

- `GET /api/menu` - Fetch menu items
- `POST /api/transactions` - Create transaction

## Features

- ✅ Fetches menu from backend database
- ✅ Adds items to cart
- ✅ Completes transactions (saves to database)
- ✅ Loading states
- ✅ Error handling
- ✅ Automatic icon assignment for menu items

## Troubleshooting

### Backend Connection Issues

If you see "Failed to load menu":
1. Make sure backend is running: `cd backend && python start_server.py`
2. Check backend is accessible: http://localhost:8000
3. Verify API works: http://localhost:8000/api/menu

### CORS Errors

Backend has CORS enabled for localhost:5173. If you see CORS errors:
1. Check backend is running
2. Verify CORS settings in `backend/app.py`

## Documentation

- **Connection Guide**: See `FRONTEND_BACKEND_CONNECTION.md`
- **Quick Start**: See `../QUICK_START.md`
- **Backend API**: http://localhost:8000/docs (when backend is running)
