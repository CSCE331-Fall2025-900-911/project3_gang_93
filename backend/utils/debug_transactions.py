"""
Debug script to check transaction structure and see why they might be missing from reports
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_cursor
from datetime import date

def debug_transactions():
    """Check transaction structure and menu item matching"""
    print("=" * 60)
    print("TRANSACTION DEBUG")
    print("=" * 60)
    
    with get_db_cursor() as cursor:
        # Get all transactions for today
        today = date(2025, 11, 24)
        cursor.execute("""
            SELECT transactionId, date, time, transactionType, items
            FROM transactions 
            WHERE date = %s
            ORDER BY transactionId
        """, (today,))
        
        transactions = cursor.fetchall()
        print(f"\n📊 Found {len(transactions)} transactions for {today}")
        
        for trans in transactions:
            print(f"\n🔍 Transaction ID: {trans['transactionid']}")
            print(f"   Type: {trans['transactiontype']}")
            print(f"   Date: {trans['date']}")
            print(f"   Time: {trans['time']}")
            print(f"   Items JSON: {trans['items']}")
            
            # Try to parse items
            import json
            items_data = trans['items']
            if isinstance(items_data, str):
                items_data = json.loads(items_data)
            
            if 'items' in items_data:
                menu_item_ids = [item.get('menuItemId') for item in items_data['items']]
                print(f"   Menu Item IDs: {menu_item_ids}")
                
                # Check if these menu items exist
                if menu_item_ids:
                    placeholders = ','.join(['%s'] * len(menu_item_ids))
                    cursor.execute(f"""
                        SELECT menuItemId, menuItemName, price
                        FROM menu 
                        WHERE menuItemId IN ({placeholders})
                    """, tuple(menu_item_ids))
                    menu_items = cursor.fetchall()
                    print(f"   Found {len(menu_items)} matching menu items:")
                    for mi in menu_items:
                        print(f"      - ID {mi['menuitemid']}: {mi['menuitemname']} (${mi['price']})")
                    
                    # Check which items are missing
                    found_ids = {mi['menuitemid'] for mi in menu_items}
                    missing_ids = set(menu_item_ids) - found_ids
                    if missing_ids:
                        print(f"   ⚠️  Missing menu items: {missing_ids}")
            
            # Test the totals query for this transaction
            cursor.execute("""
                SELECT
                    (SELECT SUM(m.price * (item->>'quantity')::int)
                     FROM jsonb_array_elements(%s::jsonb->'items') AS item
                     JOIN menu m ON (item->>'menuItemId')::int = m.menuItemId)
                    + COALESCE((%s::jsonb->>'tip')::numeric, 0)
                as calculated_total
            """, (json.dumps(items_data), json.dumps(items_data)))
            
            result = cursor.fetchone()
            calculated = result['calculated_total'] if result else None
            print(f"   Calculated Total: ${calculated if calculated else 'NULL'}")
        
        # Test the full totals query
        print(f"\n🧪 Testing Full Totals Query:")
        cursor.execute("""
            SELECT
                COUNT(*) as total_count,
                COUNT(CASE WHEN transactionType != 'void' THEN 1 END) as non_void_count,
                SUM(
                    (SELECT SUM(m.price * (item->>'quantity')::int)
                     FROM jsonb_array_elements(t.items->'items') AS item
                     JOIN menu m ON (item->>'menuItemId')::int = m.menuItemId)
                    + COALESCE((t.items->>'tip')::numeric, 0)
                ) as total_sales
            FROM transactions t
            WHERE t.date = %s AND t.transactionType != 'void'
        """, (today,))
        
        result = cursor.fetchone()
        print(f"   Total Count: {result['total_count']}")
        print(f"   Non-Void Count: {result['non_void_count']}")
        print(f"   Calculated Total Sales: ${result['total_sales'] if result['total_sales'] else 'NULL'}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    try:
        debug_transactions()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

