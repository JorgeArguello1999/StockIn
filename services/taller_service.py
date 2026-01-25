from extensions import db
from models.work_order import OrdenTrabajo, OrdenDetalleRepuesto
from models.inventory import Inventario

def iniciar_servicio(numero_ot):
    ot = OrdenTrabajo.query.get(numero_ot)
    if not ot:
        return None, "Orden no encontrada"
    
    if ot.estado != 'Pendiente':
        return None, f"No se puede iniciar. Estado actual: {ot.estado}"
        
    ot.estado = 'En Proceso'
    db.session.commit()
    return ot, "Servicio iniciado"

def agregar_repuesto(numero_ot, id_producto, cantidad):
    try:
        ot = OrdenTrabajo.query.get(numero_ot)
        producto = Inventario.query.get(id_producto)
        
        if not ot:
            return None, "Orden no encontrada"
        if not producto:
            return None, "Producto no encontrado"

        # Validar stock
        if not producto.validar_stock(cantidad):
            return None, f"Stock insuficiente. Disponible: {producto.stock_actual}"

        # Transacción
        producto.descontar_stock(cantidad)
        
        detalle = OrdenDetalleRepuesto(
            orden_id=numero_ot,
            producto_id=id_producto,
            cantidad=cantidad,
            precio_snapshot=producto.precio
        )
        
        
        # Auto-update status to 'En Proceso' if it was 'Pendiente'
        if ot.estado == 'Pendiente':
            ot.estado = 'En Proceso'
            
        db.session.add(detalle)
        db.session.commit()
        
        return detalle, "Repuesto agregado correctamente"

    except Exception as e:
        db.session.rollback()
        raise e

def finalizar_orden(numero_ot):
    ot = OrdenTrabajo.query.get(numero_ot)
    if not ot:
        return None, "Orden no encontrada"
    
    ot.estado = 'Finalizada'
    db.session.commit()
    return ot, "Orden finalizada"

def revertir_orden(numero_ot):
    """Reverts status from Finalizada to En Proceso."""
    ot = OrdenTrabajo.query.get(numero_ot)
    if not ot:
        return None, "Orden no encontrada"
    
    if ot.estado != 'Finalizada':
        return None, f"No se puede revertir. Estado actual: {ot.estado}"
    
    ot.estado = 'En Proceso'
    db.session.commit()
    return ot, "Orden regresada a Taller"

def listar_ordenes():
    ordenes = OrdenTrabajo.query.all()
    # Serialize manually for now
    return [{
        "id": ot.numeroOT,
        "placa": ot.placa_vehiculo,
        "estado": ot.estado,
        "sintomas": ot.sintomas,
        "categoria": ot.categoria_color
    } for ot in ordenes]

def obtener_historial_vehiculo(placa):
    """Returns list of OTs for a specific vehicle."""
    ordenes = OrdenTrabajo.query.filter_by(placa_vehiculo=placa).order_by(OrdenTrabajo.numeroOT.desc()).all()
    # Assuming 'fecha_ingreso' is not clearly defined in snippet, using OT ID as proxy for order 
    # or if we have timestamps. The snippet didn't show the model def fully but let's assume basic fields.
    result = []
    for ot in ordenes:
        costo_repuestos = sum(d.precio_snapshot * d.cantidad for d in ot.detalles)
        total = costo_repuestos + float(ot.monto_mano_obra or 0)
        
        result.append({
            "id": ot.numeroOT,
            "fecha": ot.fecha_ingreso.strftime('%Y-%m-%d %H:%M') if ot.fecha_ingreso else "N/A",
            "contenido": ot.sintomas,
            "estado": ot.estado,
            "total": total
        })
    return result

def listar_detalles(numero_ot):
    detalles = OrdenDetalleRepuesto.query.filter_by(orden_id=numero_ot).all()
    return [{
        "id": d.id,
        "producto": d.producto.nombre,
        "cantidad": d.cantidad,
        "precio": d.precio_snapshot,
        "subtotal": d.cantidad * d.precio_snapshot
    } for d in detalles]

def devolver_repuesto(detalle_id):
    try:
        detalle = OrdenDetalleRepuesto.query.get(detalle_id)
        if not detalle:
            return False, "Detalle no encontrado"
            
        # Restore stock
        producto = detalle.producto
        if producto:
            producto.stock_actual += detalle.cantidad
            
        db.session.delete(detalle)
        db.session.commit()
        return True, "Repuesto devuelto y stock restaurado"
    except Exception as e:
        db.session.rollback()
        raise e
