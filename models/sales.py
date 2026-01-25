from extensions import db
from datetime import datetime

class Venta(db.Model):
    id_venta = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    total = db.Column(db.Float, default=0.0)

    detalles = db.relationship('VentaDetalle', backref='venta', lazy=True)

    def __repr__(self):
        return f'<Venta {self.id_venta}>'

class VentaDetalle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    venta_id = db.Column(db.Integer, db.ForeignKey('venta.id_venta'), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey('inventario.id_producto'), nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    
    producto = db.relationship('Inventario')
