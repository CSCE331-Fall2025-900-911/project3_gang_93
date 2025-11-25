# Manager Reports - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Start the Backend Server
```bash
cd backend
python app.py
```

### Step 2: Test the Reports
Open your browser and visit: **http://localhost:8000/docs**

### Step 3: Try the Endpoints

#### X-Report (Hourly Sales)
```
GET http://localhost:8000/api/reports/x-report
GET http://localhost:8000/api/reports/x-report?report_date=2024-11-15
```

#### Z-Report (End-of-Day)
```
GET http://localhost:8000/api/reports/z-report
GET http://localhost:8000/api/reports/z-report?report_date=2024-11-15
```

#### Product Usage
```
GET http://localhost:8000/api/reports/product-usage?start_date=2024-11-01&end_date=2024-11-19
```

---

## 📊 What Each Report Shows

### X-Report
**Purpose**: See hourly sales patterns  
**Shows**:
- Sales per hour
- Cash vs Card per hour
- Transactions per hour
- Voids

**When to Use**: Daily during operations to see rush hours

---

### Z-Report
**Purpose**: End-of-day summary  
**Shows**:
- Total daily sales
- Tax collected
- Cash vs Card totals
- Average transaction
- Last reset info

**When to Use**: End of day for closing procedures

---

### Product Usage
**Purpose**: See what ingredients were used  
**Shows**:
- Each inventory item's usage
- Quantities consumed
- Based on actual sales

**When to Use**: Weekly/monthly for restocking decisions

---

## 🧪 Quick Test

Run this test script to verify everything works:

```bash
cd backend
pip install requests  # only needed once
python test_reports.py
```

Expected output:
```
✅ Server is running
✅ X-Report API working!
✅ Z-Report API working!
✅ Product Usage API working!
```

---

## 📱 Frontend Integration Example

```javascript
// Simple fetch example
async function getReports() {
  // Get today's X-Report
  const xReport = await fetch('/api/reports/x-report').then(r => r.json());
  console.log('Hourly data:', xReport.hourlyData);
  
  // Get today's Z-Report
  const zReport = await fetch('/api/reports/z-report').then(r => r.json());
  console.log('Total sales:', zReport.totalSales);
  
  // Get last 7 days product usage
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0];
  const usage = await fetch(
    `/api/reports/product-usage?start_date=${startDate}&end_date=${endDate}`
  ).then(r => r.json());
  console.log('Top used products:', usage.products.slice(0, 5));
}
```

---

## 📚 More Information

| Document | Description |
|----------|-------------|
| `MANAGER_REPORTS_API.md` | Complete API reference with examples |
| `README.md` | Backend setup and configuration |
| `MANAGER_REPORTS_IMPLEMENTATION_SUMMARY.md` | Implementation details |
| `http://localhost:8000/docs` | Interactive API testing |

---

## 💡 Pro Tips

1. **Date Format**: Always use `YYYY-MM-DD` (e.g., `2024-11-19`)
2. **No Date Provided**: APIs default to today's date
3. **Large Date Ranges**: For Product Usage, keep it under 90 days for best performance
4. **Testing**: Use the `/docs` page - it's easier than curl!
5. **Data**: If you see no data, check if there are transactions for that date

---

## ❓ Common Issues

**"Cannot connect to server"**
- Make sure backend is running: `python app.py`
- Check URL: `http://localhost:8000`

**"No data for this date"**
- Check if transactions exist for that date
- Try today's date (leave date parameter empty)

**"Invalid date format"**
- Use `YYYY-MM-DD` format
- Example: `2024-11-19` ✅ not `11/19/2024` ❌

---

## 🎯 Next Steps

1. ✅ APIs are ready - integrate into your frontend
2. 📊 Create UI components for each report type
3. 📈 Add charts/graphs for visualization
4. 🔐 Add authentication/authorization
5. 📄 Add export to PDF/CSV features

---

**That's it! Your manager reports are ready to use.** 🎉

For detailed information, see `MANAGER_REPORTS_API.md`

