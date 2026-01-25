from extensions import db
from models.invoice import Factura
from models.work_order import OrdenTrabajo
from models.inventory import Inventario
from sqlalchemy import func
from datetime import datetime, timedelta, date

def get_dashboard_metrics():
    today = date.today()
    # first_day_of_month = today.replace(day=1) # Simple logic
    first_day_of_month = datetime(today.year, today.month, 1)

    # 1. Sales Today
    # Factura.fecha_emision is DateTime
    sales_today = db.session.query(func.sum(Factura.total_final))\
        .filter(func.date(Factura.fecha_emision) == today).scalar() or 0.0

    # 2. Sales Month
    sales_month = db.session.query(func.sum(Factura.total_final))\
        .filter(Factura.fecha_emision >= first_day_of_month).scalar() or 0.0

    # 3. Active Orders (Not Finalizada/Pagada)
    # Statuses: Pendiente, En Proceso. "Finalizada" is technically active until Paid/billed?
    # User flow: Pendiente -> En Proceso -> Finalizada (Ready to pay) -> Pagada (Done)
    # Let's count "In Workshop" = Pendiente + En Proceso
    active_orders = OrdenTrabajo.query.filter(OrdenTrabajo.estado.in_(['Pendiente', 'En Proceso'])).count()
    
    # 4. Low Stock
    low_stock_items = Inventario.query.filter(Inventario.stock <= 5).limit(5).all()
    low_stock_data = [
        {"nombre": i.nombre, "stock": i.stock} for i in low_stock_items
    ]

    # 5. Sales Trend (Last 7 Days)
    # Group by date
    seven_days_ago = datetime.now() - timedelta(days=6)
    trend_query = db.session.query(
        func.date(Factura.fecha_emision).label('fecha'),
        func.sum(Factura.total_final).label('total')
    ).filter(Factura.fecha_emision >= seven_days_ago)\
     .group_by(func.date(Factura.fecha_emision))\
     .order_by(func.date(Factura.fecha_emision))\
     .all()
    
    # Format for chart (fill missing days optionally, or let chart handle)
    # Simple list of {date: 'YYYY-MM-DD', total: 100}
    trend_data = []
    trend_map = {str(row.fecha): row.total for row in trend_query}
    
    # Generate last 7 days keys to ensure continuity (0 if no sale)
    labels = []
    data_points = []
    current = seven_days_ago
    for _ in range(7):
        d_str = current.strftime('%Y-%m-%d')
        labels.append(d_str)
        data_points.append(trend_map.get(d_str, 0))
        current += timedelta(days=1)
    
    # Add today if not covered by loop (usually loop covers today if range includes it)
    # Actually 7 days including today
    
    return {
        "ventas_hoy": sales_today,
        "ventas_mes": sales_month,
        "ordenes_activas": active_orders,
        "alertas_stock": low_stock_data,
        "trend": {
            "labels": labels,
            "data": data_points
        }
    }
