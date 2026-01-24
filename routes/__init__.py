from .home_routes import home_bp

def register_routes(app):
    app.register_blueprint(home_bp)
