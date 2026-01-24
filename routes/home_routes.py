from flask import Blueprint
from controllers.home_controller import index

home_bp = Blueprint('home', __name__)

home_bp.route('/')(index)
