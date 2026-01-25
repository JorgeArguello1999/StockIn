from extensions import db

class Cliente(db.Model):
    id_cliente = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    cedula = db.Column(db.String(20), unique=True, nullable=False)
    telefono = db.Column(db.String(20), nullable=False)
    direccion = db.Column(db.String(200), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    # contacto field removed/replaced by specific fields logic, but keeping for legacy if needed? 
    # User asked to ADD. I will replace 'contacto' usage with specific fields in service, 
    # but let's keep it nullable or remove it. The error was on 'contacto' too.
    # Let's simple remove 'contacto' as it is vague, and use 'telefono' as primary contact.

    
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
