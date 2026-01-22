from routes.home import home_bp

def register_routes(app):
    app.register_blueprint(home_bp)