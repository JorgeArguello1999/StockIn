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
