from flask import Blueprint, request, jsonify
from services.venta_service import realizar_venta_directa

venta_api = Blueprint('venta_api', __name__, url_prefix='/api/venta')

@venta_api.route('/crear', methods=['POST'])
def create_sale():
    data = request.get_json()
    items = data.get('items') # List of {id_producto, cantidad}
    
    if not items or not isinstance(items, list):
         return jsonify({"error": "Items requeridos en formato lista"}), 400

    try:
        venta, msg = realizar_venta_directa(items)
        if not venta:
            return jsonify({"error": msg}), 400
        
        return jsonify({"mensaje": msg, "id_venta": venta.id_venta, "total": venta.total}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
