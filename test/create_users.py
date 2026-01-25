import sys
import os

# Ensure we can import from the parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from extensions import db
from models.user import User
from werkzeug.security import generate_password_hash

def create_users():
    app = create_app()
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()

        # Check if users exist to avoid duplicates or errors
        if User.query.filter_by(username='admin').first():
            print("User 'admin' already exists.")
        else:
            admin_user = User(
                username='admin',
                email='admin@stockin.com',
                password_hash=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin_user)
            print("Created user: admin (password: admin123)")

        if User.query.filter_by(username='mecanico').first():
            print("User 'mecanico' already exists.")
        else:
            mechanic_user = User(
                username='mecanico',
                email='mecanico@stockin.com',
                password_hash=generate_password_hash('mecanico123'),
                role='mechanic'
            )
            db.session.add(mechanic_user)
            print("Created user: mecanico (password: mecanico123)")
        
        try:
            db.session.commit()
            print("Database transaction committed successfully.")
        except Exception as e:
            db.session.rollback()
            print(f"Error creating users: {e}")

if __name__ == "__main__":
    create_users()
