# README_FASE_2.md - Lógica de Negocio y API

**Proyecto:** Sistema de Gestión Electromecánica JP
**Fase:** 2 - Implementación de Controladores (Servicios) y API
**Estado Actual:** Modelos de Base de Datos (Entidades) completados.

---

## 1. Objetivo de esta Fase

Ya contamos con la capa de datos (`models/`). Ahora necesitamos crear la **Capa Lógica (Services)** y la **Capa de Acceso (Routes/Blueprints)**.

Tu tarea es traducir las interacciones de los Diagramas de Secuencia (mensajes entre líneas de vida) en funciones de Python que manipulen la base de datos de forma transaccional.

**Arquitectura Sugerida:**

```text
/app
  /models       <-- (LISTO)
  /services     <-- (TU OBJETIVO: Aquí va la lógica pesada: Gestores)
  /routes       <-- (TU OBJETIVO: Aquí van los endpoints Flask que llaman a los services)

```

---

## 2. Especificación de Servicios (Gestores)

Debes crear los siguientes servicios basándote en los métodos definidos en los modelos y los flujos de los diagramas.

### A. Servicio de Recepción (`services/auth_service.py` y `services/registro_service.py`)

**Referencia:** Diagrama "Registro de Entrada y OT".

1. **`validar_vehiculo(placa)`**:

* Busca si el vehículo existe en la BD.
* Retorna datos del cliente y vehículo, o `null` si es nuevo.

1. **`procesar_registro(datos_json)`**:

* *Input:* Datos de Cliente, Vehículo, Problema, Checklist.
* *Lógica:* * Si el cliente no existe, crearlo.
* Si el vehículo no existe, crearlo y asignarlo al cliente.
* **Crear la Orden de Trabajo (OT)** con estado inicial `Pendiente`.

* *Output:* Retornar el `numeroOT` generado.

### B. Servicio de Taller (`services/taller_service.py`)

**Referencia:** Diagrama "Gestión de Taller y Repuestos".

1. **`iniciar_servicio(numero_ot)`**:

* Cambiar estado de la OT de `Pendiente` a `En Proceso`.

1. **`agregar_repuesto_a_orden(numero_ot, id_producto, cantidad)`** (CRÍTICO):

* Esta función debe ser **atómica (Transaction)**.
* 1. Verificar stock usando el método `Inventario.validar_stock(cantidad)`.

* 1. Si hay stock, llamar a `Inventario.descontar_stock(cantidad)`.

* 1. Crear registro en `OrdenDetalleRepuesto` con el `precio_snapshot` actual del producto.

* 1. Si algo falla, hacer rollback.

1. **`finalizar_orden(numero_ot)`**:

* Cambiar estado de la OT a `Finalizada`.
* Notificar (puede ser un simple return por ahora).

### C. Servicio de Ventas POS (`services/venta_service.py`)

**Referencia:** Diagrama "Venta Directa".

1. **`realizar_venta_directa(items_lista)`**:

* *Input:* Lista de `{id_producto, cantidad}`.
* *Lógica:*
* Calcular total.
* Crear objeto `Venta`.
* Iterar items: validar stock, descontar stock, crear `VentaDetalle`.

* *Validación:* Si un solo producto no tiene stock, cancelar toda la venta.

### D. Servicio de Facturación (`services/facturacion_service.py`)

**Referencia:** Diagrama "Liquidación y Facturación".

1. **`pre_liquidar_ot(numero_ot)`**:

* Obtener OT.
* Sumar costo de todos los repuestos (`OrdenDetalleRepuesto`).
* Retornar subtotal repuestos para mostrar en pantalla.

1. **`generar_factura_final(numero_ot, monto_mano_obra, metodo_pago)`**:

* Actualizar `OrdenTrabajo.monto_mano_obra`.
* Calcular `total_final` = (Suma Repuestos) + (Mano de Obra).
* Crear objeto `Factura` vinculado a la OT.
* Cambiar estado de OT a `Pagada/Cerrada`.

---

## 3. Requerimientos Técnicos Importantes

### Uso de Métodos de Modelos Existentes

El desarrollador anterior ya dejó lógica útil en los modelos. **ÚSALOS**:

* **Inventario:** No restes stock manualmente. Usa `producto.descontar_stock(cantidad)` que ya incluye validación (ver `inventory.py`).
* **Relaciones:** Aprovecha `orden.detalles` y `venta.detalles` (definidos en los `db.relationship`) para acceder a los ítems sin hacer queries SQL manuales.

### Manejo de Errores (HTTP Codes)

Tus endpoints (`routes`) deben responder apropiadamente:

* `200 OK`: Éxito.
* `201 Created`: Recurso creado (ej. Nueva OT).
* `400 Bad Request`: Stock insuficiente o datos inválidos.
* `404 Not Found`: Vehículo u OT no encontrada.
* `500 Internal Server Error`: Fallo de base de datos.

---

## 4. Ejemplo de Implementación Esperada

Aquí tienes un ejemplo de cómo espero que se vea el método crítico de agregar repuestos en `services/taller_service.py`:

```python
from extensions import db
from models.inventory import Inventario
from models.work_order import OrdenTrabajo, OrdenDetalleRepuesto

def agregar_repuesto_service(numero_ot, id_producto, cantidad):
    try:
        # 1. Obtener entidades
        ot = OrdenTrabajo.query.get(numero_ot)
        producto = Inventario.query.get(id_producto)
        
        if not ot or not producto:
            return {"error": "OT o Producto no encontrado"}, 404

        # 2. Validar Stock (Usando método del modelo)
        if not producto.validar_stock(cantidad):
            return {"error": f"Stock insuficiente. Disponible: {producto.stock_actual}"}, 400

        # 3. Transacción
        producto.descontar_stock(cantidad) # Actualiza stock
        
        detalle = OrdenDetalleRepuesto(
            orden_id=numero_ot,
            producto_id=id_producto,
            cantidad=cantidad,
            precio_snapshot=producto.precio # Guardamos precio histórico
        )
        
        db.session.add(detalle)
        db.session.commit()
        
        return {"mensaje": "Repuesto agregado correctamente"}, 200

    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500

```

---

## 5. Próximos Pasos (Entregables)

1. Crear carpeta `services/` con la lógica arriba descrita.
2. Crear carpeta `routes/` con los endpoints API (ej: `POST /api/ordenes`, `POST /api/ordenes/<id>/repuestos`).
3. Probar flujo completo de una OT (Crear -> Agregar Repuesto -> Liquidar) con Postman.
