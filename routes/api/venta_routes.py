from flask import Blueprint, request, jsonify
from services.venta_service import realizar_venta_directa

venta_api = Blueprint('venta_api', __name__, url_prefix='/api/venta')

@venta_api.route('/crear', methods=['POST'])
def create_sale():
    data = request.get_json()
    items = data.get('items') # List of {id_producto, cantidad}
    cliente_info = data.get('cliente_info') # Optional
    
    if not items or not isinstance(items, list):
         return jsonify({"error": "Items requeridos en formato lista"}), 400

    try:
        from services.pdf_service import generar_pdf_factura
        
        # Unpack 3 values now
        venta, msg, factura = realizar_venta_directa(items, cliente_info)
        
        if not venta:
            return jsonify({"error": msg}), 400
        
        # Generate PDF
        pdf_path = generar_pdf_factura(factura)
        # Convert path to URL
        # Assuming static folder is served at /static
        # pdf_path is something like static/invoices/factura_123.pdf
        pdf_url = "/" + pdf_path 
        
        return jsonify({
            "mensaje": msg, 
            "id_venta": venta.id_venta, 
            "total": venta.total,
            "factura_id": factura.nro_factura,
            "pdf_url": pdf_url
        }), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
