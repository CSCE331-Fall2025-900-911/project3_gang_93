"""
Diagnostic script to check if there's transaction data for reports
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_cursor
from datetime import datetime, date

def check_transaction_data():
    """Check if there are transactions in the database"""
    print("=" * 60)
    print("REPORT DATA DIAGNOSTIC")
    print("=" * 60)
    
    with get_db_cursor() as cursor:
        # Check total transactions
        cursor.execute("SELECT COUNT(*) as count FROM transactions")
        total = cursor.fetchone()
        print(f"\nTotal Transactions in Database: {total['count'] if total else 0}")
        
        # Check transactions by date
        cursor.execute("""
            SELECT date, COUNT(*) as count 
            FROM transactions 
            GROUP BY date 
            ORDER BY date DESC 
            LIMIT 10
        """)
        dates = cursor.fetchall()
        print(f"\nTransactions by Date (last 10 dates):")
        if dates:
            for row in dates:
                print(f"   {row['date']}: {row['count']} transactions")
        else:
            print("   No transactions found!")
        
        # Check today's transactions
        today = datetime.now().date()
        cursor.execute("SELECT COUNT(*) as count FROM transactions WHERE date = %s", (today,))
        today_count = cursor.fetchone()
        print(f"\nToday's Transactions ({today}): {today_count['count'] if today_count else 0}")
        
        # List all transactions for today with details
        cursor.execute("""
            SELECT transactionId, date, time, transactionType, items
            FROM transactions 
            WHERE date = %s
            ORDER BY transactionId
        """, (today,))
        today_trans = cursor.fetchall()
        print(f"\nAll Transactions for {today}:")
        for trans in today_trans:
            print(f"   ID: {trans['transactionid']}, Type: {trans['transactiontype']}, Time: {trans['time']}")
        
        # Check sample transaction structure
        cursor.execute("""
            SELECT transactionId, date, time, transactionType, items
            FROM transactions 
            ORDER BY transactionId DESC 
            LIMIT 1
        """)
        sample = cursor.fetchone()
        if sample:
            print(f"\n🔍 Sample Transaction:")
            print(f"   ID: {sample['transactionid']}")
            print(f"   Date: {sample['date']} (type: {type(sample['date'])})")
            print(f"   Time: {sample['time']}")
            print(f"   Type: {sample['transactiontype']}")
            print(f"   Items: {sample['items']}")
        
        # Check sales table
        cursor.execute("SELECT COUNT(*) as count FROM sales")
        sales_total = cursor.fetchone()
        print(f"\n💰 Total Sales Records: {sales_total['count'] if sales_total else 0}")
        
        cursor.execute("""
            SELECT date, COUNT(*) as count 
            FROM sales 
            GROUP BY date 
            ORDER BY date DESC 
            LIMIT 10
        """)
        sales_dates = cursor.fetchall()
        print(f"\n📅 Sales by Date (last 10 dates):")
        if sales_dates:
            for row in sales_dates:
                print(f"   {row['date']}: {row['count']} sales")
        else:
            print("   No sales records found!")
        
        # Test a specific date query
        test_date = "2025-11-25"
        print(f"\n🧪 Testing Query for Date: {test_date}")
        cursor.execute("SELECT COUNT(*) as count FROM transactions WHERE date = %s", (test_date,))
        test_result = cursor.fetchone()
        print(f"   Transactions found: {test_result['count'] if test_result else 0}")
        
        if test_result and test_result['count'] > 0:
            # Try to calculate actual totals
            cursor.execute("""
                SELECT
                    SUM(
                        (SELECT SUM(m.price * (item->>'quantity')::int)
                         FROM jsonb_array_elements(t.items->'items') AS item
                         JOIN menu m ON (item->>'menuItemId')::int = m.menuItemId)
                        + COALESCE((t.items->>'tip')::numeric, 0)
                    ) as total_sales
                FROM transactions t
                WHERE t.date = %s AND t.transactionType != 'void'
            """, (test_date,))
            totals = cursor.fetchone()
            print(f"   Calculated Total Sales: ${totals['total_sales'] if totals and totals['total_sales'] else 0.0:.2f}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    try:
        check_transaction_data()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

