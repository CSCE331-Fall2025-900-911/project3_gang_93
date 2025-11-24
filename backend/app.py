"""FastAPI application for POS System"""
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import date, time, datetime
import json
import os

from models import *
from database import execute_query, execute_insert, get_db_cursor

app = FastAPI(title="POS System API", version="1.0.0")

# CORS middleware for frontend
# Get allowed origins from environment variable or use defaults
allowed_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,https://project3-gang-93.onrender.com"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "POS System API", "version": "1.0.0"}

# ================== MENU APIs ==================

@app.get("/api/menu", response_model=MenuResponse)
def get_menu():
    """Get all menu items"""
    try:
        query = """
            SELECT menuItemId, menuItemName, price, ingredients
            FROM menu
            ORDER BY menuItemId
        """
        items = execute_query(query)
        
        # Convert to list of dicts if needed
        menu_items = []
        for item in items:
            menu_items.append({
                "menuItemId": item['menuitemid'],
                "menuItemName": item['menuitemname'],
                "price": float(item['price']),
                "ingredients": item['ingredients']
            })
        
        return {"menuItems": menu_items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/menu/{menu_item_id}", response_model=MenuItem)
def get_menu_item(menu_item_id: int):
    """Get a specific menu item by ID"""
    try:
        query = """
            SELECT menuItemId, menuItemName, price, ingredients
            FROM menu
            WHERE menuItemId = %s
        """
        item = execute_query(query, (menu_item_id,), fetch_one=True)
        
        if not item:
            raise HTTPException(status_code=404, detail="Menu item not found")
        
        return {
            "menuItemId": item['menuitemid'],
            "menuItemName": item['menuitemname'],
            "price": float(item['price']),
            "ingredients": item['ingredients']
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ================== ADD-ON APIs ==================

@app.get("/api/addons", response_model=AddOnResponse)
def get_add_ons():
    try:
        addons = execute_query("SELECT addOnID, addOnName, price, ingredients FROM addOns ORDER BY addOnID")
        formatted = []
        for a in addons:
            formatted.append({
                "addOnID": a["addonid"],
                "addOnName": a["addonname"],
                "price": float(a["price"]),
                "ingredients": a["ingredients"]
            })
        return {"addOns": formatted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ================== TRANSACTION APIs ==================

def process_inventory_and_sales(inventory_updates, sales_records, trans_date, trans_time):
    """Background task to process inventory updates and sales records"""
    try:
        with get_db_cursor() as cursor:
            # Batch inventory updates using executemany
            if inventory_updates:
                inventory_batch = [(total_qty, item_id, total_qty) 
                                 for item_id, total_qty in inventory_updates.items()]
                cursor.executemany("""
                    UPDATE inventory
                    SET quantity = quantity - %s
                    WHERE itemId = %s AND quantity >= %s
                """, inventory_batch)
            
            # Batch sales inserts
            if sales_records:
                cursor.execute("SELECT COALESCE(MAX(saleId), 0) as max_id FROM sales")
                max_sale = cursor.fetchone()
                next_sale_id = (max_sale['max_id'] if max_sale else 0) + 1
                
                sales_batch = []
                for idx, sale in enumerate(sales_records):
                    sales_batch.append((
                        next_sale_id + idx,
                        sale['itemName'],
                        sale['quantity'],
                        trans_date,
                        trans_time
                    ))
                    
                if sales_batch:
                    cursor.executemany("""
                        INSERT INTO sales (saleId, itemName, amountSold, date, time)
                        VALUES (%s, %s, %s, %s, %s)
                    """, sales_batch)
    except Exception as e:
        # Silently handle errors - don't fail the transaction
        pass

@app.post("/api/transactions", response_model=TransactionResponse)
def create_transaction(transaction: TransactionCreate, background_tasks: BackgroundTasks):
    """Create a new transaction - returns immediately, processes inventory/sales in background"""
    try:
        # Parse date/time from string if provided, otherwise use current
        if transaction.date:
            trans_date = datetime.strptime(transaction.date, '%Y-%m-%d').date()
        else:
            trans_date = datetime.now().date()
        
        if transaction.time:
            trans_time = datetime.strptime(transaction.time, '%H:%M:%S').time()
        else:
            trans_time = datetime.now().time()
        
        # Use a single database connection for critical operations
        with get_db_cursor() as cursor:
            # OPTIMIZATION: Batch fetch all menu items in one query
            menu_item_ids = [item.menuItemId for item in transaction.items]
            if not menu_item_ids:
                raise HTTPException(status_code=400, detail="No items in transaction")
            
            placeholders = ','.join(['%s'] * len(menu_item_ids))
            menu_query = f"""
                SELECT menuItemId, price, ingredients, menuItemName 
                FROM menu 
                WHERE menuItemId IN ({placeholders})
            """

            cursor.execute(menu_query, tuple(menu_item_ids))
            menu_items = cursor.fetchall()

            cursor.execute("SELECT * FROM addOns")
            addon_items = cursor.fetchall()
            
            # Create lookup dictionary
            menu_dict = {item['menuitemid']: item for item in menu_items}
            addon_dict = {item['addonid']: item for item in addon_items}
            
            SIMPLE_SYRUP_ID = None # Find Simple Syrup ID
            BASE_SYRUP_QTY = None # 100% sweetness qty

            # Find Simple Syrup ID and qty from addOns
            for addon in addon_dict.values():
                name = addon["addonname"].lower()

                if "simple syrup" in name:
                    syrup_ing = addon['ingredients']
                    
                    if isinstance(syrup_ing, str):
                        syrup_ing = json.loads(syrup_ing)

                    SIMPLE_SYRUP_ID = syrup_ing[0]["itemId"]
                    BASE_SYRUP_QTY = float(syrup_ing[0]["qty"])

                    break

            # Sweetness == syrup multiplier
            SWEETNESS_MULTIPLIERS = {
                "0%": 0.0,
                "25%": 0.25,
                "50%": 0.5,
                "75%": 0.75,
                "100%": 1.0
            }

            # Calculate total and prepare data
            total = 0.0
            items_with_prices = []
            inventory_updates = {}  # itemId -> total_qty_to_deduct
            sales_records = []
            
            for item in transaction.items:
                menu_item = menu_dict.get(item.menuItemId)
                if not menu_item:
                    continue
                
                # Calculate price
                item_total = float(menu_item['price']) * item.quantity
                total += item_total
                items_with_prices.append({
                    "menuItemId": item.menuItemId,
                    "quantity": item.quantity,
                    "addOnIDs": item.addOnIDs,
                    "ice": item.ice,
                    "sweetness": item.sweetness
                })
                
                # Prepare inventory updates (for background processing)
                ingredients = menu_item['ingredients']
                if ingredients:
                    if isinstance(ingredients, str):
                        ingredients = json.loads(ingredients)
                    
                    for ingredient in ingredients:
                        item_id = ingredient['itemId']
                        qty_to_deduct = ingredient['qty'] * item.quantity
                        inventory_updates[item_id] = inventory_updates.get(item_id, 0) + qty_to_deduct
                
                # Prepare sales records (for background processing)
                sales_records.append({
                    'itemName': menu_item['menuitemname'],
                    'quantity': item.quantity
                })
            
                for addOnID in item.addOnIDs:
                    addon = addon_dict.get(addOnID)
                    if not addon:
                        continue

                    total += float(addon['price']) * item.quantity

                    addon_ing = addon['ingredients']
                    if isinstance(addon_ing, str):
                        addon_ing = json.loads(addon_ing)

                    for ing in addon_ing:
                        item_id = ing['itemId']
                        qty_to_deduct = ing['qty'] * item.quantity
                        inventory_updates[item_id] = inventory_updates.get(item_id, 0) + qty_to_deduct


                    sales_records.append({
                        "itemName": addon["addonname"],
                        "quantity": item.quantity
                    })

                if SIMPLE_SYRUP_ID is not None and BASE_SYRUP_QTY is not None:
                    factor = SWEETNESS_MULTIPLIERS[item.sweetness]
                    syrup_qty = BASE_SYRUP_QTY * factor * item.quantity
                    inventory_updates[SIMPLE_SYRUP_ID] = (
                        inventory_updates.get(SIMPLE_SYRUP_ID, 0) + syrup_qty
                    )

            # Add tip to total
            tip_amount = float(transaction.tip) if transaction.tip else 0.0
            total += tip_amount
            
            # Get next transaction ID
            cursor.execute("SELECT COALESCE(MAX(transactionId), 0) + 1 as next_id FROM transactions")
            next_id = cursor.fetchone()
            transaction_id = next_id['next_id'] if next_id else 1
            
            # Prepare items JSON with tip metadata
            items_json = {
                "items": items_with_prices,
                "tip": tip_amount
            }
            
            # Insert transaction (CRITICAL - must complete before returning)
            cursor.execute("""
                INSERT INTO transactions (transactionId, date, customerId, items, time, transactionType)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING transactionId
            """, (
                transaction_id,
                trans_date,
                transaction.customerId,
                json.dumps(items_json),
                trans_time,
                transaction.transactionType
            ))
            
            # Update customer points if customer provided (CRITICAL - should complete before returning)
            # Points are based on subtotal (before tip)
            if transaction.customerId and transaction.transactionType != 'void':
                subtotal_for_points = total - tip_amount
                points_to_add = int(subtotal_for_points)
                cursor.execute("""
                    UPDATE customerRewards
                    SET points = points + %s
                    WHERE customerId = %s
                """, (points_to_add, transaction.customerId))
            
            # Schedule inventory and sales processing in background
            # This allows us to return immediately while processing continues
            background_tasks.add_task(
                process_inventory_and_sales,
                inventory_updates,
                sales_records,
                trans_date,
                trans_time
            )
        
        # Return immediately - background task will handle inventory and sales
        return {
            "transactionId": transaction_id,
            "message": "Transaction completed successfully",
            "total": total
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transaction failed: {str(e)}")

@app.get("/api/transactions", response_model=TransactionListResponse)
def get_transactions(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    customerId: Optional[int] = Query(None, description="Filter by customer ID"),
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get all transactions with optional filtering"""
    try:
        # Build query with filters
        query = """
            SELECT t.transactionId, t.date, t.time, t.customerId, t.items, t.transactionType
            FROM transactions t
            WHERE 1=1
        """
        params = []
        
        if date:
            query += " AND t.date = %s"
            params.append(date)
        
        if customerId:
            query += " AND t.customerId = %s"
            params.append(customerId)
        
        query += " ORDER BY t.date DESC, t.time DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        transactions = execute_query(query, tuple(params))
        
        # Get total count
        count_query = "SELECT COUNT(*) as total FROM transactions WHERE 1=1"
        count_params = []
        if date:
            count_query += " AND date = %s"
            count_params.append(date)
        if customerId:
            count_query += " AND customerId = %s"
            count_params.append(customerId)
        
        total_result = execute_query(count_query, tuple(count_params), fetch_one=True)
        total_count = total_result['total'] if total_result else 0
        
        # Format transactions
        formatted_transactions = []
        for t in transactions:
            items_data = t['items']
            if isinstance(items_data, str):
                items_data = json.loads(items_data)
            
            # Handle both old format (array) and new format (object with items and tip)
            if isinstance(items_data, dict) and 'items' in items_data:
                items = items_data['items']
                tip = items_data.get('tip', 0.0)
            else:
                # Old format - just an array
                items = items_data if isinstance(items_data, list) else []
                tip = 0.0
            
            # Collect all addOnIDs used in this transaction
            add_on_ids = set()
            for item in items:
                for add_id in item.get("addOnIDs", []):
                    add_on_ids.add(add_id)

            # Batch-load add-on prices
            add_on_prices = {}
            if add_on_ids:
                placeholders = ",".join(["%s"] * len(add_on_ids))
                addon_price_query = f"""
                    SELECT addOnID, price
                    FROM addOns
                    WHERE addOnID IN ({placeholders})
                """
                addon_rows = execute_query(addon_price_query, tuple(add_on_ids))
                add_on_prices = {row["addonid"]: float(row["price"]) for row in addon_rows}

            # Calculate total (including add-ons)
            total = 0.0
            for item in items:
                # base drink
                price_query = "SELECT price FROM menu WHERE menuItemId = %s"
                menu_item = execute_query(price_query, (item['menuItemId'],), fetch_one=True)
                if menu_item:
                    total += float(menu_item['price']) * item['quantity']

                # add-ons
                for add_id in item.get("addOnIDs", []):
                    add_price = add_on_prices.get(add_id)
                    if add_price is not None:
                        total += add_price * item["quantity"]
            
            # Add tip to total
            total += float(tip)
            
            formatted_transactions.append({
                "transactionId": t['transactionid'],
                "date": t['date'],
                "time": t['time'],
                "customerId": t['customerid'],
                "items": items,
                "transactionType": t['transactiontype'],
                "total": total
            })
        
        return {
            "transactions": formatted_transactions,
            "total": total_count,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/transactions/{transaction_id}", response_model=TransactionDetail)
def get_transaction(transaction_id: int):
    """Get a specific transaction by ID"""
    try:
        query = """
            SELECT transactionId, date, time, customerId, items, transactionType
            FROM transactions
            WHERE transactionId = %s
        """
        transaction = execute_query(query, (transaction_id,), fetch_one=True)
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        items_data = transaction['items']
        if isinstance(items_data, str):
            items_data = json.loads(items_data)
        
        # Handle both old format (array) and new format (object with items and tip)
        if isinstance(items_data, dict) and 'items' in items_data:
            items = items_data['items']
            tip = items_data.get('tip', 0.0)
        else:
            # Old format - just an array
            items = items_data if isinstance(items_data, list) else []
            tip = 0.0
        
        # Calculate total
        total = 0.0

        # Collect all addOnIDs
        add_on_ids = set()
        for item in items:
            for add_id in item.get("addOnIDs", []):
                add_on_ids.add(add_id)

        # Batch-load add-on prices
        add_on_prices = {}
        if add_on_ids:
            placeholders = ",".join(["%s"] * len(add_on_ids))
            addon_price_query = f"""
                SELECT addOnID, price
                FROM addOns
                WHERE addOnID IN ({placeholders})
            """
            addon_rows = execute_query(addon_price_query, tuple(add_on_ids))
            add_on_prices = {row["addonid"]: float(row["price"]) for row in addon_rows}

        # Calculate total (including add-ons)
        for item in items:
            # base drink
            price_query = "SELECT price FROM menu WHERE menuItemId = %s"
            menu_item = execute_query(price_query, (item['menuItemId'],), fetch_one=True)
            if menu_item:
                total += float(menu_item['price']) * item['quantity']

            # add-ons
            for add_id in item.get("addOnIDs", []):
                add_price = add_on_prices.get(add_id)
                if add_price is not None:
                    total += add_price * item["quantity"]
        
        # Add tip to total
        total += float(tip)
        
        return {
            "transactionId": transaction['transactionid'],
            "date": transaction['date'],
            "time": transaction['time'],
            "customerId": transaction['customerid'],
            "items": items,
            "transactionType": transaction['transactiontype'],
            "total": total
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ================== CUSTOMER APIs ==================

@app.get("/api/customers", response_model=CustomerListResponse)
def get_customers(search: Optional[str] = Query(None, description="Search by name, email, or phone")):
    """Get all customers or search customers"""
    try:
        if search:
            query = """
                SELECT customerId, firstName, lastName, DOB, phoneNumber, email, points, dateJoined
                FROM customerRewards
                WHERE LOWER(firstName) LIKE LOWER(%s)
                   OR LOWER(lastName) LIKE LOWER(%s)
                   OR LOWER(email) LIKE LOWER(%s)
                   OR phoneNumber LIKE %s
                ORDER BY lastName, firstName
            """
            search_pattern = f"%{search}%"
            customers = execute_query(query, (search_pattern, search_pattern, search_pattern, search_pattern))
        else:
            query = """
                SELECT customerId, firstName, lastName, DOB, phoneNumber, email, points, dateJoined
                FROM customerRewards
                ORDER BY lastName, firstName
                LIMIT 100
            """
            customers = execute_query(query)
        
        formatted_customers = []
        for c in customers:
            formatted_customers.append({
                "customerId": c['customerid'],
                "firstName": c['firstname'],
                "lastName": c['lastname'],
                "DOB": c['dob'],
                "phoneNumber": c['phonenumber'],
                "email": c['email'],
                "points": c['points'],
                "dateJoined": c['datejoined']
            })
        
        return {"customers": formatted_customers}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/customers/{customer_id}", response_model=Customer)
def get_customer(customer_id: int):
    """Get a specific customer by ID"""
    try:
        query = """
            SELECT customerId, firstName, lastName, DOB, phoneNumber, email, points, dateJoined
            FROM customerRewards
            WHERE customerId = %s
        """
        customer = execute_query(query, (customer_id,), fetch_one=True)
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        return {
            "customerId": customer['customerid'],
            "firstName": customer['firstname'],
            "lastName": customer['lastname'],
            "DOB": customer['dob'],
            "phoneNumber": customer['phonenumber'],
            "email": customer['email'],
            "points": customer['points'],
            "dateJoined": customer['datejoined']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/customers/{customer_id}/rewards", response_model=CustomerRewards)
def get_customer_rewards(customer_id: int):
    """Get customer's reward points"""
    try:
        query = "SELECT customerId, points FROM customerRewards WHERE customerId = %s"
        customer = execute_query(query, (customer_id,), fetch_one=True)
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        return {
            "customerId": customer['customerid'],
            "points": customer['points'],
            "pointsEarned": 0,
            "pointsRedeemed": 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/customers", response_model=Customer)
def create_customer(customer: CustomerCreate):
    """Create a new customer"""
    try:
        # Get next customer ID
        query = "SELECT COALESCE(MAX(customerId), 900) + 1 as next_id FROM customerRewards"
        next_id = execute_query(query, fetch_one=True)
        customer_id = next_id['next_id'] if next_id else 901
        
        insert_query = """
            INSERT INTO customerRewards (customerId, firstName, lastName, DOB, phoneNumber, email, points, dateJoined)
            VALUES (%s, %s, %s, %s, %s, %s, 0, CURRENT_DATE)
            RETURNING customerId, firstName, lastName, DOB, phoneNumber, email, points, dateJoined
        """
        
        result = execute_insert(
            insert_query,
            (customer_id, customer.firstName, customer.lastName, customer.DOB, customer.phoneNumber, customer.email)
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create customer")
        
        return {
            "customerId": result['customerid'],
            "firstName": result['firstname'],
            "lastName": result['lastname'],
            "DOB": result['dob'],
            "phoneNumber": result['phonenumber'],
            "email": result['email'],
            "points": result['points'],
            "dateJoined": result['datejoined']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.put("/api/customers/{customer_id}/points", response_model=CustomerRewards)
def update_customer_points(customer_id: int, update: UpdatePoints):
    """Update customer points (add or redeem)"""
    try:
        # Check if customer exists
        check_query = "SELECT points FROM customerRewards WHERE customerId = %s"
        customer = execute_query(check_query, (customer_id,), fetch_one=True)
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        current_points = customer['points']
        new_points = current_points + update.points
        
        if new_points < 0:
            raise HTTPException(status_code=400, detail="Insufficient points")
        
        update_query = """
            UPDATE customerRewards
            SET points = %s
            WHERE customerId = %s
            RETURNING customerId, points
        """
        
        result = execute_query(update_query, (new_points, customer_id), fetch_one=True)
        
        return {
            "customerId": result['customerid'],
            "points": result['points'],
            "pointsEarned": max(0, update.points),
            "pointsRedeemed": abs(min(0, update.points))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ================== INVENTORY APIs ==================

@app.get("/api/inventory", response_model=InventoryResponse)
def get_inventory():
    """Get all inventory items"""
    try:
        query = """
            SELECT itemId, itemName, quantity
            FROM inventory
            ORDER BY itemId
        """
        items = execute_query(query)
        
        formatted_items = []
        for item in items:
            formatted_items.append({
                "itemId": item['itemid'],
                "itemName": item['itemname'],
                "quantity": float(item['quantity'])
            })
        
        return {"inventory": formatted_items}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/inventory/{item_id}", response_model=InventoryItem)
def get_inventory_item(item_id: int):
    """Get a specific inventory item by ID"""
    try:
        query = "SELECT itemId, itemName, quantity FROM inventory WHERE itemId = %s"
        item = execute_query(query, (item_id,), fetch_one=True)
        
        if not item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        return {
            "itemId": item['itemid'],
            "itemName": item['itemname'],
            "quantity": float(item['quantity'])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.put("/api/inventory/{item_id}", response_model=InventoryItem)
def update_inventory_item(item_id: int, update: UpdateInventory):
    """Update inventory quantity"""
    try:
        query = """
            UPDATE inventory
            SET quantity = %s
            WHERE itemId = %s
            RETURNING itemId, itemName, quantity
        """
        
        result = execute_query(query, (update.quantity, item_id), fetch_one=True)
        
        if not result:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        return {
            "itemId": result['itemid'],
            "itemName": result['itemname'],
            "quantity": float(result['quantity'])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/inventory/low-stock", response_model=InventoryResponse)
def get_low_stock_items(threshold: float = Query(10.0, description="Low stock threshold")):
    """Get items with low stock"""
    try:
        query = """
            SELECT itemId, itemName, quantity
            FROM inventory
            WHERE quantity < %s
            ORDER BY quantity ASC
        """
        items = execute_query(query, (threshold,))
        
        formatted_items = []
        for item in items:
            formatted_items.append({
                "itemId": item['itemid'],
                "itemName": item['itemname'],
                "quantity": float(item['quantity'])
            })
        
        return {"inventory": formatted_items}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ================== SALES APIs ==================

@app.get("/api/sales", response_model=SalesResponse)
def get_sales(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    startDate: Optional[str] = Query(None, description="Start date for range"),
    endDate: Optional[str] = Query(None, description="End date for range"),
    itemName: Optional[str] = Query(None, description="Filter by item name"),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get sales data"""
    try:
        query = "SELECT saleId, itemName, amountSold, date, time FROM sales WHERE 1=1"
        params = []
        
        if date:
            query += " AND date = %s"
            params.append(date)
        elif startDate and endDate:
            query += " AND date BETWEEN %s AND %s"
            params.extend([startDate, endDate])
        
        if itemName:
            query += " AND LOWER(itemName) LIKE LOWER(%s)"
            params.append(f"%{itemName}%")
        
        query += " ORDER BY date DESC, time DESC LIMIT %s"
        params.append(limit)
        
        sales = execute_query(query, tuple(params))
        
        formatted_sales = []
        for sale in sales:
            formatted_sales.append({
                "saleId": sale['saleid'],
                "itemName": sale['itemname'],
                "amountSold": sale['amountsold'],
                "date": sale['date'],
                "time": sale['time']
            })
        
        # Calculate totals
        total_query = """
            SELECT 
                COUNT(*) as count,
                SUM(s.amountSold * COALESCE(m.price, a.price)) as revenue
            FROM sales s
            LEFT JOIN menu m ON s.itemName = m.menuItemName
            LEFT JOIN addOns a ON s.itemName = a.addOnName
            WHERE 1=1
        """

        total_params = []
        
        if date:
            total_query += " AND s.date = %s"
            total_params.append(date)
        elif startDate and endDate:
            total_query += " AND s.date BETWEEN %s AND %s"
            total_params.extend([startDate, endDate])
        
        if itemName:
            total_query += " AND LOWER(s.itemName) LIKE LOWER(%s)"
            total_params.append(f"%{itemName}%")
        
        totals = execute_query(total_query, tuple(total_params), fetch_one=True)
        
        return {
            "sales": formatted_sales,
            "totalSales": totals['count'] if totals else 0,
            "totalRevenue": float(totals['revenue']) if totals and totals['revenue'] else 0.0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/sales/summary", response_model=SalesSummary)
def get_sales_summary(
    startDate: Optional[str] = Query(None, description="Start date for range"),
    endDate: Optional[str] = Query(None, description="End date for range")
):
    """Get sales summary/analytics"""
    try:
        # Base query conditions
        date_condition = "1=1"
        params = []
        
        if startDate and endDate:
            date_condition = "s.date BETWEEN %s AND %s"
            params = [startDate, endDate]
        
        # Total sales and revenue
        totals_query = f"""
            SELECT 
                COUNT(*) as total_sales,
                SUM(s.amountSold * COALESCE(m.price, a.price)) as total_revenue,
                AVG(s.amountSold * COALESCE(m.price, a.price)) as avg_order_value
            FROM sales s
            LEFT JOIN menu m ON s.itemName = m.menuItemName
            LEFT JOIN addOns a ON s.itemName = a.addOnName
            WHERE {date_condition}
        """
        totals = execute_query(totals_query, tuple(params), fetch_one=True)
        
        # Top selling items
        top_items_query = f"""
            SELECT 
                s.itemName,
                SUM(s.amountSold) as quantity,
                SUM(s.amountSold * COALESCE(m.price, a.price)) as revenue
            FROM sales s
            LEFT JOIN menu m ON s.itemName = m.menuItemName
            LEFT JOIN addOns a ON s.itemName = a.addOnName
            WHERE {date_condition}
            GROUP BY s.itemName
            ORDER BY revenue DESC
            LIMIT 10
        """

        top_items = execute_query(top_items_query, tuple(params))
        
        formatted_top_items = []
        for item in top_items:
            formatted_top_items.append({
                "itemName": item['itemname'],
                "quantity": int(item['quantity']),
                "revenue": float(item['revenue'])
            })
        
        # Sales by date
        sales_by_date_query = f"""
            SELECT 
                s.date,
                COUNT(*) as sales,
                SUM(s.amountSold * COALESCE(m.price, a.price)) as revenue
            FROM sales s
            LEFT JOIN menu m ON s.itemName = m.menuItemName
            LEFT JOIN addOns a ON s.itemName = a.addOnName
            WHERE {date_condition}
            GROUP BY s.date
            ORDER BY s.date DESC
            LIMIT 30
        """
        sales_by_date = execute_query(sales_by_date_query, tuple(params))
        
        formatted_sales_by_date = []
        for day in sales_by_date:
            formatted_sales_by_date.append({
                "date": day['date'],
                "sales": int(day['sales']),
                "revenue": float(day['revenue'])
            })
        
        return {
            "totalSales": int(totals['total_sales']) if totals else 0,
            "totalRevenue": float(totals['total_revenue']) if totals and totals['total_revenue'] else 0.0,
            "averageOrderValue": float(totals['avg_order_value']) if totals and totals['avg_order_value'] else 0.0,
            "topItems": formatted_top_items,
            "salesByDate": formatted_sales_by_date
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ================== EMPLOYEE/AUTH APIs ==================

@app.post("/api/auth/login", response_model=LoginResponse)
def login(credentials: LoginRequest):
    """Employee login"""
    try:
        query = """
            SELECT employeeId, firstName, lastName, authLevel, startDate
            FROM employees
            WHERE employeeId = %s
        """
        employee = execute_query(query, (credentials.employeeId,), fetch_one=True)
        
        if not employee:
            raise HTTPException(status_code=401, detail="Invalid employee ID")
        
        # Note: In production, verify password hash here
        
        return {
            "employeeId": employee['employeeid'],
            "firstName": employee['firstname'],
            "lastName": employee['lastname'],
            "authLevel": employee['authlevel'],
            "token": None  # Implement JWT token generation if needed
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/auth/logout")
def logout():
    """Employee logout"""
    return {"message": "Logged out successfully"}

@app.get("/api/employees", response_model=EmployeeListResponse)
def get_employees():
    """Get all employees"""
    try:
        query = """
            SELECT employeeId, firstName, lastName, authLevel, startDate
            FROM employees
            ORDER BY employeeId
        """
        employees = execute_query(query)
        
        formatted_employees = []
        for emp in employees:
            formatted_employees.append({
                "employeeId": emp['employeeid'],
                "firstName": emp['firstname'],
                "lastName": emp['lastname'],
                "authLevel": emp['authlevel'],
                "startDate": emp['startdate']
            })
        
        return {"employees": formatted_employees}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/employees/{employee_id}", response_model=Employee)
def get_employee(employee_id: int):
    """Get a specific employee by ID"""
    try:
        query = """
            SELECT employeeId, firstName, lastName, authLevel, startDate
            FROM employees
            WHERE employeeId = %s
        """
        employee = execute_query(query, (employee_id,), fetch_one=True)
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        return {
            "employeeId": employee['employeeid'],
            "firstName": employee['firstname'],
            "lastName": employee['lastname'],
            "authLevel": employee['authlevel'],
            "startDate": employee['startdate']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ================== MANAGEMENT APIs ==================

@app.get("/api/management/dashboard")
def get_management_dashboard():
    """Get management dashboard data"""
    try:
        # Today's sales
        today_sales_query = """
            SELECT 
                SUM(s.amountSold * COALESCE(m.price, a.price)) as revenue, 
                COUNT(*) as transactions
            FROM sales s
            LEFT JOIN menu m ON s.itemName = m.menuItemName
            LEFT JOIN addOns a ON s.itemName = a.addOnName
            WHERE s.date = CURRENT_DATE
        """
        today = execute_query(today_sales_query, fetch_one=True)
        
        # Low stock items
        low_stock_query = "SELECT COUNT(*) as count FROM inventory WHERE quantity < 10"
        low_stock = execute_query(low_stock_query, fetch_one=True)
        
        # Recent transactions
        recent_trans_query = """
            SELECT transactionId, date, time, customerId, transactionType
            FROM transactions
            ORDER BY date DESC, time DESC
            LIMIT 10
        """
        recent_transactions = execute_query(recent_trans_query)
        
        # Top selling items today
        top_items_query = """
            SELECT s.itemName, SUM(s.amountSold) as quantity
            FROM sales s
            WHERE s.date = CURRENT_DATE
            GROUP BY s.itemName
            ORDER BY quantity DESC
            LIMIT 5
        """
        top_items = execute_query(top_items_query)
        
        return {
            "todaySales": float(today['revenue']) if today and today['revenue'] else 0.0,
            "todayTransactions": int(today['transactions']) if today else 0,
            "lowStockItems": int(low_stock['count']) if low_stock else 0,
            "recentTransactions": [dict(t) for t in recent_transactions] if recent_transactions else [],
            "topSellingItems": [dict(t) for t in top_items] if top_items else []
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

