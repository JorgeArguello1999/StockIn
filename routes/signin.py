from flask import Blueprint
from controllers.signin import render_signin_page

signin_bp = Blueprint('signin', __name__, url_prefix='/login')

@signin_bp.route('/', methods=['GET', 'POST'])
def signin():
    return render_signin_page()
