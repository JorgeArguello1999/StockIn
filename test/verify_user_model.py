import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from models import db
from models.user import User
from models.enums import UserRole


with app.app_context():
    db.create_all()
    
    # Clean up previous tests
    existing = User.query.filter_by(username='testuser').first()
    if existing:
        db.session.delete(existing)
        db.session.commit()

    u = User(username='testuser', email='test@example.com')
    u.password = 'securepassword'
    u.role = UserRole.ADMIN
    
    db.session.add(u)
    db.session.commit()
    
    user = User.query.filter_by(username='testuser').first()
    print(f"User created: {user.username}")
    print(f"Role: {user.role}")
    print(f"Password verification: {user.verify_password('securepassword')}")
    print(f"Created At: {user.created_at}")
    print(f"Updated At: {user.updated_at}")
    
    assert user.verify_password('securepassword') == True
    assert user.verify_password('wrong') == False
    assert user.role == UserRole.ADMIN
    assert user.created_at is not None
