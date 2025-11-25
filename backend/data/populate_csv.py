import csv
import json
import random
from datetime import datetime, timedelta, time

# ---- CONFIG ----
MENU_PATH = "menu.csv"
ADDONS_PATH = "addOns.csv"
TRANSACTIONS_PATH = "transactions.csv"
SALES_PATH = "sales.csv"

N_TRANSACTIONS = 2000   # CHANGE IF YOU WANT MORE/LESS

# Date boundaries (full datetime)
START_TIME = datetime(2024, 10, 1, 14, 23, 15)
END_TIME   = datetime(2025, 10, 22, 13, 26, 7)

# Business hours
OPEN_TIME = time(10, 0, 0)
CLOSE_TIME = time(19, 0, 0)

# Sweetness distribution
SWEETNESS_LEVELS = {
    "100%": 0.70,
    "75%": 0.20,
    "50%": 0.05,
    "25%": 0.03,
    "0%": 0.02
}

def random_timestamp_within_business_hours():
    """Return a random timestamp within the allowed date window AND business hours."""
    # Step 1: pick any random datetime between start/end
    total_seconds = int((END_TIME - START_TIME).total_seconds())
    offset = random.randint(0, total_seconds)
    base_datetime = START_TIME + timedelta(seconds=offset)

    # Step 2: force time of day into business hours
    random_seconds = random.randint(
        0,
        (CLOSE_TIME.hour - OPEN_TIME.hour) * 3600
    )
    forced_time = (datetime.combine(datetime.today(), OPEN_TIME) +
                   timedelta(seconds=random_seconds)).time()

    return datetime.combine(base_datetime.date(), forced_time)

def load_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def choose_sweetness():
    r = random.random()
    cumulative = 0
    for level, p in SWEETNESS_LEVELS.items():
        cumulative += p
        if r <= cumulative:
            return level
    return "100%"

def generate():
    menu = load_csv(MENU_PATH)
    addons = load_csv(ADDONS_PATH)

    # Identify key add-ons
    boba_id = next((int(a["addOnID"]) for a in addons if "tapioca" in a["addOnName"].lower()), None)
    syrup_id = next((int(a["addOnID"]) for a in addons if "simple syrup" in a["addOnName"].lower()), None)

    # exclude boba + syrup
    other_addons = [
        int(a["addOnID"])
        for a in addons
        if int(a["addOnID"]) not in (boba_id, syrup_id)
    ]

    transactions = []
    sales = []
    next_sale_id = 1

    for t_id in range(1, N_TRANSACTIONS + 1):

        menu_item = random.choice(menu)
        menu_id = int(menu_item["menuItemId"])
        menu_name = menu_item["menuItemName"]

        sweetness = choose_sweetness()

        # Add-ons
        addOnIDs = []

        if boba_id and random.random() < 0.80:
            addOnIDs.append(boba_id)

        if syrup_id and sweetness != "0%":
            addOnIDs.append(syrup_id)

        if other_addons and random.random() < 0.15:
            addOnIDs.append(random.choice(other_addons))

        # Time within business hours
        ts = random_timestamp_within_business_hours()
        date_str = ts.strftime("%Y-%m-%d")
        time_str = ts.strftime("%H:%M:%S")

        items_json = json.dumps([{
            "menuItemId": menu_id,
            "quantity": 1,
            "addOnIDs": addOnIDs,
            "ice": random.choice(["light", "normal", "extra"]),
            "sweetness": sweetness
        }])

        # Transaction row
        transactions.append({
            "transactionId": t_id,
            "date": date_str,
            "customerId": "",
            "items": items_json,
            "time": time_str,
            "transactionType": random.choice(["card", "cash"])
        })

        # Sales: drink itself
        sales.append({
            "saleId": next_sale_id,
            "itemName": menu_name,
            "amountSold": 1,
            "date": date_str,
            "time": time_str
        })
        next_sale_id += 1

        # Sales: addons
        for add_id in addOnIDs:
            addon = next(a for a in addons if int(a["addOnID"]) == add_id)
            sales.append({
                "saleId": next_sale_id,
                "itemName": addon["addOnName"],
                "amountSold": 1,
                "date": date_str,
                "time": time_str
            })
            next_sale_id += 1

    return transactions, sales

def write_csv(path, fields, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

if __name__ == "__main__":
    transactions, sales = generate()

    write_csv(
        TRANSACTIONS_PATH,
        ["transactionId", "date", "customerId", "items", "time", "transactionType"],
        transactions
    )

    write_csv(
        SALES_PATH,
        ["saleId", "itemName", "amountSold", "date", "time"],
        sales
    )

    print(f"✓ Generated {len(transactions)} transactions")
    print(f"✓ Generated {len(sales)} sales entries")
    print("✓ DONE (business hours enforced)")
