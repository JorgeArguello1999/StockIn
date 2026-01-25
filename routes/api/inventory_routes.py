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

@inventory_api.route('/stock', methods=['POST'])
def update_stock_endpoint():
    data = request.get_json()
    id_prod = data.get('id')
    cambio = data.get('cambio')
    
    if not id_prod or cambio is None:
         return jsonify({"error": "ID y cambio requeridos"}), 400

    try:
        from services.inventory_service import actualizar_stock
        prod, msg = actualizar_stock(id_prod, cambio)
        if not prod:
            return jsonify({"error": msg}), 404
            
        return jsonify({"mensaje": msg, "nuevo_stock": prod.stock_actual}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@inventory_api.route('/editar/<int:id_prod>', methods=['PUT'])
def edit_product_endpoint(id_prod):
    data = request.get_json()
    try:
        from services.inventory_service import editar_producto
        prod, msg = editar_producto(id_prod, data)
        if not prod:
            return jsonify({"error": msg}), 404
            
        return jsonify({"mensaje": msg}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@inventory_api.route('/eliminar/<int:id_prod>', methods=['DELETE'])
def delete_product_endpoint(id_prod):
    try:
        from services.inventory_service import eliminar_producto
        success, msg = eliminar_producto(id_prod)
        if not success:
            return jsonify({"error": msg}), 400
        return jsonify({"mensaje": msg}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
