from flask import Blueprint, request, jsonify
from services.facturacion_service import pre_liquidar_ot, generar_factura_final, listar_ordenes_pendientes_pago, listar_facturas

facturacion_api = Blueprint('facturacion_api', __name__, url_prefix='/api/facturacion')

@facturacion_api.route('/historial', methods=['GET'])
def list_history():
    query = request.args.get('q')
    try:
        facturas = listar_facturas(query)
        return jsonify(facturas), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@facturacion_api.route('/pendientes', methods=['GET'])
def list_pending_invoices():
    try:
        ordenes = listar_ordenes_pendientes_pago()
        return jsonify(ordenes), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@facturacion_api.route('/pre-liquidar/<int:ot_id>', methods=['GET'])
def get_pre_bill(ot_id):
    result, msg = pre_liquidar_ot(ot_id)
    if not result:
        return jsonify({"error": msg}), 404
    return jsonify(result), 200

@facturacion_api.route('/facturar/<int:ot_id>', methods=['POST'])
def generate_invoice(ot_id):
    data = request.get_json()
    monto_mo = data.get('monto_mano_obra')
    metodo = data.get('metodo_pago')
    
    if monto_mo is None or not metodo:
         return jsonify({"error": "Monto de mano de obra y método de pago requeridos"}), 400
         
    try:
        factura, msg = generar_factura_final(ot_id, monto_mo, metodo)
        if not factura:
             return jsonify({"error": msg}), 400
        
        return jsonify({
            "mensaje": msg, 
            "nro_factura": factura.nro_factura, 
            "total": factura.total_final
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
