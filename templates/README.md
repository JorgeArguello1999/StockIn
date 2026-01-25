# README_FASE_3_UI.md - Especificación de Interfaz de Usuario (Frontend)

**Proyecto:** Sistema de Gestión Electromecánica JP
**Fase:** 3 - Vistas y Plantillas (Frontend)
**Objetivo:** Crear una experiencia de usuario fluida donde el operador no tenga que recargar la página ni navegar entre múltiples URLs.
**Tecnología Esperada:** HTML5, CSS (Bootstrap/Tailwind), Javascript (Vanilla o Alpine.js), Jinja2 (Templates).

---

## 1. Estructura de Vistas Requerida

El sistema constará estrictamente de **dos (2) vistas principales**. No crear páginas intermedias.

1.  **`/login` (Vista de Acceso):** Pantalla limpia, centrada, solo para autenticación.
2.  **`/dashboard` (La "Super Vista" Unificada):** Una única interfaz que contiene todos los módulos (Recepción, Taller, Caja, Admin) cargados pero ocultos/visibles según el rol y la pestaña activa.

---

## 2. Detalle de Vista: Signin (`templates/login.html`)

**Ruta:** `GET /login` | `POST /login`

Debe ser una página minimalista sin barra de navegación ni footer.
* **Formulario:**
    * Input: `Usuario` (referencia: `User.username` en `models/user.py`).
    * Input: `Contraseña`.
    * Botón: "Ingresar".
* **Comportamiento:**
    * Al éxito: Redirigir a `/dashboard`.
    * Al fallo: Mostrar alerta "Credenciales inválidas" sin recargar si es posible (AJAX), o flash message estándar.

---

## 3. Detalle de Vista: Dashboard Unificado (`templates/dashboard.html`)

**Ruta:** `GET /dashboard`
**Protección:** `@login_required`.
**Lógica de Renderizado:** El servidor debe inyectar el objeto `current_user` para validar el `role` ('admin' o 'mechanic') [ver `models/user.py`].

### A. Estructura del Layout (Skeleton)

La página debe dividirse en:
1.  **Sidebar/Navbar (Izquierda o Arriba):** Menú de navegación persistente.
2.  **Área de Contenido Principal (`#main-content`):** Aquí se renderizan los distintos "Paneles" como `divs`. Solo un panel está visible a la vez.

### B. Lógica de Roles en el Frontend

Utiliza Jinja2 para **no renderizar** HTML que el usuario no debe ver (seguridad por servidor).

#### **1. Rol: ADMIN (`user.role == 'admin'`)**
El Admin tiene acceso total. Su menú debe tener botones que activen los siguientes paneles (divs):

* **Panel Recepción:**
    * Formulario para ingresar Placa.
    * Botón "Nueva Orden" (Abre Modal de Registro).
* **Panel Taller (Monitor):**
    * Vista global de todos los autos en proceso (Kanban o Tabla).
* **Panel Ventas (POS):**
    * Buscador de productos.
    * Carrito de compras de venta directa.
* **Panel Caja/Liquidación:**
    * Lista de Órdenes "Finalizadas" listas para cobrar.
    * Botón "Generar Factura".

#### **2. Rol: MECÁNICO (`user.role == 'mechanic'`)**
El Mecánico tiene una vista simplificada. Su menú **solo** muestra:

* **Panel "Mis Trabajos" (Taller Simplificado):**
    * Muestra solo las Órdenes de Trabajo asignadas o pendientes.
    * **Acción Clave:** Cada tarjeta de auto debe tener un botón **"Solicitar Repuesto"**.
        * Este botón abre un modal para buscar una pieza y agregarla a la OT (conecta con API `agregar_repuesto_a_orden`).
    * **Acción Clave:** Botón **"Finalizar Trabajo"** (Cambia estado a 'Finalizada').
* **Restricción:** El Mecánico **NO DEBE VER** ni recibir en el HTML el código de los paneles de Ventas, Caja o Recepción.

---

## 4. Guía de Implementación "Single View" (Javascript)

Para lograr que "el usuario no tenga que visitar más páginas", sigue este patrón:

1.  **Contenedores Ocultos:**
    Crea todos los paneles en el mismo HTML pero ocultos por defecto.
    ```html
    <div id="panel-recepcion" class="tab-content hidden">...</div>
    <div id="panel-taller" class="tab-content">...</div> <div id="panel-ventas" class="tab-content hidden">...</div>
    ```

2.  **Navegación JS:**
    Los botones del menú solo cambian la clase `hidden`.
    ```javascript
    function showPanel(panelId) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(panelId).classList.remove('hidden');
    }
    ```

3.  **Formularios vía AJAX (Fetch API):**
    **IMPORTANTE:** Los formularios (ej. "Registrar Cliente", "Agregar Repuesto", "Cobrar") **NO** deben hacer un submit tradicional (`<form action="...">`).
    * Deben interceptar el evento `submit`.
    * Enviar los datos (`JSON`) a los Endpoints de la API (creados en Fase 2).
    * Al recibir el `200 OK`, actualizar solo la tabla o el dato necesario en la pantalla sin recargar (`window.location.reload()` está prohibido salvo casos críticos).

---

## 5. Resumen de Permisos Visuales

| Componente UI | Admin | Mecánico |
| :--- | :---: | :---: |
| **Login** | ✅ | ✅ |
| **Sidebar: Recepción** | ✅ | ❌ |
| **Sidebar: Taller** | ✅ (Control Total) | ✅ (Solo Ejecución) |
| **Sidebar: Ventas (POS)** | ✅ | ❌ |
| **Sidebar: Liquidación** | ✅ | ❌ |
| **Botón: Agregar Repuesto** | ✅ | ✅ |
| **Botón: Facturar** | ✅ | ❌ |

---

## 6. Entregables Esperados

1.  Archivo `templates/login.html`.
2.  Archivo `templates/dashboard.html` (con lógica Jinja `{% if current_user.role ... %}`).
3.  Archivo `static/js/dashboard.js` (Manejo de pestañas y llamadas a API).