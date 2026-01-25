from flask import Blueprint, request, jsonify
from services.taller_service import iniciar_servicio, agregar_repuesto, finalizar_orden, listar_ordenes, revertir_orden

taller_api = Blueprint('taller_api', __name__, url_prefix='/api/taller')

@taller_api.route('/ordenes', methods=['GET'])
def list_orders():
    ordenes = listar_ordenes()
    return jsonify(ordenes), 200

@taller_api.route('/historial/<placa>', methods=['GET'])
def vehicle_history(placa):
    try:
        from services.taller_service import obtener_historial_vehiculo
        historial = obtener_historial_vehiculo(placa)
        return jsonify(historial), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@taller_api.route('/iniciar/<int:ot_id>', methods=['POST'])
def start_work(ot_id):
    ot, msg = iniciar_servicio(ot_id)
    if not ot:
        return jsonify({"error": msg}), 400
    return jsonify({"mensaje": msg, "estado": ot.estado}), 200

@taller_api.route('/repuestos', methods=['POST'])
def add_part():
    data = request.get_json()
    ot_id = data.get('ot_id')
    prod_id = data.get('producto_id')
    cantidad = data.get('cantidad')
    
    if not all([ot_id, prod_id, cantidad]):
        return jsonify({"error": "Datos incompletos"}), 400

    try:
        detalle, msg = agregar_repuesto(ot_id, prod_id, int(cantidad))
        if not detalle:
            return jsonify({"error": msg}), 400
        
        return jsonify({
            "mensaje": msg, 
            "producto": detalle.producto.nombre, 
            "precio": detalle.precio_snapshot
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@taller_api.route('/finalizar/<int:ot_id>', methods=['POST'])
def finish_work(ot_id):
    ot, msg = finalizar_orden(ot_id)
    if not ot:
        return jsonify({"error": msg}), 400
    return jsonify({"mensaje": msg, "estado": ot.estado}), 200

    return jsonify({"mensaje": msg, "estado": ot.estado}), 200

@taller_api.route('/revertir/<int:ot_id>', methods=['POST'])
def revert_work(ot_id):
    ot, msg = revertir_orden(ot_id)
    if not ot:
        return jsonify({"error": msg}), 400
    return jsonify({"mensaje": msg, "estado": ot.estado}), 200

@taller_api.route('/orden/<int:ot_id>/detalles', methods=['GET'])
def list_ot_details(ot_id):
    try:
        from services.taller_service import listar_detalles
        detalles = listar_detalles(ot_id)
        return jsonify(detalles), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@taller_api.route('/detalles/<int:det_id>/devolver', methods=['POST'])
def return_part_endpoint(det_id):
    try:
        from services.taller_service import devolver_repuesto
        res, msg = devolver_repuesto(det_id)
        if not res:
             return jsonify({"error": msg}), 400
        return jsonify({"mensaje": msg}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
