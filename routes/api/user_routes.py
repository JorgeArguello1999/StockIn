from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from services.user_service import list_users, create_user, reset_password, delete_user

user_api = Blueprint('user_api', __name__, url_prefix='/api/users')

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'admin':
            return jsonify({"error": "Acceso denegado (Solo Admin)"}), 403
        return f(*args, **kwargs)
    return decorated_function

@user_api.route('/listar', methods=['GET'])
@login_required
@admin_required
def list_all():
    try:
        users = list_users()
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_api.route('/crear', methods=['POST'])
@login_required
@admin_required
def create():
    data = request.get_json()
    try:
        user, msg = create_user(data)
        if not user:
            return jsonify({"error": msg}), 400
        return jsonify({"mensaje": msg}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_api.route('/reset-password/<int:user_id>', methods=['POST'])
@login_required
@admin_required
def reset_pwd(user_id):
    data = request.get_json()
    new_pass = data.get('password')
    if not new_pass:
        return jsonify({"error": "Contraseña requerida"}), 400
        
    try:
        success, msg = reset_password(user_id, new_pass)
        if not success:
            return jsonify({"error": msg}), 404
        return jsonify({"mensaje": msg}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_api.route('/eliminar/<int:user_id>', methods=['POST'])
@login_required
@admin_required
def delete(user_id):
    data = request.get_json() or {}
    system_pass = data.get('system_password')
    
    try:
        success, msg = delete_user(user_id, current_user.id, system_pass)
        if not success:
            return jsonify({"error": msg}), 400
        return jsonify({"mensaje": msg}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
