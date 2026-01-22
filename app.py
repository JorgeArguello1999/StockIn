from dotenv import load_dotenv
from os import getenv
load_dotenv()

from flask import Flask
from utils.config import config

# Models
from models import init_db

# Routes 
from routes import register_routes

app = Flask(__name__)
app.config.from_object(config['default'])

# Initialize DB and Migrations
init_db(app)

register_routes(app)

if __name__ == "__main__":
    app.run(
        host=getenv('HOST', '127.0.0.1'), 
        port=int(getenv('PORT', 5000)), 
        debug=getenv('DEBUG')
    )