from app.routes import bp

@bp.route('/')
def index():
    return "Hello, StockIn!"

@bp.route('/health')
def health_check():
    return {"status": "healthy"}, 200
