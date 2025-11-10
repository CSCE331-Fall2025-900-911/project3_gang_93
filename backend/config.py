"""Database configuration"""
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "dbname": os.getenv("DB_NAME", "gang_93_db"),
    "user": os.getenv("DB_USER", "gang_93"),
    "password": os.getenv("DB_PASSWORD", ""),
    "host": os.getenv("DB_HOST", "csce-315-db.engr.tamu.edu"),
    "port": os.getenv("DB_PORT", "5432")
}

