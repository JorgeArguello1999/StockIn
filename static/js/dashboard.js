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
    if (panelId === 'panel-inicio') loadDashboardMetrics();
    if (panelId === 'panel-recepcion') initReception();
    if (panelId === 'panel-taller') refreshTaller();
    if (panelId === 'panel-ventas') initPOS();
    if (panelId === 'panel-caja') loadLiquidaciones();
    if (panelId === 'panel-facturas') loadFacturas();
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
        // Escape json
        const vJson = JSON.stringify(v).replace(/"/g, '&quot;');
        
        // Make entire card clickable
        card.onclick = (e) => {
            // Prevent if clicking delete
            if(e.target.tagName === 'BUTTON') return;
            openVehicleDetail(v);
        };
        card.style.cursor = 'pointer';

        card.innerHTML = `
            <div class="inv-img" style="background: #1e293b; height: 80px;">
                <span style="font-size: 2rem;">🚗</span>
            </div>
            <div class="inv-body">
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); text-align: center; margin-bottom: 0.5rem;">
                    ${v.placa}
                </div>
                <div style="font-weight: 600;">${v.marca} ${v.modelo}</div>
                
                <div style="text-align: center; margin: 0.5rem 0;">
                    <svg id="barcode-veh-${v.placa}"></svg>
                </div>
                
                <div class="inv-meta" style="margin-top: 0.5rem;">
                    <div>👤 ${v.cliente.nombre}</div>
                    <div>🆔 ${v.cliente.cedula}</div>
                    <div>📞 ${v.cliente.telefono}</div>
                </div>
                <div style="margin-top: 1rem; text-align: right;">
                    <button class="btn btn-sm btn-danger" onclick="handleDeleteVehicle('${v.placa}')">🗑️ Eliminar</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
        
        // Render Barcode
        try {
            JsBarcode(`#barcode-veh-${v.placa}`, v.placa, {
                format: "CODE128",
                width: 1.5,
                height: 30,
                displayValue: false
            });
        } catch(e) { console.error("Barcode error", e); }
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

// === SMART RECEPTION LOGIC ===

function resetIngresoForm() {
    document.getElementById('step-search-plate').classList.remove('hidden');
    document.getElementById('step-found-vehicle').classList.add('hidden');
    document.getElementById('step-new-vehicle').classList.add('hidden');
    
    document.getElementById('ingreso-placa-search').value = '';
    document.getElementById('form-full-registro').reset();
    document.getElementById('client-search-results').classList.add('hidden');
}

async function checkPlacaIngreso() {
    const placa = document.getElementById('ingreso-placa-search').value.trim().toUpperCase();
    if(!placa) return showAlert("Ingrese una placa", "Aviso");

    try {
        const res = await fetch(`${API_BASE}/registro/validar/${placa}`);
        if (res.ok) {
            // Found
            const vehicle = await res.json();
            showStepFound(vehicle);
        } else {
            // Not Found -> New
            showStepNew(placa);
        }
    } catch(e) {
        // Assume failure means network error, but 404 is handled by res.ok check above logically (validar returns 404 if not found)
        // If fetch fails (network), show alert. If 404, valid logic handles it.
         console.error(e); // If network error, might want to just assume new or retry
         showAlert("Error verificando placa. Intente de nuevo.", "Error");
    }
}

function showStepFound(vehicle) {
    document.getElementById('step-search-plate').classList.add('hidden');
    document.getElementById('step-found-vehicle').classList.remove('hidden');
    
    document.getElementById('found-placa-display').innerText = vehicle.placa;
    document.getElementById('found-veh-details').innerText = `${vehicle.marca} ${vehicle.modelo}`;
    document.getElementById('found-owner-details').innerText = `Prop: ${vehicle.cliente.nombre} (${vehicle.cliente.telefono})`;
    
    document.getElementById('found-placa-input').value = vehicle.placa;
}

function showStepNew(placa) {
    document.getElementById('step-search-plate').classList.add('hidden');
    document.getElementById('step-new-vehicle').classList.remove('hidden');
    
    document.getElementById('display-new-placa').innerText = placa;
    document.getElementById('new-placa-input').value = placa;
}

// Client Autocomplete
let clientSearchTimeout;
function debouncedClientSearch(query) {
    clearTimeout(clientSearchTimeout);
    clientSearchTimeout = setTimeout(() => searchClients(query), 300);
}

async function searchClients(query) {
    const resultsDiv = document.getElementById('client-search-results');
    if(query.length < 2) {
        resultsDiv.classList.add('hidden');
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/clientes/buscar?q=${query}`);
        const clients = await res.json();
        
        resultsDiv.innerHTML = '';
        if(clients.length > 0) {
            resultsDiv.classList.remove('hidden');
            clients.forEach(c => {
                const div = document.createElement('div');
                div.className = 'dropdown-item';
                div.innerHTML = `<b>${c.nombre}</b> - ${c.cedula}`;
                div.onclick = () => selectClient(c);
                resultsDiv.appendChild(div);
            });
        } else {
            resultsDiv.classList.add('hidden');
        }
    } catch(e) { console.error(e); }
}

function selectClient(c) {
    document.getElementById('new-cli-nombre').value = c.nombre;
    document.getElementById('new-cli-cedula').value = c.cedula;
    document.getElementById('new-cli-telefono').value = c.telefono;
    document.getElementById('new-cli-email').value = c.email || '';
    
    document.getElementById('client-search-results').classList.add('hidden');
    document.getElementById('client-search-input').value = ''; // clear search
}

// Submits

// 1. Existing Vehicle -> Only Create OT
async function handleOtCreation(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // We reuse the registration create endpoint for simplicity effectively. 
    // BUT 'procesar_registro' expects full data usually. 
    // Let's modify the plan: We should check if 'procesar_registro' handles missing client data if vehicle exists.
    // I checked the code for 'procesar_registro':
    // It gets vehicle by placa. If vehicle exists, it sets cliente = vehiculo.propietario.
    // It DOES NOT fail if client fields are missing in data IF vehicle exists.
    // So we can send just {placa, sintomas, categoria} and it should work!
    
    submitRegistro(data);
}

// 2. New Vehicle -> Full Registration
async function handleFullRegistro(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    submitRegistro(data);
}

async function submitRegistro(data) {
    try {
        const response = await fetch(`${API_BASE}/registro/crear`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if(response.ok) {
            showAlert(`Orden #${result.numeroOT} creada exitosamente`, 'Éxito');
            closeModal('modal-nuevo-ingreso');
            resetIngresoForm();
            fetchVehicles().then(() => renderReception(localVehicles));
            // Also refresh Taller since a new OT was created
            // If taller panel is active or will be visited
            // We can't easy refresh taller from here if not active, but showPanel handles refresh.
        } else {
            showAlert('Error: ' + (result.error || result.mensaje), 'Error');
        }
    } catch(err) {
        showAlert('Error de conexión', 'Error');
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
    div.style.width = '100%'; // Ensure full width usage
    
    // Disable actions if finalized
    const isFinalized = ot.estado === 'Finalizada';
    const disabledAttr = isFinalized ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : '';
    
    div.innerHTML = `
        <div class="ot-header">
            <span class="ot-plate">${ot.placa}</span>
            <span class="ot-id">#${ot.id}</span>
        </div>
        <div style="font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--text-primary);">
            <b>${ot.categoria || 'Trabajo'}:</b> ${ot.sintomas}
        </div>
        <div style="margin-bottom: 0.5rem;">
            <span class="badge ${ot.estado === 'Finalizada' ? 'success' : (ot.estado === 'En Proceso' ? 'primary' : 'warning')}">${ot.estado}</span>
        </div>
        
        <div class="ot-barcodes">
            <div>
                <svg id="bc-veh-${ot.id}"></svg>
                <div style="font-size:0.6rem; color: var(--text-secondary);">Vehículo</div>
            </div>
            <div>
                 <svg id="bc-ot-${ot.id}"></svg>
                 <div style="font-size:0.6rem; color: var(--text-secondary);">Orden</div>
            </div>
        </div>

        ${!isFinalized ? `
        <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${ot.estado === 'En Proceso' ? 
                `<button class="btn btn-sm btn-primary" onclick="openRepuestoModal(${ot.id})">+ Repuesto</button>` 
                : ''}
            <button class="btn btn-sm btn-secondary" onclick="openOtDetails(${ot.id})">🔍 Detalles</button>
            ${ot.estado === 'Pendiente' ? 
                `<button class="btn btn-sm btn-success" onclick="startWork(${ot.id})">Iniciar</button>` : 
                `<button class="btn btn-sm btn-danger" onclick="finishWork(${ot.id})">Finalizar</button>`
            }
        </div>
        ` : `<div style="margin-top:0.5rem; font-size:0.8rem; color: var(--success-color);">Orden Cerrada</div>`}
    `;
    col.appendChild(div);
    
    // Render Barcodes
    try {
        JsBarcode(`#bc-veh-${ot.id}`, ot.placa, {format: "CODE128", width: 1, height: 25, displayValue: true, fontSize: 10});
        JsBarcode(`#bc-ot-${ot.id}`, "OT-" + ot.id, {format: "CODE128", width: 1, height: 25, displayValue: true, fontSize: 10});
    } catch(e) {}
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

async function openRepuestoModal(otId) {
    document.getElementById('repuesto-ot-id').value = otId;
    
    // Reset Selection
    document.getElementById('selected-repuesto-info').classList.add('hidden');
    document.getElementById('sel-rep-id').value = '';
    document.getElementById('btn-add-repuesto').disabled = true;
    
    openModal('modal-repuesto');
    
    // Ensure inventory is loaded
    if (localInventory.length === 0) {
        await fetchInventory();
    }
    renderRepuestoSelection(localInventory);
}

function renderRepuestoSelection(list) {
    const grid = document.getElementById('repuesto-selection-grid');
    grid.innerHTML = '';
    
    list.forEach(item => {
        if(item.stock <= 0) return; // Hide out of stock? Or show disabled. User wanted "select". Let's show only available.
        
        const card = document.createElement('div');
        card.className = 'repuesto-select-card';
        card.dataset.id = item.id;
        
        const imgSrc = item.foto_url || 'https://placehold.co/100?text=Parts';
        
        card.innerHTML = `
            <img src="${imgSrc}">
            <div style="font-size:0.8rem; font-weight:600;">${item.nombre}</div>
            <div style="font-size:0.8rem; color:var(--success-color);">$${item.precio}</div>
            <div style="font-size:0.7rem; color:var(--text-secondary);">Stock: ${item.stock}</div>
        `;
        
        card.onclick = () => selectRepuesto(item, card);
        grid.appendChild(card);
    });
}

function filterRepuestoGrid(query) {
    query = query.toLowerCase();
    const filtered = localInventory.filter(i => 
        i.nombre.toLowerCase().includes(query) || 
        i.id.toString().includes(query)
    );
    renderRepuestoSelection(filtered);
}

function selectRepuesto(item, cardEl) {
    // UI Highlight
    document.querySelectorAll('.repuesto-select-card').forEach(c => c.classList.remove('selected'));
    cardEl.classList.add('selected');
    
    // Update Form
    document.getElementById('sel-rep-id').value = item.id;
    document.getElementById('sel-rep-name').innerText = item.nombre;
    document.getElementById('sel-rep-price').innerText = `$${item.precio}`;
    
    document.getElementById('selected-repuesto-info').classList.remove('hidden');
    document.getElementById('btn-add-repuesto').disabled = false;
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

async function openOtDetails(otId) {
    currentDetailOtId = otId;
    openModal('modal-ot-detalles');
    const tbody = document.getElementById('ot-detalles-list');
    tbody.innerHTML = '<tr><td colspan="4">Cargando...</td></tr>';
    
    try {
        const res = await fetch(`${API_BASE}/taller/orden/${otId}/detalles`);
        const detalles = await res.json();
        
        if (detalles.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay repuestos asignados</td></tr>';
        } else {
            tbody.innerHTML = detalles.map(d => `
                <tr>
                    <td>${d.producto}</td>
                    <td>${d.cantidad}</td>
                    <td>$${d.precio}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="handleReturnPart(${d.id})">Devolver</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch(e) {
         tbody.innerHTML = '<tr><td colspan="4">Error cargando detalles</td></tr>';
    }
}

async function handleReturnPart(detId) {
    if(!confirm('¿Estás seguro de devolver este repuesto? El stock será restaurado.')) return;
    
    try {
        const res = await fetch(`${API_BASE}/taller/detalles/${detId}/devolver`, { method: 'POST' });
        const result = await res.json();
        if(res.ok) {
            showAlert(result.mensaje, "Devolución Exitosa");
            // Refresh details list
            openOtDetails(currentDetailOtId); 
            // Also refresh inventory visually if open
        } else {
            showAlert("Error: " + result.error, "Error");
        }
    } catch(e) {
        showAlert("Error de red", "Error");
    }
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
        // Stock Validation
        const isOutOfStock = item.stock <= 0;
        if (isOutOfStock) card.classList.add('out-of-stock');
        
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

                <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="addToCartItem(${item.id}, '${item.nombre}', ${item.precio}, ${item.stock})" ${isOutOfStock ? 'disabled style="cursor:not-allowed; background:var(--text-secondary)"' : ''}>
                    ${isOutOfStock ? 'Agotado' : 'Agregar 🛒'}
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
    document.getElementById('edit-stock').value = item.stock;
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
    const stockEl = document.getElementById(`stock-${id}`);
    const current = parseInt(stockEl.innerText);
    
    // Prevent negative stock
    if (current + delta < 0) {
        showAlert("No se puede reducir el stock por debajo de 0.", "Stock Inválido");
        return;
    }

    // Optimistic UI update
    stockEl.innerText = current + delta;
    
    // Update local state
    const item = localInventory.find(i => i.id === id);
    if(item) {
        item.stock += delta;
        // Re-render if it hits 0 or comes back from 0 to update buttons
        if(item.stock === 0 || (item.stock === 1 && delta > 0)) {
             renderInventory(localInventory); // Refresh UI state
        }
    }

    try {
        await fetch(`${API_BASE}/inventario/stock`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id: id, cambio: delta})
        });
    } catch(e) { console.error(e); }
}

// Cart Logic
// Updated signature to include currentStock
function addToCartItem(id, nombre, precio, currentStock) {
    // Check if item is already in cart using more than available
    const existing = carrito.find(i => i.id_producto === id);
    const inCart = existing ? existing.cantidad : 0;
    
    if (inCart + 1 > currentStock) {
        showAlert("No hay suficiente stock disponible.", "Aviso");
        return;
    }

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

function processSale() {
    if(carrito.length === 0) return showAlert("Carrito vacío", "Aviso");
    openModal('modal-tipo-factura');
}

async function submitSaleGeneric() {
    await executeSale({ tipo: 'consumidor_final' });
    closeModal('modal-tipo-factura');
}

function openDatosFactura() {
    closeModal('modal-tipo-factura');
    openModal('modal-datos-factura');
}

async function submitSaleNamed(e) {
    if(e) e.preventDefault();
    
    const id = document.getElementById('factura-id-cliente').value;
    const cedula = document.getElementById('factura-cedula').value;
    const nombre = document.getElementById('factura-nombre').value;
    const telefono = document.getElementById('factura-telefono').value;
    const email = document.getElementById('factura-email').value;
    const direccion = document.getElementById('factura-direccion').value;
    
    const clientInfo = {
        id: id,
        cedula: cedula,
        nombre: nombre,
        telefono: telefono,
        email: email,
        direccion: direccion
    };
    
    const success = await executeSale(clientInfo);
    if(success) {
        closeModal('modal-datos-factura');
        document.getElementById('form-datos-factura').reset();
    }
}

async function executeSale(clientInfo) {
    try {
        const res = await fetch(`${API_BASE}/venta/crear`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                items: carrito,
                cliente_info: clientInfo
            })
        });
        const result = await res.json();
        
        if(res.ok) {
            // showAlert(result.mensaje, 'Venta Confirmada');
            // Instead of just alert, show PDF option
            if(result.pdf_url) {
                if(confirm("Venta Exitosa. ¿Abrir Factura PDF?")) {
                    window.open(result.pdf_url, '_blank');
                }
            } else {
                 showAlert("Venta Exitosa (Sin PDF)", "Éxito");
            }
            
            carrito = [];
            renderCart();
            fetchInventory().then(() => renderInventory(localInventory));
            return true;
        } else {
            showAlert('Error: ' + result.error, 'Error');
            return false;
        }
    } catch(e) { 
        console.error(e);
        showAlert('Error de red', 'Error');
        return false;
    }
}

// Factura Client Search
let facturaClientTimeout;
function debouncedClientSearchFactura(query) {
    clearTimeout(facturaClientTimeout);
    facturaClientTimeout = setTimeout(() => searchClientsFactura(query), 300);
}

async function searchClientsFactura(query) {
    const resultsDiv = document.getElementById('factura-client-results');
    if(query.length < 2) {
        resultsDiv.classList.add('hidden');
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/clientes/buscar?q=${query}`);
        const clients = await res.json();
        
        resultsDiv.innerHTML = '';
        if(clients.length > 0) {
            resultsDiv.classList.remove('hidden');
            clients.forEach(c => {
                const div = document.createElement('div');
                div.className = 'dropdown-item';
                div.innerHTML = `<b>${c.nombre}</b> - ${c.cedula}`;
                div.onclick = () => selectClientFactura(c);
                resultsDiv.appendChild(div);
            });
        } else {
            resultsDiv.classList.add('hidden');
        }
    } catch(e) { console.error(e); }
}

function selectClientFactura(c) {
    document.getElementById('factura-id-cliente').value = c.id_cliente || c.id; // API might return id or id_cliente
    document.getElementById('factura-cedula').value = c.cedula;
    document.getElementById('factura-nombre').value = c.nombre;
    document.getElementById('factura-telefono').value = c.telefono;
    document.getElementById('factura-email').value = c.email || '';
    document.getElementById('factura-direccion').value = c.direccion || '';
    
    document.getElementById('factura-client-results').classList.add('hidden');
    document.getElementById('factura-client-search').value = ''; 
}


// === CAJA ===

// Placeholder for listing liquidations
// Needs an endpoint like /api/facturacion/pendientes
// Placeholder for listing liquidations
// Needs an endpoint like /api/facturacion/pendientes
async function loadLiquidaciones() {
    const tbody = document.getElementById('lista-caja');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
    
    try {
        const res = await fetch(`${API_BASE}/facturacion/pendientes`);
        const ordenes = await res.json();
        
        if(!res.ok) throw new Error(ordenes.error || 'Error al cargar');
        
        if (ordenes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay órdenes pendientes de cobro</td></tr>';
            return;
        }

        tbody.innerHTML = ordenes.map(ot => `
            <tr>
                <td>${ot.numero_ot}</td>
                <td><span class="badge badge-primary">${ot.placa}</span></td>
                <td>$${ot.total_repuestos.toFixed(2)}</td>
                <td>
                    <input type="number" 
                           class="form-control" 
                           placeholder="0.00" 
                           id="mo-${ot.numero_ot}" 
                           min="0" step="0.01"
                           style="width: 100px;">
                </td>
                <td style="display: flex; gap: 0.5rem; align-items: center;">
                    <select class="form-control" id="metodo-${ot.numero_ot}" style="width: 100px;">
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Transferencia">Transf.</option>
                    </select>
                    <button class="btn btn-sm btn-success" onclick="facturar(${ot.numero_ot})">
                        Cobrar
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch(e) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error: ${e.message}</td></tr>`;
    }
}

async function facturar(otId) {
    const moInput = document.getElementById(`mo-${otId}`);
    const metodoInput = document.getElementById(`metodo-${otId}`);
    
    const mo = moInput.value;
    const metodo = metodoInput.value;
    
    if(!mo || mo < 0) return showAlert("Ingrese un monto válido para Mano de Obra", "Aviso");
    
    if(!confirm(`¿Confirma cobrar la orden OT-${otId} por Mano de Obra $${mo} en ${metodo}?`)) return;
    
    try {
        const res = await fetch(`${API_BASE}/facturacion/facturar/${otId}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                monto_mano_obra: parseFloat(mo),
                metodo_pago: metodo
            })
        });
        
        const result = await res.json();
        
        if(res.ok) {
            showAlert(`Factura #${result.nro_factura} generada. Total: $${result.total.toFixed(2)}`, 'Venta Confirmada');
            loadLiquidaciones(); // Refresh list
        } else {
            showAlert('Error: ' + result.error, 'Error');
        }
    } catch(e) { showAlert('Error de red al facturar', 'Error'); }
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
            // Refresh inventory
            fetchInventory().then(() => renderInventory(localInventory));
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
        if(id === 'panel-inicio') loadDashboardMetrics();
        if(id === 'panel-recepcion') initReception();
        if(id === 'panel-taller') refreshTaller();
        if(id === 'panel-ventas') initPOS();
        if(id === 'panel-caja') loadLiquidaciones();
    }
});

// Delete Handlers
async function handleDeleteProduct(id) {
    if(!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
        const res = await fetch(`${API_BASE}/inventario/eliminar/${id}`, {method: 'DELETE'});
        const result = await res.json();
        
        if(res.ok) {
            showAlert(result.mensaje || 'Eliminado', 'Éxito');
            fetchInventory().then(() => renderInventory(localInventory));
        } else {
            showAlert(result.error || 'Error al eliminar', 'Error');
        }
    } catch(e) { showAlert('Error de red', 'Error'); }
}

async function handleDeleteVehicle(placa) {
    if(!confirm('¿Estás seguro de eliminar este vehículo?')) return;
    try {
        const res = await fetch(`${API_BASE}/registro/eliminar/${placa}`, {method: 'DELETE'});
        const result = await res.json();
        
        if(res.ok) {
            showAlert(result.mensaje || 'Eliminado', 'Éxito');
            fetchVehicles().then(() => renderReception(localVehicles));
        } else {
            showAlert(result.error || 'Error al eliminar', 'Error');
        }
    } catch(e) { showAlert('Error de red', 'Error'); }
}

// Vehicle Detail & History
let currentDetailPlaca = null;
let currentDetailOtId = null;

async function openVehicleDetail(v) {
    currentDetailPlaca = v.placa;
    document.getElementById('detail-placa').innerText = v.placa;
    
    // Populate Fields (Read Only)
    document.getElementById('det-marca').value = v.marca;
    document.getElementById('det-modelo').value = v.modelo;
    document.getElementById('det-nombre').value = v.cliente.nombre;
    document.getElementById('det-cedula').value = v.cliente.cedula;
    document.getElementById('det-telefono').value = v.cliente.telefono;
    document.getElementById('det-direccion').value = v.cliente.direccion || '';
    document.getElementById('det-email').value = v.cliente.email || '';
    
    // Reset Edit Mode
    setDetailEditMode(false);
    
    openModal('modal-detalle-vehiculo');
    
    // Fetch History
    const listBody = document.getElementById('vehicle-history-list');
    listBody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';
    
    try {
        const res = await fetch(`${API_BASE}/taller/historial/${v.placa}`);
        const history = await res.json();
        
        if(history.length === 0) {
            listBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Sin historial</td></tr>';
        } else {
            listBody.innerHTML = history.map(h => `
                <tr>
                    <td>#${h.id}</td>
                    <td>${h.fecha}</td>
                    <td>${h.contenido}</td>
                    <td><span class="badge ${h.estado === 'Finalizada' ? 'success' : 'warning'}">${h.estado}</span></td>
                    <td>$${h.total}</td>
                </tr>
            `).join('');
        }
    } catch(e) {
        listBody.innerHTML = '<tr><td colspan="5" style="color:red;">Error al cargar historial</td></tr>';
    }
}

function toggleVehicleEdit() {
    // Unlock fields
    setDetailEditMode(true);
}

function setDetailEditMode(enabled) {
    const fields = ['det-marca', 'det-modelo', 'det-nombre', 'det-cedula', 'det-telefono', 'det-direccion', 'det-email'];
    fields.forEach(id => {
        document.getElementById(id).disabled = !enabled;
    });
    
    if(enabled) {
        document.getElementById('btn-save-vehicle').classList.remove('hidden');
    } else {
        document.getElementById('btn-save-vehicle').classList.add('hidden');
    }
}

async function saveVehicleChanges() {
    const data = {
        marca: document.getElementById('det-marca').value,
        modelo: document.getElementById('det-modelo').value,
        cliente_nombre: document.getElementById('det-nombre').value,
        cliente_cedula: document.getElementById('det-cedula').value,
        cliente_telefono: document.getElementById('det-telefono').value,
        cliente_direccion: document.getElementById('det-direccion').value,
        cliente_email: document.getElementById('det-email').value
    };
    
    try {
        const res = await fetch(`${API_BASE}/registro/editar/${currentDetailPlaca}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        if(res.ok) {
            showAlert('Datos actualizados', 'Éxito');
            setDetailEditMode(false);
            fetchVehicles().then(() => {
                // Update local list reference so re-opening shows new data without fetch
                // Actually fetchVehicles updates localVehicles, we just need to re-find it if we want to update the open modal context, 
                // but since we just saved what's in inputs, inputs are already correct.
                renderReception(localVehicles);
            });
        } else {
            // Try to parse error
            let msg = 'Error al actualizar';
            try { 
                const result = await res.json(); 
                if(result.error) msg = result.error;
            } catch(e) {}
            showAlert(msg, 'Error');
        }
    } catch(e) { showAlert('Error de red', 'Error'); }
}

// === HISTORIAL FACTURAS ===
let localFacturas = [];

async function loadFacturas() {
    const tbody = document.getElementById('lista-facturas');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando...</td></tr>';
    
    try {
        const res = await fetch(`${API_BASE}/facturacion/historial`);
        if(res.ok) {
            localFacturas = await res.json();
            renderFacturas(localFacturas);
        } else {
             tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar historial</td></tr>';
        }
    } catch(e) { console.error(e); }
}

function renderFacturas(list) {
    const tbody = document.getElementById('lista-facturas');
    if(list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay facturas registradas</td></tr>';
        return;
    }
    
    tbody.innerHTML = list.map(f => `
        <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding:0.75rem;">#${f.nro_factura}</td>
            <td style="padding:0.75rem;">${f.fecha}</td>
            <td style="padding:0.75rem; font-weight:500;">${f.cliente}</td>
            <td style="padding:0.75rem;">${f.cedula}</td>
            <td style="padding:0.75rem;">${f.tipo}</td>
            <td style="padding:0.75rem; color: var(--success-color); font-weight:bold;">$${f.total.toFixed(2)}</td>
            <td style="padding:0.75rem;">
                <button class="btn btn-sm btn-primary" onclick="openFacturaPDF(${f.nro_factura})">📄 PDF</button>
                <button class="btn btn-sm btn-secondary" onclick="regenerateFactura(${f.nro_factura})" style="margin-left:5px;">🔄</button>
            </td>
        </tr>
    `).join('');
}

function filterFacturas(query) {
    if(!query) {
        renderFacturas(localFacturas);
        return;
    }
    query = query.toLowerCase();
    const filtered = localFacturas.filter(f => 
        f.cliente.toLowerCase().includes(query) || 
        f.cedula.includes(query) ||
        f.nro_factura.toString().includes(query)
    );
    renderFacturas(filtered);
}

function openFacturaPDF(nro) {
    window.open(`/static/invoices/factura_${nro}.pdf`, '_blank');
}

async function regenerateFactura(nro) {
    if(!confirm('¿Desea regenerar el PDF de la factura #' + nro + '?')) return;
    
    try {
        const res = await fetch(`${API_BASE}/facturacion/regenerar/${nro}`, {method: 'POST'});
        const result = await res.json();
        
        if(res.ok) {
            showAlert('Factura regenerada exitosamente', 'Éxito');
            // Optional: open it
            // window.open(result.url, '_blank');
        } else {
            showAlert(result.error || 'Error al regenerar', 'Error');
        }
    } catch(e) { showAlert('Error de red', 'Error'); }
}

// === DASHBOARD METRICS ===
let salesChartInstance = null;

async function loadDashboardMetrics() {
    // Only try to load if specific elements exist (avoids errors on limited roles if elements hidden)
    const statToday = document.getElementById('stat-ventas-hoy');
    if(!statToday) return; // metrics panel not present

    try {
        const res = await fetch(`${API_BASE}/dashboard/metrics`);
        if(res.ok) {
            const data = await res.json();
            renderDashboard(data);
        }
    } catch(e) { console.error("Metrics error", e); }
}

function renderDashboard(data) {
    document.getElementById('stat-ventas-hoy').innerText = `$${data.ventas_hoy.toFixed(2)}`;
    document.getElementById('stat-ventas-mes').innerText = `$${data.ventas_mes.toFixed(2)}`;
    document.getElementById('stat-ordenes-activas').innerText = data.ordenes_activas;
    
    // Low Stock
    const list = document.getElementById('low-stock-list');
    list.innerHTML = '';
    if(data.alertas_stock.length === 0) {
        list.innerHTML = '<li style="color: var(--success-color); text-align: center;">Todo en orden ✅</li>';
    } else {
        data.alertas_stock.forEach(item => {
            const li = document.createElement('li');
            li.style.padding = '0.5rem';
            li.style.borderBottom = '1px solid var(--border-color)';
            li.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <span>${item.nombre}</span>
                    <strong style="color: var(--danger-color);">${item.stock}</strong>
                </div>
            `;
            list.appendChild(li);
        });
    }
    
    // Chart
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    if(salesChartInstance) {
        salesChartInstance.destroy();
    }
    
    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.trend.labels,
            datasets: [{
                label: 'Ventas ($)',
                data: data.trend.data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Determine active panel and init proper data
    const activePanel = document.querySelector('.panel.active');
    if (activePanel) {
        if (activePanel.id === 'panel-inicio') loadDashboardMetrics();
        if (activePanel.id === 'panel-taller') refreshTaller();
    }
});
