# POS System Backend API

FastAPI backend for the POS (Point of Sale) system with PostgreSQL database.

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or using a virtual environment (recommended):

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Database

1. Copy the environment template to `.env`:
```bash
cp env.template.txt .env
```

2. Edit `.env` and replace all placeholder values with your actual database credentials:
```
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_actual_password
DB_HOST=your_database_host
DB_PORT=5432
```

**Important**: Make sure to set `DB_PASSWORD` with your actual password - the application requires it to connect to the database.

### 3. Initialize Database

Make sure your PostgreSQL database has the tables created. Run the schema file:

```bash
psql -h csce-315-db.engr.tamu.edu -U gang_93 -d gang_93_db -f queries/schema_postgresql.sql
```

Or load the CSV data using the utility scripts:

```bash
# Test database connection
python utils/test_connection.py

# Load data from CSV files
python utils/load_data_safe.py

# Or reset database and load data
python utils/reset_database.py --load-data
```

### 4. Run the Server

```bash
python app.py
```

Or using uvicorn directly:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## API Endpoints

### Menu APIs
- `GET /api/menu` - Get all menu items
- `GET /api/menu/{id}` - Get specific menu item

### Transaction APIs
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions` - Get transaction history (with filters)
- `GET /api/transactions/{id}` - Get specific transaction

### Customer APIs
- `GET /api/customers` - Search/get customers
- `GET /api/customers/{id}` - Get customer details
- `GET /api/customers/{id}/rewards` - Get customer reward points
- `POST /api/customers` - Create new customer
- `PUT /api/customers/{id}/points` - Update customer points

### Inventory APIs
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/{id}` - Get specific inventory item
- `PUT /api/inventory/{id}` - Update inventory quantity
- `GET /api/inventory/low-stock` - Get low stock items

### Sales APIs
- `GET /api/sales` - Get sales data (with filters)
- `GET /api/sales/summary` - Get sales analytics

### Employee/Auth APIs
- `POST /api/auth/login` - Employee login
- `POST /api/auth/logout` - Employee logout
- `GET /api/employees` - Get all employees
- `GET /api/employees/{id}` - Get specific employee

### Management APIs
- `GET /api/management/dashboard` - Get dashboard data

### Manager Report APIs
- `GET /api/reports/x-report?report_date=YYYY-MM-DD` - Get X-Report (hourly sales activities)
  - Optional `report_date` parameter (defaults to today)
  - Returns: hourly breakdown of sales, voids, cash/card payments, and transactions
  - No side effects - can be run multiple times per day
  
- `GET /api/reports/z-report?report_date=YYYY-MM-DD` - Get Z-Report (end-of-day totals)
  - Optional `report_date` parameter (defaults to today)
  - Returns: daily summary with sales, tax, cash/card payments, and last reset info
  - In production, typically run once at end of day
  
- `GET /api/reports/product-usage?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Get Product Usage Chart
  - Required `start_date` and `end_date` parameters
  - Returns: inventory consumption report showing quantity used per item
  - Useful for inventory planning and restocking decisions

## Project Structure

```
backend/
├── app.py                    # Main FastAPI application
├── database.py               # Database connection utilities
├── models.py                 # Pydantic models for validation
├── config.py                 # Configuration settings
├── start_server.py           # Server startup script
├── routes.py                 # Legacy routes file (deprecated)
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables (create from env.template.txt)
├── env.template.txt          # Environment template
├── README.md                 # This file
├── data/                     # CSV data files
│   ├── customerRewards.csv
│   ├── employees.csv
│   ├── inventory.csv
│   ├── menu.csv
│   ├── sales.csv
│   └── transactions.csv
├── queries/                  # SQL query files
│   ├── schema_postgresql.sql
│   ├── reset_schema.sql
│   └── reset_and_load_data.sql
└── utils/                    # Utility scripts
    ├── __init__.py
    ├── test_connection.py
    ├── fix_csv_data.py
    ├── reset_database.py
    ├── load_data_safe.py
    └── load_data_from_csv.py
```

## Features

### Transaction Processing
When a transaction is created:
1. Transaction record is saved
2. Inventory is automatically updated (ingredients deducted)
3. Sales records are created for each item
4. Customer points are updated (if customer provided)

### Manager Reports
The backend provides three types of manager reports extracted from the previous project:

#### X-Report (Hourly Sales Report)
- **Purpose**: Provides hourly sales activities for any specific date
- **Use Case**: Analyze rush periods and sales patterns throughout the day
- **Key Metrics**:
  - Total sales, voids, cash/card payments per hour
  - Transaction count per hour
  - Average transaction value
- **Side Effects**: None - can be run as often as needed

#### Z-Report (End-of-Day Report)
- **Purpose**: Provides comprehensive end-of-day totals and summary
- **Use Case**: Daily closing procedures and financial reconciliation
- **Key Metrics**:
  - Total sales and calculated tax (8.75%)
  - Cash vs card payment breakdown
  - Total transaction count
  - Average transaction value
  - Last reset information (date and employee)
- **Side Effects**: Designed for once-per-day use at closing time

#### Product Usage Chart
- **Purpose**: Shows inventory consumption over a date range
- **Use Case**: Inventory planning, restocking decisions, and usage analysis
- **Key Metrics**:
  - Quantity used per inventory item
  - Based on actual sales data and menu item ingredients
  - Sorted by most-used items first
- **Side Effects**: None - pure analytics report

### Error Handling
All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

### CORS Support
CORS is enabled for:
- http://localhost:5173 (Vite dev server)
- http://localhost:3000 (Alternative frontend)

## Development

### Interactive API Documentation

FastAPI automatically generates interactive API documentation:

1. Start the server
2. Visit http://localhost:8000/docs
3. Try out the endpoints directly in your browser

### Testing Endpoints

You can test endpoints using:

**curl:**
```bash
curl http://localhost:8000/api/menu
```

**Python requests:**
```python
import requests
response = requests.get('http://localhost:8000/api/menu')
print(response.json())
```

**Or use the interactive docs** at http://localhost:8000/docs

## Database Connection

The application connects to PostgreSQL using psycopg2 with connection pooling.

Database configuration is in `config.py` and can be overridden using environment variables in `.env`.

## Notes

- The server runs on port 8000 by default
- All dates should be in YYYY-MM-DD format
- All times should be in HH:MM:SS format
- JSON fields (ingredients, items) are automatically parsed
- Customer points are calculated as 1 point per dollar spent

## Troubleshooting

### Database Connection Issues

If you get connection errors:
1. Check your `.env` file has the correct password
2. Verify you can connect using psql directly
3. Ensure the database server is accessible from your network

### Import Errors

Make sure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Port Already in Use

If port 8000 is already in use, specify a different port:
```bash
uvicorn app:app --port 8001
```

