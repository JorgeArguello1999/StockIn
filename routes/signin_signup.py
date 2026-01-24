from flask import Blueprint
from controllers.signin_signup import render_signin_signup_page

signin_signup_bp = Blueprint('login', __name__, url_prefix='/login')

@signin_signup_bp.route('/')
def signin_signup():
    return render_signin_signup_page()
