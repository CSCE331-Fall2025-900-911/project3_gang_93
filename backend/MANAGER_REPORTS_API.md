# Manager Reports API Reference

This document provides detailed information about the Manager Report APIs extracted from project2_gang_93.

## Overview

Three manager report endpoints have been implemented:
1. **X-Report**: Hourly sales activities
2. **Z-Report**: End-of-day totals
3. **Product Usage Chart**: Inventory consumption analysis

## API Endpoints

### 1. X-Report (Hourly Sales Report)

**Endpoint**: `GET /api/reports/x-report`

**Query Parameters**:
- `report_date` (optional): Date in YYYY-MM-DD format. Defaults to today if not provided.

**Response Example**:
```json
{
  "date": "2024-11-19",
  "totalSales": 2250.00,
  "totalVoids": 150.00,
  "cashPayments": 1350.00,
  "cardPayments": 900.00,
  "totalTransactions": 150,
  "avgTransaction": 15.00,
  "hourlyData": [
    {
      "hour": 8,
      "sales": 225.00,
      "voids": 0.00,
      "cash": 135.00,
      "card": 90.00,
      "transactions": 15
    },
    {
      "hour": 9,
      "sales": 300.00,
      "voids": 15.00,
      "cash": 180.00,
      "card": 120.00,
      "transactions": 20
    }
    // ... more hourly data
  ]
}
```

**Usage Examples**:

```bash
# Get X-Report for today
curl http://localhost:8000/api/reports/x-report

# Get X-Report for specific date
curl http://localhost:8000/api/reports/x-report?report_date=2024-11-15
```

```javascript
// Frontend usage
const getXReport = async (date) => {
  const url = date 
    ? `${API_BASE_URL}/reports/x-report?report_date=${date}`
    : `${API_BASE_URL}/reports/x-report`;
  const response = await fetch(url);
  return await response.json();
};
```

**Use Cases**:
- Identify peak hours for staffing decisions
- Analyze hourly sales patterns
- Monitor void transactions throughout the day
- Track cash vs card payment trends by hour

---

### 2. Z-Report (End-of-Day Report)

**Endpoint**: `GET /api/reports/z-report`

**Query Parameters**:
- `report_date` (optional): Date in YYYY-MM-DD format. Defaults to today if not provided.

**Response Example**:
```json
{
  "date": "2024-11-19",
  "totalSales": 2250.00,
  "totalTax": 196.88,
  "cashPayments": 1350.00,
  "cardPayments": 900.00,
  "totalTransactions": 150,
  "avgTransaction": 15.00,
  "lastResetDate": "2024-11-18T23:59:59",
  "lastResetEmployee": "John Doe"
}
```

**Usage Examples**:

```bash
# Get Z-Report for today
curl http://localhost:8000/api/reports/z-report

# Get Z-Report for specific date
curl http://localhost:8000/api/reports/z-report?report_date=2024-11-15
```

```javascript
// Frontend usage
const getZReport = async (date) => {
  const url = date 
    ? `${API_BASE_URL}/reports/z-report?report_date=${date}`
    : `${API_BASE_URL}/reports/z-report`;
  const response = await fetch(url);
  return await response.json();
};
```

**Use Cases**:
- End-of-day financial reconciliation
- Daily closing procedures
- Tax calculation verification
- Payment method analysis
- Track last reset information for audit purposes

**Note**: The Z-Report includes tax calculations at 8.75% rate. In the original project, this report had reset functionality, but in this API version, it's read-only for safety.

---

### 3. Product Usage Chart

**Endpoint**: `GET /api/reports/product-usage`

**Query Parameters** (both required):
- `start_date`: Start date in YYYY-MM-DD format
- `end_date`: End date in YYYY-MM-DD format

**Response Example**:
```json
{
  "startDate": "2024-11-01",
  "endDate": "2024-11-19",
  "totalProducts": 19,
  "products": [
    {
      "itemId": 1,
      "itemName": "Chicken",
      "quantityUsed": 245.5
    },
    {
      "itemId": 2,
      "itemName": "Rice",
      "quantityUsed": 189.0
    },
    {
      "itemId": 3,
      "itemName": "Noodles",
      "quantityUsed": 156.3
    }
    // ... more products sorted by usage
  ]
}
```

**Usage Examples**:

```bash
# Get product usage for a date range
curl "http://localhost:8000/api/reports/product-usage?start_date=2024-11-01&end_date=2024-11-19"

# Get product usage for last 7 days
curl "http://localhost:8000/api/reports/product-usage?start_date=2024-11-12&end_date=2024-11-19"
```

```javascript
// Frontend usage
const getProductUsage = async (startDate, endDate) => {
  const url = `${API_BASE_URL}/reports/product-usage?start_date=${startDate}&end_date=${endDate}`;
  const response = await fetch(url);
  return await response.json();
};
```

**Use Cases**:
- Inventory restocking decisions
- Identify popular ingredients
- Plan for seasonal variations
- Optimize inventory levels
- Reduce waste by understanding actual consumption

**Data Calculation**:
The product usage is calculated by:
1. Finding all sales within the date range
2. Looking up the menu item ingredients for each sale
3. Multiplying ingredient quantities by the number of items sold
4. Summing the total usage per inventory item

---

## Integration Notes

### Error Handling

All endpoints return standard HTTP status codes:
- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters (e.g., invalid date format)
- `500 Internal Server Error`: Database or server error

Error response format:
```json
{
  "detail": "Error message describing what went wrong"
}
```

### Date Format

All dates must be in `YYYY-MM-DD` format (ISO 8601):
- ✅ Valid: `2024-11-19`
- ❌ Invalid: `11/19/2024`, `19-11-2024`, `2024/11/19`

### Performance Considerations

- **X-Report**: Fast query, indexed by date
- **Z-Report**: Fast query, indexed by date
- **Product Usage**: May be slower for large date ranges due to JSON processing. Recommended to limit to 30-90 day ranges for best performance.

### Frontend Integration

Example React hook for reports:

```javascript
import { useState, useEffect } from 'react';

export const useXReport = (date) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const url = date 
          ? `/api/reports/x-report?report_date=${date}`
          : '/api/reports/x-report';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch report');
        const data = await response.json();
        setData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [date]);

  return { data, loading, error };
};
```

## Differences from Original Project

The following differences exist between the original Java Swing implementation and this FastAPI version:

1. **No Reset Functionality**: The original Z-Report had a reset feature that deleted transactions. This has been intentionally omitted from the API for data safety. Reset functionality should be handled through separate admin tools if needed.

2. **Read-Only Reports**: All report endpoints are read-only (GET requests). They don't modify any data.

3. **Simplified Calculations**: The current implementation uses estimated averages for transaction amounts. In production, you may want to add actual transaction total tracking.

4. **No Employee Signature**: The original Z-Report required employee signature before reset. Since reset functionality is removed, this is tracked separately if needed through the `z_report_log` table.

5. **JSON Response Format**: Returns JSON instead of displaying in Swing UI tables.

## Future Enhancements

Potential improvements for production use:

1. **Add actual transaction totals** instead of estimated averages
2. **Add date range validation** to prevent excessively large queries
3. **Add caching** for frequently accessed reports
4. **Add export functionality** (CSV, PDF) for reports
5. **Add filtering options** (by employee, payment type, etc.)
6. **Add comparative reports** (week-over-week, month-over-month)
7. **Add real-time updates** using WebSockets for live dashboards

## Support

For issues or questions about these APIs, refer to:
- Interactive API docs: http://localhost:8000/docs
- Main README: `backend/README.md`
- Database schema: `backend/queries/schema_postgresql.sql`

