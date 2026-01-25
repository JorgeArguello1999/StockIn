// Global State
let carrito = [];
const API_BASE = '/api';

// Navigation
function showPanel(panelId, btn) {
    // Hide all panels
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    // Show target panel
    document.getElementById(panelId).classList.add('active');

    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Trigger loads if needed
    if (panelId === 'panel-recepcion') initReception();
    if (panelId === 'panel-taller') refreshTaller();
    if (panelId === 'panel-ventas') initPOS();
    if (panelId === 'panel-caja') loadLiquidaciones();
}

// Modals
function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// === RECEPCIÓN ===

let localVehicles = [];

async function initReception() {
    await fetchVehicles();
    renderReception(localVehicles);
}

async function fetchVehicles() {
    try {
        const res = await fetch(`${API_BASE}/registro/listar`);
        if(res.ok) localVehicles = await res.json();
    } catch(e) { console.error(e); }
}

function renderReception(list) {
    const grid = document.getElementById('reception-grid');
    grid.innerHTML = '';

    // "Add New" Card
    const addCard = document.createElement('div');
    addCard.className = 'inventory-card inventory-card-add';
    addCard.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 3rem; color: var(--primary-color);">+</div>
            <div style="font-weight: 600;">Nuevo Ingreso</div>
        </div>
    `;
    addCard.onclick = () => openModal('modal-nuevo-ingreso');
    grid.appendChild(addCard);

    // Vehicle Cards
    list.forEach(v => {
        const card = document.createElement('div');
        card.className = 'inventory-card';
        card.innerHTML = `
            <div class="inv-img" style="background: #1e293b; height: 80px;">
                <span style="font-size: 2rem;">🚗</span>
            </div>
            <div class="inv-body">
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); text-align: center; margin-bottom: 0.5rem;">
                    ${v.placa}
                </div>
                <div style="font-weight: 600;">${v.marca} ${v.modelo}</div>
                <div class="inv-meta" style="margin-top: 0.5rem;">
                    <div>👤 ${v.cliente.nombre}</div>
                    <div>🆔 ${v.cliente.cedula}</div>
                    <div>📞 ${v.cliente.telefono}</div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterReception(query) {
    query = query.toLowerCase();
    const filtered = localVehicles.filter(v => 
        v.placa.toLowerCase().includes(query) || 
        v.cliente.nombre.toLowerCase().includes(query) ||
        v.cliente.cedula.includes(query)
    );
    renderReception(filtered);
}

// Deprecated old functions (keeping helpers if needed, but UI replaced)
async function checkPlaca(placa) {
   // ... kept for modal internal logic if recycled
}

async function handleIngreso(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_BASE}/registro/crear`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if(response.ok) {
            alert('Ingreso registrado con éxito');
            closeModal('modal-nuevo-ingreso');
            e.target.reset();
        } else {
            alert('Error: ' + result.error);
        }
    } catch(err) {
        alert('Error de conexión');
    }
}

// === TALLER ===

// Mock data fetch - in real app would hit an endpoint like /api/taller/ordenes
// Since we don't have a "list all orders" endpoint in the provided snippets, 
// I will simulate it or assume we need to create one. 
// For now, I'll assume we can implement a basic fetch later. 
// I'll make a placeholder function.

async function refreshTaller() {
    document.querySelectorAll('.card-list').forEach(el => el.innerHTML = '');
    
    try {
        const response = await fetch(`${API_BASE}/taller/ordenes`);
        if(!response.ok) return console.error("Error fetching orders");
        
        const ordenes = await response.json();
        
        ordenes.forEach(ot => {
            let colId = '';
            if(ot.estado === 'Pendiente') colId = 'col-pendiente';
            else if(ot.estado === 'En Proceso') colId = 'col-proceso';
            else if(ot.estado === 'Finalizada') colId = 'col-listo';
            
            if(colId) createOtCard(ot, colId);
        });
    } catch(e) {
        console.error("Connection error", e);
    }
}

function createOtCard(ot, columnId) {
    const col = document.querySelector(`#${columnId} .card-list`);
    if (!col) return;
    
    const div = document.createElement('div');
    div.className = 'ot-card';
    div.innerHTML = `
        <div class="ot-header">
            <span class="ot-plate">${ot.placa}</span>
            <span class="ot-id">#${ot.id}</span>
        </div>
        <div>Estado: ${ot.estado}</div>
        <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
            <button class="btn btn-sm btn-primary" onclick="openRepuestoModal(${ot.id})">+ Repuesto</button>
            ${ot.estado === 'pendiente' ? 
                `<button class="btn btn-sm btn-success" onclick="startWork(${ot.id})">Iniciar</button>` : 
                `<button class="btn btn-sm btn-danger" onclick="finishWork(${ot.id})">Finalizar</button>`
            }
        </div>
    `;
    col.appendChild(div);
}

// Actions
async function startWork(otId) {
    if(!confirm('¿Iniciar trabajo en esta OT?')) return;
    try {
        const res = await fetch(`${API_BASE}/taller/iniciar/${otId}`, {method: 'POST'});
        if(res.ok) refreshTaller();
        else showAlert('Error al iniciar', 'Error');
    } catch(e) { console.error(e); }
}

async function finishWork(otId) {
    if(!confirm('¿Finalizar trabajo?')) return;
    try {
        const res = await fetch(`${API_BASE}/taller/finalizar/${otId}`, {method: 'POST'});
        if(res.ok) refreshTaller();
        else showAlert('Error al finalizar', 'Error');
    } catch(e) { console.error(e); }
}

function openRepuestoModal(otId) {
    document.getElementById('repuesto-ot-id').value = otId;
    openModal('modal-repuesto');
}

async function handleAddRepuesto(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const res = await fetch(`${API_BASE}/taller/repuestos`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if(res.ok) {
            showAlert(`Repuesto agregado: ${result.producto} ($${result.precio})`, 'Éxito');
            closeModal('modal-repuesto');
            e.target.reset();
        } else {
            showAlert('Error: ' + result.error, 'Error');
        }
    } catch(e) { showAlert('Error de red', 'Error'); }
}


// === VENTAS (POS) ===

// Inventory State
let localInventory = [];

// Init POS (called when showing panel)
async function initPOS() {
    await fetchInventory();
    renderInventory(localInventory);
}

// Fetch
async function fetchInventory() {
    try {
        const res = await fetch(`${API_BASE}/inventario/listar`);
        if(res.ok) {
            localInventory = await res.json();
        }
    } catch(e) { console.error(e); }
}

// Custom Alert
function showAlert(message, title='Aviso') {
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;
    openModal('modal-alert');
}

// Render
function renderInventory(items) {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';

    // "Add New" Card
    const addCard = document.createElement('div');
    addCard.className = 'inventory-card inventory-card-add';
    addCard.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 3rem; color: var(--primary-color);">+</div>
            <div style="font-weight: 600;">Crear Nuevo</div>
        </div>
    `;
    addCard.onclick = () => openModal('modal-crear-producto');
    grid.appendChild(addCard);

    // Item Cards
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'inventory-card';
        // Placeholder handling
        const imgSrc = item.foto_url && item.foto_url.trim() !== '' ? item.foto_url : 'https://placehold.co/200x120?text=No+Image';
        
        // Escape json for onclick
        const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');

        card.innerHTML = `
            <div style="position: absolute; top: 5px; right: 5px; z-index: 10;">
                <button class="btn btn-sm" style="background: rgba(0,0,0,0.5); padding: 2px 6px;" onclick="openEditModal(${itemJson})">✏️</button>
            </div>
            <div class="inv-img">
                <img src="${imgSrc}" onerror="this.src='https://placehold.co/200x120?text=Error'">
            </div>
            <div class="inv-body">
                <div class="inv-title">${item.nombre}</div>
                <div class="inv-meta">ID: ${item.id} | ${item.unidad || 'u'}</div>
                <div class="inv-price">$${item.precio.toFixed(2)}</div>
                
                <div style="text-align: center; margin: 0.5rem 0;">
                    <svg id="barcode-${item.id}"></svg>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.8rem; color:var(--text-secondary);">Stock: <b id="stock-${item.id}">${item.stock}</b></span>
                </div>

                <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="addToCartItem(${item.id}, '${item.nombre}', ${item.precio})">
                    Agregar 🛒
                </button>
            </div>
        `;
        grid.appendChild(card);
        
        // Render Barcode
        try {
            JsBarcode(`#barcode-${item.id}`, item.id.toString(), {
                format: "CODE128",
                width: 1.5,
                height: 30,
                displayValue: true
            });
        } catch(e) { console.error("Barcode error", e); }
    });
}

function openScanner() {
    showAlert("La función de escáner de cámara estará disponible pronto.", "Cámara");
}

// Edit Logic
function openEditModal(item) {
    document.getElementById('edit-prod-id').value = item.id;
    document.getElementById('edit-nombre').value = item.nombre;
    document.getElementById('edit-descripcion').value = item.descripcion || '';
    document.getElementById('edit-precio').value = item.precio;
    document.getElementById('edit-unidad').value = item.unidad || 'unidad';
    document.getElementById('edit-foto').value = item.foto_url || '';
    
    openModal('modal-editar-producto');
}

async function handleEditProduct(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const id = data.id;
    
    try {
        const res = await fetch(`${API_BASE}/inventario/editar/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        if(res.ok) {
            showAlert('Producto actualizado', 'Éxito');
            closeModal('modal-editar-producto');
            fetchInventory().then(() => renderInventory(localInventory)); // Refresh
        } else {
            showAlert('Error al actualizar', 'Error');
        }
    } catch(e) { showAlert('Error de red', 'Error'); }
}

// Filter
function filterInventory(query) {
    query = query.toLowerCase();
    const filtered = localInventory.filter(item => 
        item.nombre.toLowerCase().includes(query) || 
        item.id.toString().includes(query)
    );
    renderInventory(filtered);
}

// Quick Stock Update
async function updateStock(id, delta) {
    // Optimistic UI update
    const stockEl = document.getElementById(`stock-${id}`);
    const current = parseInt(stockEl.innerText);
    stockEl.innerText = current + delta;
    
    // Update local state
    const item = localInventory.find(i => i.id === id);
    if(item) item.stock += delta;

    try {
        await fetch(`${API_BASE}/inventario/stock`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id: id, cambio: delta})
        });
    } catch(e) { console.error(e); }
}

// Cart Logic
function addToCartItem(id, nombre, precio) {
    const existing = carrito.find(i => i.id_producto === id);
    if(existing) {
        existing.cantidad++;
    } else {
        carrito.push({id_producto: id, nombre: nombre, precio: precio, cantidad: 1});
    }
    renderCart();
}

function renderCart() {
    const cartDiv = document.getElementById('pos-cart');
    const totalEl = document.getElementById('cart-total');
    let total = 0;

    if(carrito.length === 0) {
        cartDiv.innerHTML = `<p style="color: var(--text-secondary); text-align: center;">Carrito vacío</p>`;
        totalEl.innerText = "$0.00";
        return;
    }

    cartDiv.innerHTML = carrito.map((item, idx) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        return `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding: 0.5rem 0; align-items: center;">
            <div style="font-size: 0.9rem;">
                <div style="font-weight: 500;">${item.nombre}</div>
                <div style="color: var(--text-secondary); font-size: 0.8rem;">$${item.precio} x ${item.cantidad}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 600;">$${subtotal.toFixed(2)}</div>
                <button class="btn btn-sm btn-danger" style="padding: 2px 6px; font-size: 0.7rem; margin-top: 2px;" onclick="removeFromCart(${idx})">Eliminar</button>
            </div>
        </div>
    `}).join('');
    
    totalEl.innerText = `$${total.toFixed(2)}`;
}

function removeFromCart(idx) {
    carrito.splice(idx, 1);
    renderCart();
}

async function processSale() {
    if(carrito.length === 0) return showAlert("Carrito vacío", "Aviso");
    
    try {
        const res = await fetch(`${API_BASE}/venta/crear`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({items: carrito})
        });
        const result = await res.json();
        
        if(res.ok) {
            showAlert(result.mensaje, 'Venta Confirmada');
            carrito = [];
            renderCart();
            // Refresh inventory grid to show updated stock
            fetchInventory().then(() => renderInventory(localInventory));
        } else {
            showAlert('Error: ' + result.error, 'Error');
        }
    } catch(e) { showAlert('Error de red', 'Error'); }
}


// === CAJA ===

// Placeholder for listing liquidations
// Needs an endpoint like /api/facturacion/pendientes
async function loadLiquidaciones() {
    console.log("Loading liquidaciones...");
    // Mock
    /*
    const tbody = document.getElementById('lista-caja');
    tbody.innerHTML = `
        <tr>
            <td>101</td>
            <td>ABC-123</td>
            <td>$150.00</td>
            <td><input type="number" placeholder="Monto MO" id="mo-101"></td>
            <td><button class="btn btn-sm btn-success" onclick="facturar(101)">Cobrar</button></td>
        </tr>
    `;
    */
}

async function facturar(otId) {
    const mo = document.getElementById(`mo-${otId}`).value;
    if(!mo) return showAlert("Ingrese mano de obra", "Aviso");
    
    try {
        const res = await fetch(`${API_BASE}/facturacion/facturar/${otId}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                monto_mano_obra: parseFloat(mo),
                metodo_pago: 'efectivo' // hardcoded for demo
            })
        });
        const result = await res.json();
        
        if(res.ok) {
            showAlert(`Factura #${result.nro_factura} generada. Total: $${result.total}`, 'Factura Exitosa');
            loadLiquidaciones();
        } else {
            showAlert('Error: ' + result.error, 'Error');
        }
    } catch(e) { showAlert('Error de red', 'Error'); }
}

async function handleCreateProduct(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        const res = await fetch(`${API_BASE}/inventario/crear`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if(res.ok) {
            showAlert(`Producto creado: ${result.nombre} (ID: ${result.id})`, 'Éxito');
            closeModal('modal-crear-producto');
            e.target.reset();
        } else {
            showAlert('Error: ' + result.error, 'Error');
        }
    } catch(e) { showAlert('Error de red', 'Error'); }
}

async function handleEditProduct(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const id = data.id;
    
    try {
        const res = await fetch(`${API_BASE}/inventario/editar/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        if(res.ok) {
            showAlert('Producto actualizado', 'Éxito');
            closeModal('modal-editar-producto');
            fetchInventory().then(() => renderInventory(localInventory)); // Refresh
        } else {
            showAlert('Error al actualizar', 'Error');
        }
    } catch(e) { showAlert('Error de red', 'Error'); }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    const activePanel = document.querySelector('.panel.active');
    if(activePanel) {
        const id = activePanel.id;
        if(id === 'panel-recepcion') initReception();
        if(id === 'panel-taller') refreshTaller();
        if(id === 'panel-ventas') initPOS();
        if(id === 'panel-caja') loadLiquidaciones();
    }
});
