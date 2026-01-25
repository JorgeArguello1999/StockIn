from flask import Blueprint, request, jsonify
from services.registro_service import validar_vehiculo, procesar_registro, listar_vehiculos

registro_api = Blueprint('registro_api', __name__, url_prefix='/api/registro')

@registro_api.route('/listar', methods=['GET'])
def list_vehicles():
    try:
        autos = listar_vehiculos()
        return jsonify(autos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@registro_api.route('/eliminar/<placa>', methods=['DELETE'])
def delete_vehicle_endpoint(placa):
    try:
        from services.registro_service import eliminar_vehiculo
        success, msg = eliminar_vehiculo(placa)
        if not success:
            return jsonify({"error": msg}), 400
        return jsonify({"mensaje": msg}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@registro_api.route('/editar/<placa>', methods=['PUT'])
def edit_vehicle_endpoint(placa):
    data = request.get_json()
    try:
        from services.registro_service import editar_vehiculo
        res, msg = editar_vehiculo(placa, data)
        if not res:
             return jsonify({"error": msg}), 404
        return jsonify({"mensaje": msg}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@registro_api.route('/validar/<placa>', methods=['GET'])
def check_vehicle(placa):
    result = validar_vehiculo(placa)
    if result:
        return jsonify(result), 200
    return jsonify({"mensaje": "Vehículo no existe"}), 404

@registro_api.route('/crear', methods=['POST'])
def create_entry():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Datos requeridos"}), 400
    
    try:
        resultado = procesar_registro(data)
        return jsonify(resultado), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
