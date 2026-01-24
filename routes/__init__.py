from routes.signin_signup import signin_signup_bp

def register_routes(app):
    app.register_blueprint(signin_signup_bp)
