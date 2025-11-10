"""
Safe data loader from CSV files with error handling
This script loads data with proper error handling for duplicates and constraint violations
"""
import csv
import json
import psycopg2
from psycopg2 import errors
import os
import sys

# Add parent directory to path to import config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DB_CONFIG

# Get the data directory path
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')

def load_customer_rewards(cursor):
    """Load customer rewards from CSV with duplicate handling"""
    print("Loading customerRewards...")
    with open(os.path.join(DATA_DIR, 'customerRewards.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        skipped = 0
        for row in reader:
            try:
                cursor.execute("""
                    INSERT INTO customerRewards 
                    (customerId, firstName, lastName, DOB, phoneNumber, email, points, dateJoined)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
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
            except errors.UniqueViolation as e:
                skipped += 1
                print(f"  ⚠️  Skipped duplicate: customerId={row['customerId']}, email={row['email']}")
                cursor.connection.rollback()
            except Exception as e:
                print(f"  ❌ Error on customerId {row['customerId']}: {e}")
                cursor.connection.rollback()
        
        print(f"  ✅ Loaded {count} customers, skipped {skipped} duplicates")

def load_employees(cursor):
    """Load employees from CSV"""
    print("Loading employees...")
    with open(os.path.join(DATA_DIR, 'employees.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        skipped = 0
        for row in reader:
            try:
                cursor.execute("""
                    INSERT INTO employees 
                    (employeeId, firstName, lastName, authLevel, startDate)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    int(row['employeeId']),
                    row['firstName'],
                    row['lastName'],
                    row['authLevel'],
                    row['startDate']
                ))
                count += 1
            except errors.UniqueViolation:
                skipped += 1
                cursor.connection.rollback()
            except Exception as e:
                print(f"  ❌ Error on employeeId {row['employeeId']}: {e}")
                cursor.connection.rollback()
        
        print(f"  ✅ Loaded {count} employees, skipped {skipped} duplicates")

def load_inventory(cursor):
    """Load inventory from CSV"""
    print("Loading inventory...")
    with open(os.path.join(DATA_DIR, 'inventory.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        skipped = 0
        for row in reader:
            try:
                cursor.execute("""
                    INSERT INTO inventory 
                    (itemId, itemName, quantity)
                    VALUES (%s, %s, %s)
                """, (
                    int(row['itemId']),
                    row['itemName'],
                    float(row['quantity'])
                ))
                count += 1
            except errors.UniqueViolation:
                skipped += 1
                cursor.connection.rollback()
            except Exception as e:
                print(f"  ❌ Error on itemId {row['itemId']}: {e}")
                cursor.connection.rollback()
        
        print(f"  ✅ Loaded {count} inventory items, skipped {skipped} duplicates")

def load_menu(cursor):
    """Load menu from CSV (handles JSONB ingredients)"""
    print("Loading menu...")
    with open(os.path.join(DATA_DIR, 'menu.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        skipped = 0
        for row in reader:
            # Parse ingredients JSON string
            ingredients_str = row['ingredients']
            try:
                if isinstance(ingredients_str, str):
                    ingredients = json.loads(ingredients_str)
                else:
                    ingredients = ingredients_str
            except json.JSONDecodeError:
                print(f"  ⚠️  Invalid JSON in ingredients for menuItemId {row['menuItemId']}")
                continue
            
            try:
                cursor.execute("""
                    INSERT INTO menu 
                    (menuItemId, menuItemName, price, ingredients)
                    VALUES (%s, %s, %s, %s::jsonb)
                """, (
                    int(row['menuItemId']),
                    row['menuItemName'],
                    float(row['price']),
                    json.dumps(ingredients)
                ))
                count += 1
            except errors.UniqueViolation:
                skipped += 1
                print(f"  ⚠️  Skipped duplicate: menuItemId={row['menuItemId']}")
                cursor.connection.rollback()
            except Exception as e:
                print(f"  ❌ Error on menuItemId {row['menuItemId']}: {e}")
                cursor.connection.rollback()
        
        print(f"  ✅ Loaded {count} menu items, skipped {skipped} duplicates")

def load_sales(cursor):
    """Load sales from CSV"""
    print("Loading sales (this may take a while)...")
    with open(os.path.join(DATA_DIR, 'sales.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        skipped = 0
        batch = []
        batch_size = 1000
        
        for row in reader:
            batch.append((
                int(row['saleId']),
                row['itemName'],
                int(row['amountSold']),
                row['date'],
                row['time']
            ))
            
            # Insert in batches for performance
            if len(batch) >= batch_size:
                try:
                    cursor.executemany("""
                        INSERT INTO sales 
                        (saleId, itemName, amountSold, date, time)
                        VALUES (%s, %s, %s, %s, %s)
                    """, batch)
                    count += len(batch)
                    cursor.connection.commit()
                    print(f"  ... loaded {count} sales")
                except Exception as e:
                    # If batch fails, try one by one
                    cursor.connection.rollback()
                    for record in batch:
                        try:
                            cursor.execute("""
                                INSERT INTO sales 
                                (saleId, itemName, amountSold, date, time)
                                VALUES (%s, %s, %s, %s, %s)
                            """, record)
                            count += 1
                        except errors.UniqueViolation:
                            skipped += 1
                            cursor.connection.rollback()
                        except Exception as e2:
                            skipped += 1
                            cursor.connection.rollback()
                    cursor.connection.commit()
                batch = []
        
        # Insert remaining
        if batch:
            try:
                cursor.executemany("""
                    INSERT INTO sales 
                    (saleId, itemName, amountSold, date, time)
                    VALUES (%s, %s, %s, %s, %s)
                """, batch)
                count += len(batch)
                cursor.connection.commit()
            except Exception:
                cursor.connection.rollback()
                for record in batch:
                    try:
                        cursor.execute("""
                            INSERT INTO sales 
                            (saleId, itemName, amountSold, date, time)
                            VALUES (%s, %s, %s, %s, %s)
                        """, record)
                        count += 1
                    except:
                        skipped += 1
                        cursor.connection.rollback()
                cursor.connection.commit()
        
        print(f"  ✅ Loaded {count} sales records, skipped {skipped} duplicates/errors")

def load_transactions(cursor):
    """Load transactions from CSV (handles JSONB items and foreign key violations)"""
    print("Loading transactions (this may take a while)...")
    
    # First, get list of valid customer IDs
    cursor.execute("SELECT customerId FROM customerRewards")
    valid_customer_ids = set(row[0] for row in cursor.fetchall())
    print(f"  Found {len(valid_customer_ids)} valid customer IDs (range: {min(valid_customer_ids)}-{max(valid_customer_ids)})")
    
    with open(os.path.join(DATA_DIR, 'transactions.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        skipped = 0
        fk_violations = 0
        batch = []
        batch_size = 1000
        
        for row in reader:
            # Parse items JSON string
            items_str = row['items']
            try:
                if isinstance(items_str, str):
                    items = json.loads(items_str)
                else:
                    items = items_str
            except json.JSONDecodeError:
                print(f"  ⚠️  Invalid JSON in items for transactionId {row['transactionId']}")
                skipped += 1
                continue
            
            # Handle customerId (can be empty/null or invalid)
            customer_id_str = row['customerId'].strip() if row['customerId'] else None
            if customer_id_str:
                customer_id = int(customer_id_str)
                # Check if customer ID is valid, if not set to NULL
                if customer_id not in valid_customer_ids:
                    customer_id = None
                    fk_violations += 1
            else:
                customer_id = None
            
            batch.append((
                int(row['transactionId']),
                row['date'],
                customer_id,
                json.dumps(items),
                row['time'],
                row['transactionType']
            ))
            
            # Insert in batches for performance
            if len(batch) >= batch_size:
                try:
                    cursor.executemany("""
                        INSERT INTO transactions 
                        (transactionId, date, customerId, items, time, transactionType)
                        VALUES (%s, %s, %s, %s::jsonb, %s, %s)
                    """, batch)
                    count += len(batch)
                    cursor.connection.commit()
                    print(f"  ... loaded {count} transactions")
                except Exception as e:
                    # If batch fails, try one by one
                    cursor.connection.rollback()
                    for record in batch:
                        try:
                            cursor.execute("""
                                INSERT INTO transactions 
                                (transactionId, date, customerId, items, time, transactionType)
                                VALUES (%s, %s, %s, %s::jsonb, %s, %s)
                            """, record)
                            count += 1
                        except errors.UniqueViolation:
                            skipped += 1
                            cursor.connection.rollback()
                        except errors.ForeignKeyViolation:
                            # Set customerId to NULL and retry
                            fk_violations += 1
                            record_fixed = (record[0], record[1], None, record[3], record[4], record[5])
                            try:
                                cursor.execute("""
                                    INSERT INTO transactions 
                                    (transactionId, date, customerId, items, time, transactionType)
                                    VALUES (%s, %s, %s, %s::jsonb, %s, %s)
                                """, record_fixed)
                                count += 1
                            except:
                                skipped += 1
                                cursor.connection.rollback()
                        except Exception as e2:
                            skipped += 1
                            cursor.connection.rollback()
                    cursor.connection.commit()
                batch = []
        
        # Insert remaining
        if batch:
            try:
                cursor.executemany("""
                    INSERT INTO transactions 
                    (transactionId, date, customerId, items, time, transactionType)
                    VALUES (%s, %s, %s, %s::jsonb, %s, %s)
                """, batch)
                count += len(batch)
                cursor.connection.commit()
            except Exception:
                cursor.connection.rollback()
                for record in batch:
                    try:
                        cursor.execute("""
                            INSERT INTO transactions 
                            (transactionId, date, customerId, items, time, transactionType)
                            VALUES (%s, %s, %s, %s::jsonb, %s, %s)
                        """, record)
                        count += 1
                    except:
                        skipped += 1
                        cursor.connection.rollback()
                cursor.connection.commit()
        
        print(f"  ✅ Loaded {count} transactions")
        if fk_violations > 0:
            print(f"  ⚠️  {fk_violations} transactions had invalid customer IDs (set to NULL)")
        if skipped > 0:
            print(f"  ⚠️  Skipped {skipped} duplicates/errors")

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
        print(f"  {table}: {count:,} records")

def main():
    """Main function to load all data"""
    print("="*50)
    print("Safe Data Loading from CSV Files")
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
        conn.autocommit = False  # Use manual transaction control
        cursor = conn.cursor()
        print("✅ Connected!\n")
        
        # Load data in correct order (respecting foreign keys)
        load_customer_rewards(cursor)
        conn.commit()
        
        load_employees(cursor)
        conn.commit()
        
        load_inventory(cursor)
        conn.commit()
        
        load_menu(cursor)
        conn.commit()
        
        load_sales(cursor)
        # Already committed in batches
        
        load_transactions(cursor)
        # Already committed in batches
        
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

