from flask import Flask
from app.configs.config import Config
from app.models.extensions import db, migrate

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    # Register blueprints
    from app.routes import bp as routes_bp
    app.register_blueprint(routes_bp)

    return app
