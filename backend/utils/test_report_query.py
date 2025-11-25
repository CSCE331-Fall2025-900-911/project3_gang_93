"""
Test the actual report query to see what it returns
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_cursor
from datetime import date

def test_report_query():
    """Test the exact query used in reports"""
    print("=" * 60)
    print("REPORT QUERY TEST")
    print("=" * 60)
    
    with get_db_cursor() as cursor:
        report_date = "2025-11-24"
        
        # Test the exact query from X-Report
        query = """
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
        """
        
        print(f"\nTesting query for date: {report_date}")
        try:
            cursor.execute(query, (report_date,))
            result = cursor.fetchone()
            print(f"Query Result: ${result['total_sales'] if result and result['total_sales'] else 0.0:.2f}")
        except Exception as e:
            print(f"Query Error: {e}")
            import traceback
            traceback.print_exc()
        
        # Test per-transaction to see which ones are being counted
        print(f"\nPer-Transaction Breakdown:")
        cursor.execute("""
            SELECT
                t.transactionId,
                jsonb_typeof(t.items) as items_type,
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
                ) as transaction_total
            FROM transactions t
            WHERE t.date = %s AND t.transactionType != 'void'
            ORDER BY t.transactionId
        """, (report_date,))
        
        per_trans = cursor.fetchall()
        total = 0.0
        for row in per_trans:
            trans_total = float(row['transaction_total']) if row['transaction_total'] else 0.0
            total += trans_total
            print(f"  Transaction {row['transactionid']} ({row['items_type']}): ${trans_total:.2f}")
        
        print(f"\nSum of Individual Transactions: ${total:.2f}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    try:
        test_report_query()
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()

