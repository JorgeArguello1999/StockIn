from extensions import db

class Cliente(db.Model):
    id_cliente = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    contacto = db.Column(db.String(100), nullable=False) # Phone or Email
    
    # Relationship: A client has many vehicles
    vehiculos = db.relationship('Vehiculo', backref='propietario', lazy=True)

    def __repr__(self):
        return f'<Cliente {self.nombre}>'

class Vehiculo(db.Model):
    placa = db.Column(db.String(20), primary_key=True)
    marca = db.Column(db.String(50), nullable=False)
    modelo = db.Column(db.String(50), nullable=False)
    cliente_id = db.Column(db.Integer, db.ForeignKey('cliente.id_cliente'), nullable=False)

    def __repr__(self):
        return f'<Vehiculo {self.placa}>'
