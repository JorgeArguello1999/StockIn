from flask import Flask
from extensions import db, migrate, login_manager
from models.user import User

def create_app():
    app = Flask(__name__)
    
    # Configuration
    import os
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///stockin.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'dev-secret-key-change-in-production'

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    login_manager.login_view = 'view_routes.login'

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    import models # Register models for migration

    # Register API Blueprints
    from routes.api import register_api_routes
    register_api_routes(app)

    # Register View Blueprints
    from routes.view_routes import view_routes
    app.register_blueprint(view_routes)

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
