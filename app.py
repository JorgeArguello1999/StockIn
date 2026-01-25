from flask import Flask
from extensions import db, migrate

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///stockin.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    import models # Register models for migration

    # Register API Blueprints
    from routes.api import register_api_routes
    register_api_routes(app)

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
