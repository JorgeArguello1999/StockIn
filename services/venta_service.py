from extensions import db
from models.sales import Venta, VentaDetalle
from models.inventory import Inventario
from models.invoice import Factura
from models.client_vehicle import Cliente


def realizar_venta_directa(items, cliente_info=None):
    """
    Process a direct sale.
    items: List of dicts {id_producto, cantidad}
    cliente_info: Dict with client data (optional). If None/empty, uses 'Consumidor Final'.
    """
    try:
        total_venta = 0
        detalles_para_crear = []
        
        # 1. Validate and calculate total
        for item in items:
            producto = Inventario.query.get(item['id_producto'])
            if not producto:
                 return None, f"Producto ID {item['id_producto']} no encontrado", None
            
            if not producto.activo:
                 return None, f"El producto '{producto.nombre}' no está disponible para la venta", None

            cantidad = item['cantidad']
            if not producto.validar_stock(cantidad):
                return None, f"Stock insuficiente para {producto.nombre}", None
            
            # Add to list to process later
            detalles_para_crear.append({
                "producto": producto,
                "cantidad": cantidad,
                "subtotal": producto.precio * cantidad
            })
            total_venta += producto.precio * cantidad

        # 2. Handle Client (Generic or Named)
        cliente_id = None
        if not cliente_info or cliente_info.get('tipo') == 'consumidor_final':
            # Consumidor Final
            # Try to find by Reserved Cedula
            generic_cedula = "9999999999"
            cliente = Cliente.query.filter_by(cedula=generic_cedula).first()
            if not cliente:
                cliente = Cliente(
                    nombre="Consumidor Final",
                    cedula=generic_cedula,
                    telefono="999999999",
                    direccion="S/N",
                    email="sn@stockin.com"
                )
                db.session.add(cliente)
                db.session.flush()
            cliente_id = cliente.id_cliente
        else:
            # Named Client
            # Check if exists by ID or Cedula
            c_id = cliente_info.get('id')
            c_cedula = cliente_info.get('cedula')
            
            cliente = None
            if c_id:
                cliente = Cliente.query.get(c_id)
            elif c_cedula:
                cliente = Cliente.query.filter_by(cedula=c_cedula).first()
            
            # If still not found, create new (if full info provided)
            if not cliente:
                if not c_cedula:
                     return None, "Datos de cliente insuficientes (Falta Cédula)", None
                
                cliente = Cliente(
                    nombre=cliente_info.get('nombre', 'Cliente Nuevo'),
                    cedula=c_cedula,
                    telefono=cliente_info.get('telefono', 'S/N'),
                    direccion=cliente_info.get('direccion', 'S/N'),
                    email=cliente_info.get('email', '')
                )
                db.session.add(cliente)
                db.session.flush()
            
            # Update fields if needed/requested? (For now accept as is or just link)
            cliente_id = cliente.id_cliente

        # 3. Create Sale
        venta = Venta(total=total_venta)
        db.session.add(venta)
        db.session.flush() # Get ID

        # 4. Deduct stock and link details
        items_desc = []
        for det in detalles_para_crear:
            producto = det['producto']
            producto.descontar_stock(det['cantidad'])
            items_desc.append(f"{producto.nombre} (x{det['cantidad']})")
            
            detalle_bd = VentaDetalle(
                venta_id=venta.id_venta,
                producto_id=producto.id_producto,
                cantidad=det['cantidad']
            )
            db.session.add(detalle_bd)
        
        # 5. Generate Invoice Record
        factura = Factura(
            venta_id=venta.id_venta,
            cliente_id=cliente_id,
            total_final=total_venta,
            metodo_pago="Efectivo" # Default for POS for now, or pass in args
        )
        db.session.add(factura)
        
        db.session.commit()
        msg_detalle = ", ".join(items_desc)
        
        return venta, f"Venta #{venta.id_venta} confirmada. Items: {msg_detalle}. Total: ${total_venta:.2f}", factura

    except Exception as e:
        db.session.rollback()
        raise e

    except Exception as e:
        db.session.rollback()
        raise e
