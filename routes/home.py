from flask import Blueprint, render_template
from controllers.home_controller import index

home_bp = Blueprint('home', __name__)

@home_bp.route('/')
def home():
    return index()
