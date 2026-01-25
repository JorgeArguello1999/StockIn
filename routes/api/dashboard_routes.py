from flask import Blueprint, jsonify
from services.dashboard_service import get_dashboard_metrics

dashboard_api = Blueprint('dashboard_api', __name__, url_prefix='/api/dashboard')

@dashboard_api.route('/metrics', methods=['GET'])
def metrics():
    try:
        data = get_dashboard_metrics()
        return jsonify(data), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
