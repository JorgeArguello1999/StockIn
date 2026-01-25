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

function addToCart() {
    const id = document.getElementById('pos-prod-id').value;
    const qty = document.getElementById('pos-cantidad').value;
    
    if(!id || !qty) return;
    
    carrito.push({id_producto: parseInt(id), cantidad: parseInt(qty)});
    renderCart();
}

function renderCart() {
    const cartDiv = document.getElementById('pos-cart');
    cartDiv.innerHTML = carrito.map((item, idx) => `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #333; padding: 5px;">
            <span>ID: ${item.id_producto} (x${item.cantidad})</span>
            <button class="btn btn-sm btn-danger" onclick="removeFromCart(${idx})">X</button>
        </div>
    `).join('');
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
