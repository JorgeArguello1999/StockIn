from extensions import db
from datetime import datetime

class OrdenTrabajo(db.Model):
    numeroOT = db.Column(db.Integer, primary_key=True)
    placa_vehiculo = db.Column(db.String(20), db.ForeignKey('vehiculo.placa'), nullable=False)
    sintomas = db.Column(db.Text, nullable=True)
    categoria_color = db.Column(db.String(20), nullable=True) # Express priority
    estado = db.Column(db.String(20), default='Pendiente') # Pendiente, En Proceso, Finalizada, Pagada
    fecha_ingreso = db.Column(db.DateTime, default=datetime.utcnow)
    monto_mano_obra = db.Column(db.Float, default=0.0)

    # Relationships
    detalles = db.relationship('OrdenDetalleRepuesto', backref='orden', lazy=True)
    vehiculo = db.relationship('Vehiculo', backref='ordenes')

    def __repr__(self):
        return f'<OrdenTrabajo {self.numeroOT}>'

class OrdenDetalleRepuesto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    orden_id = db.Column(db.Integer, db.ForeignKey('orden_trabajo.numeroOT'), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey('inventario.id_producto'), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    precio_snapshot = db.Column(db.Float, nullable=False) # Price at the moment of adding to order

    producto = db.relationship('Inventario')
