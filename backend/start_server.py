"""
Quick start script for the POS System backend server
"""
import os
import sys

def check_env_file():
    """Check if .env file exists"""
    if not os.path.exists('.env'):
        print("⚠️  Warning: .env file not found!")
        print("Please create a .env file from .env.example and add your database password.")
        print("\nSteps:")
        print("1. Copy .env.example to .env")
        print("2. Edit .env and add your DB_PASSWORD")
        print("\nContinuing anyway...")
        return False
    return True

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import fastapi
        import uvicorn
        import psycopg2
        import pydantic
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("\nPlease install dependencies:")
        print("pip install -r requirements.txt")
        return False

if __name__ == "__main__":
    print("🚀 Starting POS System Backend Server...")
    print("=" * 50)
    
    # Check environment
    check_env_file()
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    print("\n✅ All checks passed!")
    print("\nStarting server...")
    print("📍 API: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 50)
    print()
    
    # Start the server
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

