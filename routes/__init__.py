from .signin import signin_bp

def register_routes(app):
    app.register_blueprint(signin_bp)
