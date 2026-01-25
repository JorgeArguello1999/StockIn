from extensions import db

class Inventario(db.Model):
    id_producto = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.String(255), nullable=True)
    precio = db.Column(db.Float, nullable=False)
    stock_actual = db.Column(db.Integer, nullable=False, default=0)
    unidad_medida = db.Column(db.String(20), nullable=False, default='unidad') # unidad, litro, galon, etc.
    foto_url = db.Column(db.String(255), nullable=True)
    es_favorito = db.Column(db.Boolean, default=False)
    activo = db.Column(db.Boolean, default=True, nullable=False)

    def validar_stock(self, cantidad):
        return self.stock_actual >= cantidad

    def descontar_stock(self, cantidad):
        if self.validar_stock(cantidad):
            self.stock_actual -= cantidad
            return True
        return False

    def __repr__(self):
        return f'<Inventario {self.nombre}>'
