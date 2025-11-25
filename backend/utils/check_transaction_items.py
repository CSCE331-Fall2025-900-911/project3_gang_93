"""
Check transaction items structure to see why they show 0 items
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_cursor
from datetime import date
import json

def check_items():
    """Check transaction items structure"""
    print("=" * 60)
    print("TRANSACTION ITEMS STRUCTURE CHECK")
    print("=" * 60)
    
    with get_db_cursor() as cursor:
        today = date(2025, 11, 24)
        cursor.execute("""
            SELECT transactionId, items
            FROM transactions 
            WHERE date = %s
            ORDER BY transactionId
        """, (today,))
        
        transactions = cursor.fetchall()
        
        for trans in transactions:
            print(f"\nTransaction {trans['transactionid']}:")
            items_data = trans['items']
            
            # Check type
            print(f"  Items type: {type(items_data)}")
            
            # Parse if string
            if isinstance(items_data, str):
                try:
                    items_data = json.loads(items_data)
                except:
                    print(f"  ERROR: Could not parse JSON")
                    print(f"  Raw: {items_data[:200]}")
                    continue
            
            # Check structure
            print(f"  Items data: {items_data}")
            
            if isinstance(items_data, dict):
                if 'items' in items_data:
                    items_list = items_data['items']
                    print(f"  Items list: {items_list}")
                    print(f"  Items count: {len(items_list) if isinstance(items_list, list) else 'N/A'}")
                else:
                    print(f"  WARNING: No 'items' key in dict")
                    print(f"  Keys: {items_data.keys()}")
            else:
                print(f"  WARNING: Items is not a dict, it's {type(items_data)}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    try:
        check_items()
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()

