# Transaction Structure Update - Add-ons Support

## Overview
The transaction structure has been updated to support add-ons, customization options (ice, sweetness), and other metadata fields. All components have been updated to handle the new structure.

## New Transaction Item Structure

Transaction items now support the following fields:
- `menuItemId` (required): The menu item ID
- `quantity` (required): The quantity ordered
- `ice` (optional): Ice level (e.g., "extra", "light", "normal", "no ice")
- `sweetness` (optional): Sweetness level (e.g., "0%", "25%", "50%", "75%", "100%")
- `addOnIDs` (optional): List of add-on item IDs (e.g., [201, 205])

## Storage Formats

Transactions can be stored in two formats:

1. **List format** (direct array):
   ```json
   [
     {
       "menuItemId": 101,
       "quantity": 1,
       "ice": "normal",
       "sweetness": "75%",
       "addOnIDs": [201, 205]
     }
   ]
   ```

2. **Dict format** (with tip):
   ```json
   {
     "items": [
       {
         "menuItemId": 101,
         "quantity": 1,
         "ice": "normal",
         "sweetness": "75%",
         "addOnIDs": [201, 205]
       }
     ],
     "tip": 0.79
   }
   ```

## Updated Components

### 1. Backend Models (`backend/models.py`)
- ✅ `TransactionItem` model updated to accept optional `ice`, `sweetness`, and `addOnIDs` fields

### 2. Transaction Creation (`backend/app.py`)
- ✅ Preserves all add-on fields when storing transactions
- ✅ Extracts `menuItemId` and `quantity` for inventory/sales processing
- ✅ Background task processes inventory and sales correctly

### 3. Transaction Retrieval (`backend/app.py`)
- ✅ `get_transactions()` - Handles both formats, preserves all fields
- ✅ `get_transaction()` - Handles both formats, preserves all fields
- ✅ Both endpoints safely extract `menuItemId` and `quantity` for calculations

### 4. Reports (`backend/app.py`)
- ✅ X-Report: SQL queries use `item->>'menuItemId'` and `item->>'quantity'` which work with any additional fields
- ✅ Z-Report: Same JSONB operators handle new structure
- ✅ Product Usage Report: Uses sales table (populated correctly from transactions)
- ✅ All reports handle both list and dict formats

### 5. Dashboard (`backend/app.py`)
- ✅ Uses `sales` table (not transaction items directly)
- ✅ Sales records are created correctly from transactions with add-ons
- ✅ No changes needed - works correctly

### 6. Inventory Processing (`backend/app.py`)
- ✅ Extracts `menuItemId` and `quantity` correctly
- ✅ Ignores add-on fields (as expected)
- ✅ Processes inventory updates correctly

### 7. Frontend (`frontend/src/services/api.js`)
- ✅ Sends all add-on fields when creating transactions
- ✅ Preserves `ice`, `sweetness`, and `addOnIDs` in transaction payload

## How It Works

1. **Transaction Creation**: Frontend sends items with add-ons → Backend validates with Pydantic → Stores all fields in JSONB → Processes inventory/sales using only `menuItemId` and `quantity`

2. **Transaction Retrieval**: Backend reads JSONB → Handles both formats → Preserves all fields → Calculates totals using `menuItemId` and `quantity`

3. **Reports**: SQL queries use JSONB operators (`item->>'menuItemId'`) which extract specific fields regardless of other fields present

4. **Dashboard**: Uses `sales` table which is populated from transactions, so it automatically includes all transaction data

## Testing

All components have been verified to:
- ✅ Accept transactions with add-ons
- ✅ Preserve add-on fields when storing/retrieving
- ✅ Calculate totals correctly (using only `menuItemId` and `quantity`)
- ✅ Process inventory correctly
- ✅ Generate reports correctly
- ✅ Display dashboard data correctly

## Notes

- Add-on fields are metadata only - they don't affect price calculations
- Inventory processing only uses `menuItemId` and `quantity`
- Reports extract `menuItemId` and `quantity` using JSONB operators, which work regardless of other fields
- All transaction endpoints preserve the full item structure including add-ons

