"""
Load data from CSV files into PostgreSQL database
This script loads all CSV data into the database tables
"""
import csv
import json
import psycopg2
import os
import sys

# Add parent directory to path to import config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DB_CONFIG

# Get the data directory path
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')

def load_customer_rewards(cursor):
    """Load customer rewards from CSV"""
    print("Loading customerRewards...")
    with open(os.path.join(DATA_DIR, 'customerRewards.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            cursor.execute("""
                INSERT INTO customerRewards 
                (customerId, firstName, lastName, DOB, phoneNumber, email, points, dateJoined)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (customerId) DO NOTHING
            """, (
                int(row['customerId']),
                row['firstName'],
                row['lastName'],
                row['DOB'],
                row['phoneNumber'],
                row['email'],
                int(row['points']),
                row['dateJoined']
            ))
            count += 1
        print(f"  Loaded {count} customers")

def load_employees(cursor):
    """Load employees from CSV"""
    print("Loading employees...")
    with open(os.path.join(DATA_DIR, 'employees.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            cursor.execute("""
                INSERT INTO employees 
                (employeeId, firstName, lastName, authLevel, startDate)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (employeeId) DO NOTHING
            """, (
                int(row['employeeId']),
                row['firstName'],
                row['lastName'],
                row['authLevel'],
                row['startDate']
            ))
            count += 1
        print(f"  Loaded {count} employees")

def load_inventory(cursor):
    """Load inventory from CSV"""
    print("Loading inventory...")
    with open(os.path.join(DATA_DIR, 'inventory.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            cursor.execute("""
                INSERT INTO inventory 
                (itemId, itemName, quantity)
                VALUES (%s, %s, %s)
                ON CONFLICT (itemId) DO NOTHING
            """, (
                int(row['itemId']),
                row['itemName'],
                float(row['quantity'])
            ))
            count += 1
        print(f"  Loaded {count} inventory items")

def load_menu(cursor):
    """Load menu from CSV (handles JSONB ingredients)"""
    print("Loading menu...")
    with open(os.path.join(DATA_DIR, 'menu.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            # Parse ingredients JSON string
            ingredients_str = row['ingredients']
            try:
                # If it's already a JSON string, parse it
                if isinstance(ingredients_str, str):
                    ingredients = json.loads(ingredients_str)
                else:
                    ingredients = ingredients_str
            except json.JSONDecodeError:
                print(f"  Warning: Invalid JSON in ingredients for menuItemId {row['menuItemId']}")
                continue
            
            cursor.execute("""
                INSERT INTO menu 
                (menuItemId, menuItemName, price, ingredients)
                VALUES (%s, %s, %s, %s::jsonb)
                ON CONFLICT (menuItemId) DO NOTHING
            """, (
                int(row['menuItemId']),
                row['menuItemName'],
                float(row['price']),
                json.dumps(ingredients)
            ))
            count += 1
        print(f"  Loaded {count} menu items")
        
def load_add_ons(cursor):
    """Load add-ons from CSV (handles JSONB ingredients)"""
    print("Loading add-ons...")
    with open(os.path.join(DATA_DIR, 'addOns.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            # Parse ingredients JSON string
            ingredients_str = row['ingredients']
            try:
                # If it's already a JSON string, parse it
                if isinstance(ingredients_str, str):
                    ingredients = json.loads(ingredients_str)
                else:
                    ingredients = ingredients_str
            except json.JSONDecodeError:
                print(f"  Warning: Invalid JSON in ingredients for addOnID {row['addOnID']}")
                continue
            
            cursor.execute("""
                INSERT INTO addOns 
                (addOnID, addOnName, price, ingredients)
                VALUES (%s, %s, %s, %s::jsonb)
                ON CONFLICT (addOnID) DO NOTHING
            """, (
                int(row['addOnID']),
                row['addOnName'],
                float(row['price']),
                json.dumps(ingredients)
            ))

            count += 1

        print(f"  Loaded {count} add-on items")

def load_sales(cursor):
    """Load sales from CSV"""
    print("Loading sales...")
    with open(os.path.join(DATA_DIR, 'sales.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        batch = []
        for row in reader:
            batch.append((
                int(row['saleId']),
                row['itemName'],
                int(row['amountSold']),
                row['date'],
                row['time']
            ))
            count += 1
            
            # Insert in batches for performance
            if len(batch) >= 1000:
                cursor.executemany("""
                    INSERT INTO sales 
                    (saleId, itemName, amountSold, date, time)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (saleId) DO NOTHING
                """, batch)
                batch = []
        
        # Insert remaining
        if batch:
            cursor.executemany("""
                INSERT INTO sales 
                (saleId, itemName, amountSold, date, time)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (saleId) DO NOTHING
            """, batch)
        print(f"  Loaded {count} sales records")

def load_transactions(cursor):
    """Load transactions from CSV (handles JSONB items)"""
    print("Loading transactions...")
    with open(os.path.join(DATA_DIR, 'transactions.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        batch = []
        for row in reader:
            # Parse items JSON string
            items_str = row['items']
            try:
                if isinstance(items_str, str):
                    items = json.loads(items_str)
                else:
                    items = items_str
            except json.JSONDecodeError:
                print(f"  Warning: Invalid JSON in items for transactionId {row['transactionId']}")
                continue
            
            # Handle customerId (can be empty/null)
            customer_id = int(row['customerId']) if row['customerId'] else None
            
            batch.append((
                int(row['transactionId']),
                row['date'],
                customer_id,
                json.dumps(items),
                row['time'],
                row['transactionType']
            ))
            count += 1
            
            # Insert in batches for performance
            if len(batch) >= 1000:
                cursor.executemany("""
                    INSERT INTO transactions 
                    (transactionId, date, customerId, items, time, transactionType)
                    VALUES (%s, %s, %s, %s::jsonb, %s, %s)
                    ON CONFLICT (transactionId) DO NOTHING
                """, batch)
                batch = []
        
        # Insert remaining
        if batch:
            cursor.executemany("""
                INSERT INTO transactions 
                (transactionId, date, customerId, items, time, transactionType)
                VALUES (%s, %s, %s, %s::jsonb, %s, %s)
                ON CONFLICT (transactionId) DO NOTHING
            """, batch)
        print(f"  Loaded {count} transactions")

def verify_data(cursor):
    """Verify data was loaded correctly"""
    print("\n" + "="*50)
    print("Data Verification:")
    print("="*50)
    
    tables = [
        'customerRewards',
        'employees',
        'inventory',
        'menu',
        'sales',
        'transactions'
    ]
    
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"  {table}: {count} records")

def main():
    """Main function to load all data"""
    print("="*50)
    print("Loading Data from CSV Files")
    print("="*50)
    print()
    
    # Check if CSV files exist
    csv_files = [
        'customerRewards.csv',
        'employees.csv',
        'inventory.csv',
        'menu.csv',
        'sales.csv',
        'transactions.csv'
    ]
    
    missing_files = [f for f in csv_files if not os.path.exists(os.path.join(DATA_DIR, f))]
    if missing_files:
        print("❌ Error: Missing CSV files:")
        for f in missing_files:
            print(f"  - {f}")
        print("\nPlease make sure all CSV files are in the backend directory")
        return
    
    try:
        # Connect to database
        print("Connecting to database...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✅ Connected!\n")
        
        # Load data in correct order (respecting foreign keys)
        load_customer_rewards(cursor)
        load_employees(cursor)
        load_inventory(cursor)
        load_menu(cursor)
        load_sales(cursor)
        load_transactions(cursor)
        
        # Commit all changes
        conn.commit()
        
        # Verify data
        verify_data(cursor)
        
        print("\n" + "="*50)
        print("✅ Data loading completed successfully!")
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    main()

