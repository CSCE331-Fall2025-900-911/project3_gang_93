"""Database connection utilities"""
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from config import DB_CONFIG

@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        # Set timezone to CST (America/Chicago) for all queries
        # This ensures all timestamp operations use CST
        with conn.cursor() as cursor:
            cursor.execute("SET TIME ZONE 'America/Chicago'")
            # Verify timezone is set correctly
            cursor.execute("SHOW TIMEZONE")
            tz_result = cursor.fetchone()
            print(f"[Database] Connection timezone set to: {tz_result[0] if tz_result else 'unknown'}")
        conn.commit()
        yield conn
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()

@contextmanager
def get_db_cursor(commit=True):
    """Context manager for database cursor with RealDictCursor"""
    with get_db_connection() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
            if commit:
                conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()

def execute_query(query, params=None, fetch_one=False, fetch_all=True):
    """Execute a query and return results"""
    with get_db_cursor() as cursor:
        cursor.execute(query, params or ())
        
        if fetch_one:
            return cursor.fetchone()
        elif fetch_all:
            return cursor.fetchall()
        else:
            return None

def execute_insert(query, params=None, return_id=True):
    """Execute an insert query and optionally return the inserted ID"""
    with get_db_cursor() as cursor:
        cursor.execute(query, params or ())
        
        if return_id:
            result = cursor.fetchone()
            return result if result else None
        return None