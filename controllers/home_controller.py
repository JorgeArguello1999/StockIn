from flask import render_template

def index():
    # Business logic goes here if needed
    return render_template('public/index.html')
