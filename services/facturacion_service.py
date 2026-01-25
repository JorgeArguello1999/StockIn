from extensions import db
from models.work_order import OrdenTrabajo
from models.invoice import Factura

def pre_liquidar_ot(numero_ot):
    """
    Calculate costs for an OT before billing.
    """
    ot = OrdenTrabajo.query.get(numero_ot)
    if not ot:
        return None, "Orden no encontrada"
    
    costo_repuestos = 0
    for detalle in ot.detalles:
        costo_repuestos += (detalle.precio_snapshot * detalle.cantidad)
        
    return {
        "numero_ot": ot.numeroOT,
        "costo_repuestos": costo_repuestos,
        "monto_mano_obra": ot.monto_mano_obra,
        "total_estimado": costo_repuestos + ot.monto_mano_obra
    }, "Pre-liquidación calculada"

def generar_factura_final(numero_ot, monto_mano_obra, metodo_pago):
    """
    Finalize an OT and generate invoice.
    """
    try:
        ot = OrdenTrabajo.query.get(numero_ot)
        if not ot:
            return None, "Orden no encontrada"
        
        if ot.estado == 'Pagada' or ot.factura:
             return None, "Orden ya facturada"

        # Update labor cost
        ot.monto_mano_obra = float(monto_mano_obra)
        
        # Calculate totals
        costo_repuestos = sum(d.precio_snapshot * d.cantidad for d in ot.detalles)
        total_final = costo_repuestos + ot.monto_mano_obra
        
        # Create Invoice
        # Note: OT has a vehicle, vehicle has a client.
        factura = Factura(
            orden_id=ot.numeroOT,
            cliente_id=ot.vehiculo.propietario.id_cliente,
            total_final=total_final,
            metodo_pago=metodo_pago
        )
        
        db.session.add(factura)
        
        # Update OT status
        ot.estado = 'Pagada'
        
        db.session.commit()
        return factura, "Factura generada y orden cerrada"

    except Exception as e:
        db.session.rollback()
        raise e

def listar_ordenes_pendientes_pago():
    """
    List all OTs with status 'Finalizada' (ready for billing).
    """
    ordenes = OrdenTrabajo.query.filter_by(estado='Finalizada').all()
    result = []
    
    for ot in ordenes:
        costo_repuestos = sum(d.precio_snapshot * d.cantidad for d in ot.detalles)
        result.append({
            "numero_ot": ot.numeroOT,
            "placa": ot.placa_vehiculo,
            "total_repuestos": costo_repuestos
        })
        

def listar_facturas(query=None):
    """
    List history of invoices, optionally filtered by client name, cedula, or plate (via connected objects).
    """
    base_query = Factura.query.join(Factura.cliente)
    
    if query:
        search = f"%{query}%"
        # Search in Client Name, Cedula
        # Search in Vehicle Plate (Need to join OT -> Vehicle)
        # Or if it's a direct sale, maybe search in details? Primarily Client/Plate
        
        # We need an outer join for OTs to search plates, as direct sales have no OT/Plate
        # But Factura has 'orden' relationship
        # Let's keep it simple: Search Client Name/Cedula first
        base_query = base_query.filter(
            (Cliente.nombre.ilike(search)) | 
            (Cliente.cedula.ilike(search)) |
            (str(Factura.nro_factura).ilike(search))
        )
    
    facturas = base_query.order_by(Factura.fecha_emision.desc()).all()
    
    result = []
    for f in facturas:
        cliente_nombre = f.cliente.nombre
        tipo = "Venta Directa" if f.venta_id else "Servicio Taller"
        
        result.append({
            "nro_factura": f.nro_factura,
            "fecha": f.fecha_emision.strftime('%Y-%m-%d %H:%M'),
            "cliente": cliente_nombre,
            "cedula": f.cliente.cedula,
            "total": f.total_final,
            "tipo": tipo
        })
    return result
