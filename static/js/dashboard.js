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

async function checkPlaca(placa) {
    if(placa.length < 3) return;
    const resDiv = document.getElementById('placa-resultado');
    
    try {
        const response = await fetch(`${API_BASE}/registro/validar/${placa}`);
        const data = await response.json();
        if(response.ok) {
            resDiv.innerHTML = `<span style="color: var(--success-color)">Vehículo encontrado: ${data.marca} ${data.modelo}</span>`;
        } else {
            resDiv.innerHTML = `<span style="color: var(--text-secondary)">Vehículo nuevo (se registrará al crear orden)</span>`;
        }
    } catch(e) {
        console.error(e);
    }
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
        else alert('Error al iniciar');
    } catch(e) { console.error(e); }
}

async function finishWork(otId) {
    if(!confirm('¿Finalizar trabajo?')) return;
    try {
        const res = await fetch(`${API_BASE}/taller/finalizar/${otId}`, {method: 'POST'});
        if(res.ok) refreshTaller();
        else alert('Error al finalizar');
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
            alert(`Repuesto agregado: ${result.producto} ($${result.precio})`);
            closeModal('modal-repuesto');
            e.target.reset();
        } else {
            alert('Error: ' + result.error);
        }
    } catch(e) { alert('Error de red'); }
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
        card.innerHTML = `
            <div class="inv-img">
                ${item.foto_url ? `<img src="${item.foto_url}" onerror="this.src=''">` : '<span>Sin Foto</span>'}
            </div>
            <div class="inv-body">
                <div class="inv-title">${item.nombre}</div>
                <div class="inv-meta">ID: ${item.id} | ${item.unidad || 'u'}</div>
                <div class="inv-price">$${item.precio.toFixed(2)}</div>
                
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.8rem; color:var(--text-secondary);">Stock: <b id="stock-${item.id}">${item.stock}</b></span>
                    <div class="inv-stock-ctrl">
                        <button class="inv-stock-btn" onclick="updateStock(${item.id}, -1)">-</button>
                        <button class="inv-stock-btn" onclick="updateStock(${item.id}, 1)">+</button>
                    </div>
                </div>

                <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="addToCartItem(${item.id}, '${item.nombre}', ${item.precio})">
                    Agregar 🛒
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
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
    if(carrito.length === 0) return alert("Carrito vacío");
    
    try {
        const res = await fetch(`${API_BASE}/venta/crear`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({items: carrito})
        });
        const result = await res.json();
        
        if(res.ok) {
            alert(`Venta exitosa! ID: ${result.id_venta} Total: $${result.total}`);
            carrito = [];
            renderCart();
        } else {
            alert('Error: ' + result.error);
        }
    } catch(e) { alert('Error de red'); }
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
    if(!mo) return alert("Ingrese mano de obra");
    
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
            alert(`Factura #${result.nro_factura} generada. Total: $${result.total}`);
            loadLiquidaciones();
        } else {
            alert('Error: ' + result.error);
        }
    } catch(e) { alert('Error de red'); }
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
            alert(`Producto creado: ${result.nombre} (ID: ${result.id})`);
            closeModal('modal-crear-producto');
            e.target.reset();
        } else {
            alert('Error: ' + result.error);
        }
    } catch(e) { alert('Error de red'); }
}
