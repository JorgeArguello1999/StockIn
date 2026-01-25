from extensions import db
from datetime import datetime

class Factura(db.Model):
    nro_factura = db.Column(db.Integer, primary_key=True)
    orden_id = db.Column(db.Integer, db.ForeignKey('orden_trabajo.numeroOT'), nullable=True)
    venta_id = db.Column(db.Integer, db.ForeignKey('venta.id_venta'), nullable=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('cliente.id_cliente'), nullable=False)
    fecha_emision = db.Column(db.DateTime, default=datetime.now)
    total_final = db.Column(db.Float, nullable=False)
    metodo_pago = db.Column(db.String(50), nullable=True)

    # Relationships
    orden = db.relationship('OrdenTrabajo', backref='factura')
    venta = db.relationship('Venta', backref='factura')
    cliente = db.relationship('Cliente', backref='facturas')

    def __repr__(self):
        return f'<Factura {self.nro_factura}>'
