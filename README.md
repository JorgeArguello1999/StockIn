# StockIn 🚗💨

### Professional Workshop & Inventory Management System

**StockIn** is the all-in-one solution designed to modernize automotive workshops and service centers. By unifying reception, repairs, inventory, and billing into a single, intuitive interface, StockIn drives efficiency and enhances the customer experience.

---

## ✨ Why StockIn? (Key Features)

### 🔄 Unified Workflow

Stop juggling multiple tools. From the moment a vehicle enters the reception to the final invoice, every step is connected.

- **Reception**: Instant vehicle lookup, recurring client data, and quick digital intake forms.
- **Workshop (Taller)**: Assign parts to orders in real-time.
- **Billing**: One-click conversion from "Finished Job" to "Paid Invoice".

### 🔧 Smart Kanban Board

Visualize your workshop's pulse. A drag-and-drop style interface (visualized as lists) helps mechanics and managers track progress instantly:

- **Pendiente**: Jobs waiting for attention.
- **En Proceso**: Active repairs.
- **Listos**: Vehicles ready for delivery.

### 🛒 Point of Sale (POS) & Inventory

Manage your stock with precision.

- **Real-time Inventory**: Track parts, oil, and kits. Warns you when stock is low.
- **Barcode Support**: Built-in barcode generation for products and repair orders.
- **Smart Cart**: Add items to a cart and bill them to a client or a repair order seamlessly.

### 🎨 Modern & Responsive Design

Built with a sleek, dark-themed UI that looks professional on tablets and desktops. High-contrast elements and intuitive navigation ensure your team spends less time clicking and more time working.

---

## 🚀 Technical Stack

Built for performance, stability, and ease of deployment.

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | **Python 3.13 + Flask** | Robust, scalable, and secure REST API. |
| **Database** | **SQLite (Production-ready)** | Reliable relational data storage with SQLAlchemy ORM. |
| **Frontend** | **HTML5 / CSS3 / JS** | Lightweight, vanilla implementation for maximum speed. |
| **Deployment** | **Docker** | Containerized for "write once, run anywhere" reliability. |
| **Server** | **Gunicorn** | Production-grade WSGI HTTP Server. |

---

## 🛠️ Installation & Setup

### Option 1: Docker (Recommended)

Get up and running in seconds. Perfect for production or quick testing.

1. **Build the Image**:

    ```bash
    docker build -t stockin-prod .
    ```

2. **Run the Container**:

    ```bash
    docker run -p 5000:5000 stockin-prod
    ```

3. **Access**: Open `http://localhost:5000` in your browser.

### Option 2: Manual Setup (Development)

If you want to contribute code or run without Docker.

1. **Clone & Enter**:

    ```bash
    git clone <repository_url>
    cd StockIn
    ```

2. **Virtual Environment**:

    ```bash
    python -m venv .venv
    source .venv/bin/activate  # Linux/Mac
    # .venv\Scripts\activate   # Windows
    ```

3. **Install Dependencies**:

    ```bash
    pip install -r requirements.txt
    # or if using pyproject.toml
    pip install .
    ```

4. **Run**:

    ```bash
    flask run
    ```

---

## 📂 Project Structure

```
StockIn/
├── app.py              # Application Entry Point
├── Dockerfile          # Production Docker Configuration
├── pyproject.toml      # Dependency Management
├── models/             # Database Models (User, Client, Product, Order)
├── routes/             # API & View Blueprints
├── services/           # Business Logic Layer
├── static/             # CSS, JS, Images, Invoices
└── templates/          # HTML Templates (Unified Dashboard)
```
