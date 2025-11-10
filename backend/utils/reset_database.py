"""
Reset Database Script
This script resets the database by dropping all tables and recreating them
Optionally loads data from CSV files
"""
import psycopg2
import sys
import os

# Add parent directory to path to import config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DB_CONFIG

# Get the queries directory path
QUERIES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'queries')

def reset_schema(cursor):
    """Drop all tables and recreate schema"""
    print("="*50)
    print("Resetting Database Schema")
    print("="*50)
    
    # Read and execute reset schema SQL
    schema_file = os.path.join(QUERIES_DIR, 'reset_schema.sql')
    
    if not os.path.exists(schema_file):
        print(f"❌ Error: {schema_file} not found!")
        return False
    
    print(f"Reading schema from {schema_file}...")
    with open(schema_file, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    
    # Execute SQL statements one by one
    # psycopg2.execute() only handles one statement at a time
    print("Executing schema reset SQL...")
    
    # Parse SQL file into individual statements
    statements = []
    current_statement = []
    
    for line in schema_sql.split('\n'):
        line_stripped = line.strip()
        
        # Skip empty lines and full-line comments
        if not line_stripped or line_stripped.startswith('--'):
            continue
        
        # Remove inline comments (but preserve the line if it has SQL)
        if '--' in line:
            comment_pos = line.find('--')
            # Check if it's not inside a string
            if "'" not in line[:comment_pos] and '"' not in line[:comment_pos]:
                line = line[:comment_pos].strip()
                if not line:
                    continue
        
        # Check for semicolon (end of statement)
        if ';' in line:
            parts = line.split(';', 1)
            current_statement.append(parts[0])
            statement = ' '.join(current_statement).strip()
            if statement:
                statements.append(statement)
            current_statement = []
            if parts[1].strip():
                current_statement.append(parts[1])
        else:
            current_statement.append(line)
    
    # Execute each statement
    executed = 0
    for statement in statements:
        if statement and not statement.startswith('--'):
            try:
                cursor.execute(statement)
                executed += 1
            except psycopg2.Error as e:
                # Ignore expected errors (table doesn't exist, etc.)
                error_msg = str(e)
                if 'does not exist' in error_msg.lower():
                    # This is expected when dropping tables that don't exist
                    pass
                elif 'already exists' in error_msg.lower():
                    # This shouldn't happen, but ignore if it does
                    pass
                else:
                    print(f"  Warning: {error_msg[:150]}")
    
    print(f"✅ Executed {executed} SQL statements")
    print("✅ Schema reset completed!")
    return True

def load_data():
    """Load data from CSV files"""
    print("\n" + "="*50)
    print("Loading Data from CSV")
    print("="*50)
    
    # Import and run the SAFE load script (handles duplicates and foreign key issues)
    try:
        # Add utils to path
        utils_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'utils')
        sys.path.insert(0, utils_dir)
        
        # Try the safe loader first
        try:
            from load_data_safe import main as load_main
            print("Using safe data loader (handles duplicates and constraint violations)")
        except ImportError:
            # Fall back to regular loader
            from load_data_from_csv import main as load_main
            print("Using standard data loader")
    
        load_main()
        return True
    
    except ImportError:
        print("❌ Error: No data loader found!")
        print("Please ensure load_data_safe.py or load_data_from_csv.py exists")
        return False
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        return False

def main():
    """Main function"""
    load_data_option = '--load-data' in sys.argv or '-l' in sys.argv
    
    print("\n" + "="*50)
    print("Database Reset Script")
    print("="*50)
    print("\n⚠️  WARNING: This will DELETE ALL DATA in the database!")
    
    if not load_data_option:
        response = input("\nDo you want to continue? (yes/no): ")
        if response.lower() != 'yes':
            print("Cancelled.")
            return
    else:
        print("\nProceeding with reset and data load...")
    
    try:
        # Connect to database
        print("\nConnecting to database...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True  # Enable autocommit for DDL statements
        cursor = conn.cursor()
        print("✅ Connected!\n")
        
        # Reset schema
        if not reset_schema(cursor):
            print("❌ Failed to reset schema")
            return
        
        # Load data if requested
        if load_data_option:
            conn.autocommit = False  # Disable autocommit for data loading
            if load_data():
                conn.commit()
                print("\n✅ Database reset and data load completed!")
            else:
                conn.rollback()
                print("\n❌ Database reset completed but data load failed")
        else:
            print("\n✅ Database reset completed!")
            print("💡 Tip: Run 'python load_data_from_csv.py' to load data from CSV files")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        if 'conn' in locals():
            conn.rollback()
        raise
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    print("\nUsage:")
    print("  python reset_database.py          # Reset schema only")
    print("  python reset_database.py --load-data  # Reset schema and load data")
    print()
    main()

