from .registro_routes import registro_api
from .taller_routes import taller_api
from .venta_routes import venta_api
from .facturacion_routes import facturacion_api

from .inventory_routes import inventory_api

def register_api_routes(app):
    app.register_blueprint(registro_api)
    app.register_blueprint(taller_api)
    app.register_blueprint(venta_api)
    app.register_blueprint(facturacion_api)
    app.register_blueprint(inventory_api)
