"""
Check the new transaction structure with add-ons
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_cursor

def check_structure():
    """Check transaction structure"""
    print("=" * 60)
    print("TRANSACTION STRUCTURE CHECK")
    print("=" * 60)
    
    with get_db_cursor() as cursor:
        # Get recent transactions
        cursor.execute("""
            SELECT transactionId, date, time, transactionType, items
            FROM transactions 
            ORDER BY transactionId DESC
            LIMIT 5
        """)
        
        transactions = cursor.fetchall()
        print(f"\nFound {len(transactions)} recent transactions")
        
        for trans in transactions:
            import json
            print(f"\nTransaction {trans['transactionid']}:")
            items_data = trans['items']
            
            if isinstance(items_data, str):
                items_data = json.loads(items_data)
            
            print(f"  Type: {type(items_data)}")
            print(f"  Structure: {json.dumps(items_data, indent=2)[:500]}")
            
            # Check for add-ons
            if isinstance(items_data, dict):
                if 'items' in items_data:
                    items_list = items_data['items']
                    print(f"  Items count: {len(items_list) if isinstance(items_list, list) else 'N/A'}")
                    if isinstance(items_list, list) and len(items_list) > 0:
                        print(f"  First item structure: {json.dumps(items_list[0], indent=2)}")
            elif isinstance(items_data, list):
                print(f"  Items count: {len(items_data)}")
                if len(items_data) > 0:
                    print(f"  First item structure: {json.dumps(items_data[0], indent=2)}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    try:
        check_structure()
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()

