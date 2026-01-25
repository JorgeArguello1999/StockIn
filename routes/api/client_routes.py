from flask import Blueprint, request, jsonify
from services.registro_service import buscar_clientes

client_api = Blueprint('client_api', __name__, url_prefix='/api/clientes')

@client_api.route('/buscar', methods=['GET'])
def search_clients():
    query = request.args.get('q', '')
    if not query:
        return jsonify([]), 200
        
    try:
        results = buscar_clientes(query)
        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
