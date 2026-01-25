from models.inventory import Inventario
from extensions import db

def crear_producto(data):
    """
    Creates a new product in the inventory.
    Data: {nombre, descripcion, precio, stock_inicial, unidad_medida, foto_url}
    """
    try:
        producto = Inventario(
            nombre=data.get('nombre'),
            descripcion=data.get('descripcion'),
            precio=float(data.get('precio', 0)),
            stock_actual=int(data.get('stock_inicial', 0)),
            unidad_medida=data.get('unidad_medida', 'unidad'),
            foto_url=data.get('foto_url')
        )
        db.session.add(producto)
        db.session.commit()
        return producto, "Producto creado exitosamente"
    except Exception as e:
        db.session.rollback()
        raise e

def listar_productos():
    """Returns all products for selector or list view."""
    productos = Inventario.query.all()
    return [{
        "id": p.id_producto,
        "nombre": p.nombre,
        "descripcion": p.descripcion,
        "precio": p.precio,
        "stock": p.stock_actual,
        "unidad": p.unidad_medida
    } for p in productos]

def actualizar_stock(id_producto, cambio):
    """
    Updates stock. 
    cambio: positive to add, negative to remove.
    """
    try:
        producto = Inventario.query.get(id_producto)
        if not producto:
            return None, "Producto no encontrado"
        
        # Optionally allow negative stock or block it. 
        # For simplicity, let's allow it or just add.
        producto.stock_actual += int(cambio)
        db.session.commit()
        return producto, "Stock actualizado"
    except Exception as e:
        db.session.rollback()
        raise e

def editar_producto(id_producto, data):
    """
    Updates product details.
    """
    try:
        producto = Inventario.query.get(id_producto)
        if not producto:
            return None, "Producto no encontrado"

        if 'nombre' in data: producto.nombre = data['nombre']
        if 'descripcion' in data: producto.descripcion = data['descripcion']
        if 'precio' in data: producto.precio = float(data['precio'])
        if 'unidad_medida' in data: producto.unidad_medida = data['unidad_medida']
        if 'foto_url' in data: producto.foto_url = data['foto_url']
        
        db.session.commit()
        return producto, "Producto actualizado"
    except Exception as e:
        db.session.rollback()
        raise e
