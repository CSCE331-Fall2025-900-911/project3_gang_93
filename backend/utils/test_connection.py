"""
Test database connection
Run this to verify your database configuration is correct
"""
import sys
import os

# Add parent directory to path to import config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DB_CONFIG

def test_connection():
    """Test PostgreSQL connection"""
    try:
        import psycopg2
        print("🔌 Testing database connection...")
        print(f"Host: {DB_CONFIG['host']}")
        print(f"Database: {DB_CONFIG['dbname']}")
        print(f"User: {DB_CONFIG['user']}")
        print()
        
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Test query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        
        print("✅ Connection successful!")
        print(f"PostgreSQL version: {version[0][:50]}...")
        
        # Check tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        tables = cursor.fetchall()
        
        print(f"\n📊 Found {len(tables)} tables:")
        for table in tables:
            print(f"  - {table[0]}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except ImportError:
        print("❌ psycopg2 not installed")
        print("Install it with: pip install psycopg2-binary")
        return False
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\nCheck your .env file and database credentials")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)

