"""
Fix CSV data issues:
1. Find and fix duplicate emails in customerRewards.csv
2. Find and fix invalid customer IDs in transactions.csv
3. Generate fixed CSV files
"""
import csv
import json
import os
from collections import defaultdict

# Get the data directory path
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')

def find_duplicate_emails():
    """Find all duplicate emails in customerRewards.csv"""
    print("Scanning customerRewards.csv for duplicate emails...")
    emails = defaultdict(list)
    
    with open(os.path.join(DATA_DIR, 'customerRewards.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=2):  # Start at 2 (line 1 is header)
            email = row['email'].strip()
            emails[email].append({
                'line': i,
                'customerId': row['customerId'],
                'firstName': row['firstName'],
                'lastName': row['lastName'],
                'email': email,
                'row': row
            })
    
    duplicates = {email: records for email, records in emails.items() if len(records) > 1}
    
    print(f"\nFound {len(duplicates)} duplicate emails:")
    for email, records in duplicates.items():
        print(f"  {email}: {len(records)} occurrences")
        for record in records:
            print(f"    Line {record['line']}: customerId={record['customerId']}, {record['firstName']} {record['lastName']}")
    
    return duplicates

def fix_duplicate_emails(duplicates):
    """Fix duplicate emails by modifying the second occurrence"""
    print("\nFixing duplicate emails...")
    
    # Read all rows
    rows = []
    with open(os.path.join(DATA_DIR, 'customerRewards.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            rows.append(row)
    
    # Fix duplicates - keep first occurrence, fix subsequent ones
    fixed_count = 0
    email_counts = defaultdict(int)
    
    for row in rows:
        email = row['email'].strip()
        if email in duplicates:
            email_counts[email] += 1
            # Keep first occurrence, fix subsequent ones
            if email_counts[email] > 1:
                # Generate new unique email
                base_email = email.split('@')[0]
                domain = email.split('@')[1]
                # Extract number from email if exists, or use customerId
                try:
                    # Try to extract number from email (e.g., "sue.miller65" -> 65)
                    import re
                    match = re.search(r'(\d+)$', base_email)
                    if match:
                        num = int(match.group(1))
                        new_num = num + 100  # Add 100 to make it unique
                        new_base = re.sub(r'\d+$', str(new_num), base_email)
                    else:
                        # No number found, use customerId
                        new_base = f"{base_email}{row['customerId']}"
                except:
                    # Fallback: use customerId
                    new_base = f"{base_email}{row['customerId']}"
                
                new_email = f"{new_base}@{domain}"
                row['email'] = new_email
                fixed_count += 1
                print(f"  Fixed line {email_counts[email]}: {email} -> {new_email} (customerId: {row['customerId']})")
    
    # Write fixed CSV
    if fixed_count > 0:
        backup_file = os.path.join(DATA_DIR, 'customerRewards.csv.backup')
        csv_file = os.path.join(DATA_DIR, 'customerRewards.csv')
        print(f"\nCreating backup: {backup_file}")
        os.rename(csv_file, backup_file)
        
        with open(csv_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        
        print(f"[OK] Fixed {fixed_count} duplicate emails")
        print(f"[OK] Original file backed up to {backup_file}")
        return True
    else:
        print("[OK] No duplicates to fix")
        return False

def analyze_transaction_customer_ids():
    """Analyze transactions.csv for invalid customer IDs"""
    print("\n" + "="*50)
    print("Analyzing transactions.csv for invalid customer IDs...")
    
    # First, get valid customer IDs from customerRewards
    valid_customer_ids = set()
    with open(os.path.join(DATA_DIR, 'customerRewards.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            valid_customer_ids.add(int(row['customerId']))
    
    print(f"Valid customer IDs range: {min(valid_customer_ids)} - {max(valid_customer_ids)}")
    print(f"Total valid customer IDs: {len(valid_customer_ids)}")
    
    # Analyze transactions
    invalid_count = 0
    valid_count = 0
    null_count = 0
    invalid_ids = defaultdict(int)
    total_transactions = 0
    
    with open('transactions.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_transactions += 1
            customer_id_str = row['customerId'].strip() if row['customerId'] else None
            
            if not customer_id_str:
                null_count += 1
            else:
                try:
                    customer_id = int(customer_id_str)
                    if customer_id in valid_customer_ids:
                        valid_count += 1
                    else:
                        invalid_count += 1
                        invalid_ids[customer_id] += 1
                except ValueError:
                    invalid_count += 1
                    invalid_ids[customer_id_str] += 1
    
    print(f"\nTransaction Analysis:")
    print(f"  Total transactions: {total_transactions:,}")
    print(f"  Valid customer IDs: {valid_count:,}")
    print(f"  NULL customer IDs: {null_count:,}")
    print(f"  Invalid customer IDs: {invalid_count:,}")
    
    if invalid_ids:
        print(f"\nTop 10 invalid customer IDs:")
        sorted_invalid = sorted(invalid_ids.items(), key=lambda x: x[1], reverse=True)[:10]
        for customer_id, count in sorted_invalid:
            print(f"    {customer_id}: {count} transactions")
    
    return invalid_count, invalid_ids

def fix_transaction_customer_ids():
    """Fix transactions.csv by setting invalid customer IDs to empty string (NULL)"""
    print("\n" + "="*50)
    print("Fixing transactions.csv...")
    
    # Get valid customer IDs
    valid_customer_ids = set()
    with open(os.path.join(DATA_DIR, 'customerRewards.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            valid_customer_ids.add(int(row['customerId']))
    
    # Read and fix transactions
    rows = []
    fixed_count = 0
    
    with open('transactions.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        for row in reader:
            customer_id_str = row['customerId'].strip() if row['customerId'] else None
            
            if customer_id_str:
                try:
                    customer_id = int(customer_id_str)
                    if customer_id not in valid_customer_ids:
                        # Set to empty string (will be NULL in database)
                        row['customerId'] = ''
                        fixed_count += 1
                except ValueError:
                    # Invalid format, set to empty
                    row['customerId'] = ''
                    fixed_count += 1
            
            rows.append(row)
    
    # Write fixed CSV
    if fixed_count > 0:
        backup_file = os.path.join(DATA_DIR, 'transactions.csv.backup')
        csv_file = os.path.join(DATA_DIR, 'transactions.csv')
        print(f"\nCreating backup: {backup_file}")
        os.rename(csv_file, backup_file)
        
        print(f"Writing {len(rows):,} transactions to fixed file...")
        with open(csv_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        
        print(f"[OK] Fixed {fixed_count:,} transactions with invalid customer IDs")
        print(f"[OK] Original file backed up to {backup_file}")
        return True
    else:
        print("[OK] No invalid customer IDs to fix")
        return False

def verify_fixes():
    """Verify that fixes were successful"""
    print("\n" + "="*50)
    print("Verifying fixes...")
    
    # Check for duplicate emails
    emails = set()
    duplicate_emails = []
    with open(os.path.join(DATA_DIR, 'customerRewards.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row['email'].strip()
            if email in emails:
                duplicate_emails.append(email)
            emails.add(email)
    
    if duplicate_emails:
        print(f"[ERROR] Still found {len(duplicate_emails)} duplicate emails: {duplicate_emails[:5]}")
        return False
    else:
        print("[OK] No duplicate emails found")
    
    # Check transaction customer IDs
    valid_customer_ids = set()
    with open(os.path.join(DATA_DIR, 'customerRewards.csv'), 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            valid_customer_ids.add(int(row['customerId']))
    
    invalid_count = 0
    with open('transactions.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            customer_id_str = row['customerId'].strip() if row['customerId'] else None
            if customer_id_str:
                try:
                    customer_id = int(customer_id_str)
                    if customer_id not in valid_customer_ids:
                        invalid_count += 1
                        if invalid_count <= 5:
                            print(f"  [WARNING] Still found invalid customer ID: {customer_id}")
                except ValueError:
                    invalid_count += 1
    
    if invalid_count > 0:
        print(f"[ERROR] Still found {invalid_count} invalid customer IDs")
        return False
    else:
        print("[OK] All transaction customer IDs are valid or NULL")
    
    return True

def main():
    """Main function"""
    print("="*50)
    print("CSV Data Fixer")
    print("="*50)
    
    # Check if CSV files exist
    customer_rewards_file = os.path.join(DATA_DIR, 'customerRewards.csv')
    transactions_file = os.path.join(DATA_DIR, 'transactions.csv')
    
    if not os.path.exists(customer_rewards_file):
        print(f"[ERROR] {customer_rewards_file} not found!")
        return
    
    if not os.path.exists(transactions_file):
        print(f"[ERROR] {transactions_file} not found!")
        return
    
    # Step 1: Find and fix duplicate emails
    duplicates = find_duplicate_emails()
    if duplicates:
        fix_duplicate_emails(duplicates)
    else:
        print("[OK] No duplicate emails found")
    
    # Step 2: Analyze transaction customer IDs
    invalid_count, invalid_ids = analyze_transaction_customer_ids()
    
    # Step 3: Fix transaction customer IDs
    if invalid_count > 0:
        print(f"\n[INFO] Found {invalid_count:,} transactions with invalid customer IDs.")
        print("[INFO] Automatically fixing by setting invalid customer IDs to NULL...")
        fix_transaction_customer_ids()
    else:
        print("[OK] No invalid customer IDs found")
    
    # Step 4: Verify fixes
    if verify_fixes():
        print("\n" + "="*50)
        print("[SUCCESS] All fixes verified successfully!")
        print("="*50)
        print("\nYou can now load the data using:")
        print("  python load_data_safe.py")
        print("  OR")
        print("  python reset_database.py --load-data")
    else:
        print("\n" + "="*50)
        print("[WARNING] Some issues may remain. Please review the output above.")
        print("="*50)

if __name__ == "__main__":
    main()

