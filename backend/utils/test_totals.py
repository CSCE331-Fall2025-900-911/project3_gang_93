"""
Test to compare dashboard totals vs report totals
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_cursor
from datetime import date

def test_totals():
    """Compare dashboard and report calculation methods"""
    print("=" * 60)
    print("TOTALS COMPARISON TEST")
    print("=" * 60)
    
    with get_db_cursor() as cursor:
        today = date(2025, 11, 24)
        
        # Method 1: Dashboard method (using sales table)
        print(f"\nMethod 1: Dashboard (using sales table)")
        cursor.execute("""
            SELECT SUM(s.amountSold * m.price) as revenue, COUNT(*) as count
            FROM sales s
            JOIN menu m ON s.itemName = m.menuItemName
            WHERE s.date = %s
        """, (today,))
        
        sales_result = cursor.fetchone()
        print(f"  Total Revenue: ${sales_result['revenue'] if sales_result['revenue'] else 0.0:.2f}")
        print(f"  Sales Records: {sales_result['count'] if sales_result else 0}")
        
        # Method 2: Report method (using transactions table - new format)
        print(f"\nMethod 2: Reports (using transactions table - new format)")
        cursor.execute("""
            SELECT
                SUM(
                    COALESCE(
                        (SELECT SUM(m.price * (item->>'quantity')::int)
                         FROM jsonb_array_elements(t.items->'items') AS item
                         LEFT JOIN menu m ON (item->>'menuItemId')::int = m.menuItemId
                         WHERE m.menuItemId IS NOT NULL),
                        0
                    ) + COALESCE((t.items->>'tip')::numeric, 0)
                ) as total_sales
            FROM transactions t
            WHERE t.date = %s AND t.transactionType != 'void'
        """, (today,))
        
        trans_new = cursor.fetchone()
        print(f"  Total Revenue (new format only): ${trans_new['total_sales'] if trans_new['total_sales'] else 0.0:.2f}")
        
        # Method 3: Report method (using transactions table - both formats)
        print(f"\nMethod 3: Reports (using transactions table - both formats)")
        cursor.execute("""
            SELECT
                SUM(
                    COALESCE(
                        (SELECT SUM(m.price * (item->>'quantity')::int)
                         FROM jsonb_array_elements(
                             CASE 
                                 WHEN jsonb_typeof(t.items) = 'array' THEN t.items
                                 ELSE t.items->'items'
                             END
                         ) AS item
                         LEFT JOIN menu m ON (item->>'menuItemId')::int = m.menuItemId
                         WHERE m.menuItemId IS NOT NULL),
                        0
                    ) + COALESCE(
                        CASE 
                            WHEN jsonb_typeof(t.items) = 'object' THEN (t.items->>'tip')::numeric
                            ELSE 0
                        END, 0
                    )
                ) as total_sales
            FROM transactions t
            WHERE t.date = %s AND t.transactionType != 'void'
        """, (today,))
        
        trans_both = cursor.fetchone()
        print(f"  Total Revenue (both formats): ${trans_both['total_sales'] if trans_both['total_sales'] else 0.0:.2f}")
        
        # Method 4: Manual calculation per transaction
        print(f"\nMethod 4: Manual calculation per transaction")
        cursor.execute("""
            SELECT transactionId, items, transactionType
            FROM transactions
            WHERE date = %s AND transactionType != 'void'
            ORDER BY transactionId
        """, (today,))
        
        transactions = cursor.fetchall()
        total_manual = 0.0
        for trans in transactions:
            import json
            items_data = trans['items']
            if isinstance(items_data, str):
                items_data = json.loads(items_data)
            
            # Get items list
            if isinstance(items_data, list):
                items_list = items_data
                tip = 0
            elif isinstance(items_data, dict) and 'items' in items_data:
                items_list = items_data['items']
                tip = float(items_data.get('tip', 0) or 0)
            else:
                items_list = []
                tip = 0
            
            # Calculate total for this transaction
            trans_total = 0.0
            for item in items_list:
                menu_item_id = item.get('menuItemId')
                quantity = item.get('quantity', 0)
                
                if menu_item_id:
                    cursor.execute("SELECT price FROM menu WHERE menuItemId = %s", (menu_item_id,))
                    menu_item = cursor.fetchone()
                    if menu_item:
                        trans_total += float(menu_item['price']) * quantity
            
            trans_total += tip
            total_manual += trans_total
            print(f"  Transaction {trans['transactionid']}: ${trans_total:.2f} ({len(items_list)} items, tip: ${tip:.2f})")
        
        print(f"  Manual Total: ${total_manual:.2f}")
        
        # Show discrepancy
        print(f"\nComparison:")
        sales_total = float(sales_result['revenue']) if sales_result['revenue'] else 0.0
        trans_total = float(trans_both['total_sales']) if trans_both['total_sales'] else 0.0
        print(f"  Sales Table Total: ${sales_total:.2f}")
        print(f"  Transactions Table Total: ${trans_total:.2f}")
        print(f"  Manual Calculation: ${total_manual:.2f}")
        print(f"  Difference: ${abs(sales_total - trans_total):.2f}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    try:
        test_totals()
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()

