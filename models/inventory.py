from extensions import db

class Inventario(db.Model):
    id_producto = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    precio = db.Column(db.Float, nullable=False)
    stock_actual = db.Column(db.Integer, nullable=False, default=0)
    es_favorito = db.Column(db.Boolean, default=False)

    def validar_stock(self, cantidad):
        return self.stock_actual >= cantidad

    def descontar_stock(self, cantidad):
        if self.validar_stock(cantidad):
            self.stock_actual -= cantidad
            return True
        return False

    def __repr__(self):
        return f'<Inventario {self.nombre}>'
