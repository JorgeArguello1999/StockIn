from flask import Blueprint, request, jsonify
from services.inventory_service import crear_producto, listar_productos

inventory_api = Blueprint('inventory_api', __name__, url_prefix='/api/inventario')

@inventory_api.route('/crear', methods=['POST'])
def create_product():
    data = request.get_json()
    if not data or not data.get('nombre') or not data.get('precio'):
        return jsonify({"error": "Nombre y precio requeridos"}), 400
        
    try:
        producto, msg = crear_producto(data)
        return jsonify({
            "mensaje": msg, 
            "id": producto.id_producto,
            "nombre": producto.nombre
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@inventory_api.route('/listar', methods=['GET'])
def list_products():
    try:
        productos = listar_productos()
        return jsonify(productos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
