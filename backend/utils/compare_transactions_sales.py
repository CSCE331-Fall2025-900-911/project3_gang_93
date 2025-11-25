"""
Compare transactions and sales to see the relationship
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_cursor
from datetime import date

def compare_data():
    """Compare transactions and sales data"""
    print("=" * 60)
    print("TRANSACTIONS vs SALES COMPARISON")
    print("=" * 60)
    
    with get_db_cursor() as cursor:
        # Check transactions
        today = date(2025, 11, 24)
        cursor.execute("""
            SELECT transactionId, date, time, transactionType, items
            FROM transactions 
            WHERE date = %s
            ORDER BY transactionId
        """, (today,))
        
        transactions = cursor.fetchall()
        print(f"\nTransactions for {today}: {len(transactions)}")
        
        # Check sales
        cursor.execute("""
            SELECT saleId, itemName, amountSold, date, time
            FROM sales 
            WHERE date = %s
            ORDER BY saleId
        """, (today,))
        
        sales = cursor.fetchall()
        print(f"Sales records for {today}: {len(sales)}")
        
        # Count distinct transaction times in sales (to see if sales represent more transactions)
        cursor.execute("""
            SELECT COUNT(DISTINCT time) as distinct_times,
                   COUNT(*) as total_sales
            FROM sales 
            WHERE date = %s
        """, (today,))
        
        sales_stats = cursor.fetchone()
        print(f"\nSales Statistics:")
        print(f"  Distinct times: {sales_stats['distinct_times']}")
        print(f"  Total sales records: {sales_stats['total_sales']}")
        
        # Show transaction details
        print(f"\nTransaction Details:")
        for trans in transactions:
            import json
            items_data = trans['items']
            if isinstance(items_data, str):
                items_data = json.loads(items_data)
            
            item_count = len(items_data.get('items', [])) if 'items' in items_data else 0
            print(f"  Transaction {trans['transactionid']}: {item_count} items, Type: {trans['transactiontype']}, Time: {trans['time']}")
        
        # Show sales grouped by time
        print(f"\nSales Records Grouped by Time:")
        cursor.execute("""
            SELECT time, COUNT(*) as count, STRING_AGG(itemName, ', ') as items
            FROM sales 
            WHERE date = %s
            GROUP BY time
            ORDER BY time
        """, (today,))
        
        sales_by_time = cursor.fetchall()
        for row in sales_by_time:
            print(f"  {row['time']}: {row['count']} sales - {row['items']}")
        
        # Check if there are sales without corresponding transactions
        print(f"\nChecking for orphaned sales (sales without transactions):")
        cursor.execute("""
            SELECT DISTINCT s.time, COUNT(*) as sales_count
            FROM sales s
            WHERE s.date = %s
            AND NOT EXISTS (
                SELECT 1 FROM transactions t 
                WHERE t.date = s.date 
                AND ABS(EXTRACT(EPOCH FROM (t.time - s.time))) < 5
            )
            GROUP BY s.time
        """, (today,))
        
        orphaned = cursor.fetchall()
        if orphaned:
            print(f"  Found {len(orphaned)} time slots with sales but no transactions:")
            for row in orphaned:
                print(f"    {row['time']}: {row['sales_count']} sales")
        else:
            print("  No orphaned sales found")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    try:
        compare_data()
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()

