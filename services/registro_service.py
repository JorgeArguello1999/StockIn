from extensions import db
from models.client_vehicle import Cliente, Vehiculo
from models.work_order import OrdenTrabajo

def validar_vehiculo(placa):
    """
    Check if a vehicle exists.
    Returns: Dict with vehicle and client info, or None.
    """
    vehiculo = Vehiculo.query.get(placa)
    if not vehiculo:
        return None
    
    return {
        "placa": vehiculo.placa,
        "marca": vehiculo.marca,
        "modelo": vehiculo.modelo,
        "cliente": {
            "id": vehiculo.propietario.id_cliente,
            "nombre": vehiculo.propietario.nombre,
            "nombre": vehiculo.propietario.nombre,
            "cedula": vehiculo.propietario.cedula,
            "telefono": vehiculo.propietario.telefono
        }
    }

def procesar_registro(data):
    """
    Process inflow registration.
    Input data: {
        "placa": str, "marca": str, "modelo": str,
        "cliente_nombre": str, "cliente_contacto": str,
        "sintomas": str, "categoria_color": str
    }
    """
    try:
        # 1. Handle Client
        # Note: In a real app we might search by ID or strict name match. 
        # Here we assume if vehicle doesn't exist or we want to create/update.
        # But per logic: "Si cliente no existe, crearlo". 
        # We'll search by phone/contact if possible or just create new for simplicity if no ID provided.
        # For this MVP, let's check if the vehicle exists to find the owner, else create new.
        
        placa = data.get('placa')
        vehiculo = Vehiculo.query.get(placa)
        
        if vehiculo:
            cliente = vehiculo.propietario
        else:
            # Create Client first
            cliente = Cliente(
                nombre=data.get('cliente_nombre'),
                cedula=data.get('cliente_cedula'),
                telefono=data.get('cliente_telefono'),
                direccion=data.get('cliente_direccion'),
                email=data.get('cliente_email')
            )
            db.session.add(cliente)
            db.session.flush() # Get ID
            
            # Create Vehicle
            vehiculo = Vehiculo(
                placa=placa,
                marca=data.get('marca'),
                modelo=data.get('modelo'),
                cliente_id=cliente.id_cliente
            )
            db.session.add(vehiculo)
            db.session.flush()

        # 2. Create OT
        orden = OrdenTrabajo(
            placa_vehiculo=vehiculo.placa,
            sintomas=data.get('sintomas'),
            categoria_color=data.get('categoria_color'),
            estado='Pendiente'
        )
        db.session.add(orden)
        db.session.commit()
        
        return {"numeroOT": orden.numeroOT, "mensaje": "Orden creada exitosamente"}

    except Exception as e:
        db.session.rollback()
        raise e

def listar_vehiculos():
    """Returns list of vehicles with owner info."""
    vehiculos = Vehiculo.query.all()
    return [{
        "placa": v.placa,
        "marca": v.marca,
        "modelo": v.modelo,
        "cliente": {
            "nombre": v.propietario.nombre,
            "cedula": v.propietario.cedula,
            "telefono": v.propietario.telefono
        }
    } for v in vehiculos]

def eliminar_vehiculo(placa):
    """
    Deletes a vehicle.
    Returns: (bool, message)
    """
    try:
        vehiculo = Vehiculo.query.get(placa)
        if not vehiculo:
            return False, "Vehículo no encontrado"
        
        db.session.delete(vehiculo)
        db.session.commit()
        return True, "Vehículo eliminado"
    except Exception as e:
        db.session.rollback()
        if "foreign key constraint" in str(e).lower():
            return False, "No se puede eliminar: tiene órdenes de trabajo asociadas."
        return False, str(e)

def editar_vehiculo(placa, data):
    """
    Updates vehicle and owner info.
    data format similar to create but for updates.
    Returns: (dict, message) or (None, error_message)
    """
    try:
        vehiculo = Vehiculo.query.get(placa)
        if not vehiculo:
            return None, "Vehículo no encontrado"
        
        # Update Vehicle Fields
        if 'marca' in data: vehiculo.marca = data['marca']
        if 'modelo' in data: vehiculo.modelo = data['modelo']
        
        # Update Owner Fields
        # Note: In complex systems we might handle owner change separately, 
        # but here we assume we are updating the current owner's details 
        # or we could switch owner if owner_id provided. 
        # For MVP, let's update current owner details.
        cliente = vehiculo.propietario
        if cliente:
             if 'cliente_nombre' in data: cliente.nombre = data['cliente_nombre']
             if 'cliente_cedula' in data: cliente.cedula = data['cliente_cedula']
             if 'cliente_telefono' in data: cliente.telefono = data['cliente_telefono']
        
        db.session.commit()
        return {
            "placa": vehiculo.placa,
            "marca": vehiculo.marca,
            "modelo": vehiculo.modelo
        }, "Vehículo actualizado"
    except Exception as e:
        db.session.rollback()
        raise e
