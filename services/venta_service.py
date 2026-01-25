from extensions import db
from models.sales import Venta, VentaDetalle
from models.inventory import Inventario

def realizar_venta_directa(items):
    """
    Process a direct sale.
    items: List of dicts {id_producto, cantidad}
    """
    try:
        total_venta = 0
        detalles_para_crear = []
        
        # 1. Validate and calculate total
        for item in items:
            producto = Inventario.query.get(item['id_producto'])
            if not producto:
                 return None, f"Producto ID {item['id_producto']} no encontrado"
            
            cantidad = item['cantidad']
            if not producto.validar_stock(cantidad):
                return None, f"Stock insuficiente para {producto.nombre}"
            
            # Add to list to process later
            detalles_para_crear.append({
                "producto": producto,
                "cantidad": cantidad,
                "subtotal": producto.precio * cantidad
            })
            total_venta += producto.precio * cantidad

        # 2. Create Sale
        venta = Venta(total=total_venta)
        db.session.add(venta)
        db.session.flush() # Get ID

        # 3. Deduct stock and link details
        for det in detalles_para_crear:
            producto = det['producto']
            producto.descontar_stock(det['cantidad'])
            
            detalle_bd = VentaDetalle(
                venta_id=venta.id_venta,
                producto_id=producto.id_producto,
                cantidad=det['cantidad']
            )
            db.session.add(detalle_bd)
        
        db.session.commit()
        return venta, "Venta realizada con éxito"

    except Exception as e:
        db.session.rollback()
        raise e
