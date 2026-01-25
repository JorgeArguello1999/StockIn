from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_user, logout_user, login_required, current_user
from models.user import User

view_routes = Blueprint('view_routes', __name__)

@view_routes.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('view_routes.dashboard'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        # NOTE: In a real app we should use password hashing verification
        # user = User.query.filter_by(username=username).first()
        # if user and check_password_hash(user.password_hash, password):
        
        # For now, let's assume direct check or simple verification as per existing User model structure
        # We need to check how to verify password. The User model has password_hash.
        # Let's import check_password_hash
        from werkzeug.security import check_password_hash
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('view_routes.dashboard'))
        else:
            flash('Credenciales inválidas')
            
    return render_template('login.html')

@view_routes.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('view_routes.login'))

@view_routes.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', user=current_user)

@view_routes.route('/')
def index():
    return redirect(url_for('view_routes.dashboard'))
