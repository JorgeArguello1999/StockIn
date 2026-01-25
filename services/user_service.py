from extensions import db
from models.user import User
from werkzeug.security import generate_password_hash
import os

def list_users():
    users = User.query.all()
    return [{
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "role": u.role,
        "created_at": u.created_at.strftime('%Y-%m-%d %H:%M') if u.created_at else "N/A"
    } for u in users]

def create_user(data):
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'mechanic')
    
    if not all([username, email, password]):
        return None, "Faltan datos requeridos"
    
    if User.query.filter_by(username=username).first():
        return None, "Usuario ya existe"
    if User.query.filter_by(email=email).first():
        return None, "Email ya registrado"
        
    try:
        new_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            role=role
        )
        db.session.add(new_user)
        db.session.commit()
        return new_user, "Usuario creado exitosamente"
    except Exception as e:
        db.session.rollback()
        raise e

def reset_password(user_id, new_password):
    user = User.query.get(user_id)
    if not user:
        return False, "Usuario no encontrado"
        
    try:
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        return True, "Contraseña actualizada"
    except Exception as e:
        db.session.rollback()
        raise e

def delete_user(target_id, requester_id, system_pass=None):
    user = User.query.get(target_id)
    if not user:
        return False, "Usuario no encontrado"
    
    # 1. Prevent Self-Deletion
    if int(target_id) == int(requester_id):
        return False, "No puedes eliminar tu propio usuario"
        
    # 2. Check if Target is Admin
    if user.role == 'admin':
        # Require System Password
        env_pass = os.environ.get('SYSTEM_PASSWORD')
        if not env_pass:
            return False, "Error de configuración: SYSTEM_PASSWORD no establecida en servidor"
            
        if system_pass != env_pass:
            return False, "Contraseña del sistema incorrecta"
            
    try:
        db.session.delete(user)
        db.session.commit()
        return True, "Usuario eliminado"
    except Exception as e:
        db.session.rollback()
        raise e
