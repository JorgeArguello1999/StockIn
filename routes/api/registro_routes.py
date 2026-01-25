from flask import Blueprint, request, jsonify
from services.registro_service import validar_vehiculo, procesar_registro

registro_api = Blueprint('registro_api', __name__, url_prefix='/api/registro')

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
