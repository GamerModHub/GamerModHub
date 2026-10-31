// ==========================================
// CONFIGURACIÓN GLOBAL
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAd6_jbAZjMQlocFOkQPzIQ11NEGFfudcw",
    authDomain: "base-administrativa-dea20.firebaseapp.com",
    projectId: "base-administrativa-dea20",
    storageBucket: "base-administrativa-dea20.firebasestorage.app",
    messagingSenderId: "592943708135",
    appId: "1:592943708135:web:117c98bf2d947e19bf2f42"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const CFG = {
    user: 'conocimientos777', 
    repo: 'Portadas', 
    rama: 'main',
    baseURL: 'https://raw.githubusercontent.com/conocimientos777/Portadas/main/'
};

let github = { token: '' };
let listaJuegos = [];
let capturasTemp = [];
let adminActual = '';
let editCoverPathToDelete = '';
let editCapturasPathsToDelete = [];
let editCapturasUrlsToKeep = [];

const MODS_CATEGORIES = {
    texturas_pc: { nombre: 'Texturas PC', icono: '🖼️' },
    texturas_iso: { nombre: 'Texturas ISO', icono: '💿' },
    parches: { nombre: 'Parches', icono: '🔧' },
    mods_juego: { nombre: 'Mods de Juegos', icono: '🎮' },
    configs: { nombre: 'Configuraciones', icono: '⚙️' },
    shaders: { nombre: 'Shaders', icono: '✨' },
    otros: { nombre: 'Otros', icono: '📦' }
};
const APPS_CATEGORIES = {
    launchers: { nombre: 'Launchers', icono: '🚀' },
    herramientas: { nombre: 'Herramientas', icono: '🧰' },
    optimizacion: { nombre: 'Optimización', icono: '⚡' },
    apk: { nombre: 'APKs', icono: '📱' },
    otros: { nombre: 'Otros', icono: '📦' }
};
const ARCHIVOS_CATEGORIES = {
    bios: { nombre: 'BIOS', icono: '💾' },
    firmwares: { nombre: 'Firmwares', icono: '🔌' },
    saves: { nombre: 'Saves', icono: '💽' },
    configs: { nombre: 'Configuraciones', icono: '⚙️' },
    otros: { nombre: 'Otros', icono: '📦' }
};

// ==========================================
// UTILIDADES
// ==========================================
function comprimirImagen(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800, MAX_HEIGHT = 800;
                let width = img.width, height = img.height;
                if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
                else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.75);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

function mostrarToast(mensaje, tipo = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    const icono = tipo === 'success' ? 'fa-check-circle text-green-400' : (tipo === 'error' ? 'fa-exclamation-circle text-red-400' : 'fa-info-circle text-blue-400');
    toast.innerHTML = `<i class="fa ${icono} text-xl"></i><span>${mensaje}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 4000);
}

function abrirModal(titulo, detalle, prog = 0) {
    document.getElementById('titulo-modal').textContent = titulo;
    document.getElementById('detalle-modal').textContent = detalle;
    document.getElementById('barra-progreso').style.width = prog + '%';
    document.getElementById('icono-modal').className = 'fa fa-cog fa-spin fa-3x titulo-dorado mb-4';
    document.getElementById('cerrar-modal-proceso').classList.add('hidden');
    document.getElementById('modal-proceso').style.display = 'flex';
}
function cerrarModal() { document.getElementById('modal-proceso').style.display = 'none'; }
function modalExito(msg) {
    document.getElementById('icono-modal').className = 'fa fa-check-circle text-green-400 fa-3x mb-4';
    document.getElementById('titulo-modal').textContent = '✅ OPERACIÓN EXITOSA';
    document.getElementById('detalle-modal').textContent = msg;
    document.getElementById('barra-progreso').style.width = '100%';
    document.getElementById('cerrar-modal-proceso').classList.remove('hidden');
}
function modalError(msg) {
    document.getElementById('icono-modal').className = 'fa fa-times-circle text-red-400 fa-3x mb-4';
    document.getElementById('titulo-modal').textContent = '❌ ERROR';
    document.getElementById('detalle-modal').textContent = msg;
    document.getElementById('barra-progreso').style.width = '100%';
    document.getElementById('cerrar-modal-proceso').classList.remove('hidden');
}

function mostrarDiagnosticoLogin(mensajes) {
    const div = document.getElementById('diagnostico-login');
    const ul = document.getElementById('diagnostico-detalles');
    ul.innerHTML = mensajes.map(m => `<li>${m}</li>`).join('');
    div.style.display = 'block';
}

async function subirArchivoGitHub(blob, rutaDest) {
    try {
        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        const response = await fetch(`https://api.github.com/repos/${CFG.user}/${CFG.repo}/contents/${rutaDest}`, {
            method: 'PUT',
            headers: { 'Authorization': `token ${github.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `📤 Subida por ${adminActual}: ${rutaDest}`, content: base64, branch: CFG.rama })
        });
        if (!response.ok) throw new Error((await response.json()).message || 'Error de GitHub');
        return { url: `${CFG.baseURL}${rutaDest}?v=${Date.now()}`, path: rutaDest };
    } catch (error) { console.error("Error subirArchivoGitHub:", error); throw error; }
}

async function borrarArchivoGitHub(path) {
    if (!path) return true;
    try {
        const resp = await fetch(`https://api.github.com/repos/${CFG.user}/${CFG.repo}/contents/${path}?ref=${CFG.rama}`, {
            headers: { 'Authorization': `token ${github.token}` }
        });
        if (resp.status === 404) return true;
        if (!resp.ok) return false;
        const { sha } = await resp.json();
        const delResp = await fetch(`https://api.github.com/repos/${CFG.user}/${CFG.repo}/contents/${path}`, {
            method: 'DELETE',
            headers: { 'Authorization': `token ${github.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `🗑️ Eliminación por ${adminActual}`, sha: sha, branch: CFG.rama })
        });
        return delResp.ok;
    } catch (e) { console.error("Error borrar GitHub:", e); return false; }
}

function limpiarUrl(url) { return url ? url.split('?')[0] : ''; }
function extraerPathDeUrl(url) {
    if (!url) return '';
    const limpia = limpiarUrl(url);
    const match = limpia.match(/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/(.+)/);
    return match ? match[1] : '';
}

function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]))}

function formatearFecha(timestamp) {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
}

// ==========================================
// 🔥 SISTEMA DE LOGIN ROBUSTO
// ==========================================
function normalizarAdmins(data) {
    const admins = [];
    if (!data || !data.admins) return admins;
    let listaAdmins = data.admins;
    if (!Array.isArray(listaAdmins)) {
        listaAdmins = Object.values(listaAdmins);
    }
    listaAdmins.forEach(item => {
        if (!item || typeof item !== 'object') return;
        const usuario = item.usuario || item.user || item.username || item.email || item.nombre || '';
        const pass = item.pass || item.password || item.clave || item.contrasena || item.contrasenia || item.pin || '';
        if (usuario && pass) {
            admins.push({ usuario: String(usuario).trim(), pass: String(pass).trim() });
        }
    });
    return admins;
}

function mostrarErrorLogin(mensaje, detalles = []) {
    cerrarModal();
    modalError(mensaje);
    mostrarDiagnosticoLogin(detalles.length > 0 ? detalles : [mensaje]);
}

document.getElementById('form-login').onsubmit = async (e) => {
    e.preventDefault();
    abrirModal('CONECTANDO', 'Validando credenciales...', 30);
    const userInput = document.getElementById('usuario').value.trim();
    const passInput = document.getElementById('clave').value.trim();
    try {
        await inicializarBaseDeDatos();
        const snap = await db.collection('sistema').doc('config').get();
        if (!snap.exists) {
            mostrarErrorLogin('El documento de configuración no existe.', ['El documento "sistema/config" no existe en Firestore.', 'Creá el documento con el campo "admins" como array.']);
            return;
        }
        const data = snap.data();
        if (data.github_token) github.token = data.github_token;
        const adminsNormalizados = normalizarAdmins(data);
        if (adminsNormalizados.length === 0) {
            mostrarErrorLogin('No hay administradores configurados.', ['El campo "admins" está vacío o mal configurado.']);
            return;
        }
        const adminEncontrado = adminsNormalizados.find(a => a.usuario.toLowerCase() === userInput.toLowerCase() && a.pass === passInput);
        if (adminEncontrado) {
            adminActual = adminEncontrado.usuario;
            document.getElementById('pantalla-login').style.display = 'none';
            document.getElementById('pantalla-bienvenida').style.display = 'flex';
            document.getElementById('nombre-admin-display').textContent = adminActual.toUpperCase();
            document.getElementById('admin-header-name').textContent = adminActual;
            document.getElementById('admin-validator-name').textContent = adminActual;
            document.querySelector('#filtroAdmin option[value="mio"]').textContent = `👤 Solo mis subidas (${adminActual})`;
            cerrarModal();
            mostrarToast(`Bienvenido, ${adminActual}`, 'success');
            return;
        }
        mostrarErrorLogin('Usuario o contraseña incorrectos.', [`Se intentó con usuario: "${userInput}"`, `Administradores registrados: ${adminsNormalizados.length}`]);
    } catch (error) {
        console.error('Error en login:', error);
        mostrarErrorLogin('Error de conexión con Firebase.', [`Error: ${error.message}`]);
    }
};

// ==========================================
// INICIALIZACIÓN DE BASE DE DATOS
// ==========================================
async function inicializarBaseDeDatos() {
    const docRef = db.collection('sistema').doc('catalogo_por_consola');
    const doc = await docRef.get();
    if (!doc.exists) {
        await docRef.set({
            android: [], windows: [], psvita: [], psp: [], ps1: [], ps2: [], ps3: [], ps4: [],
            nes: [], snes: [], n64: [], gamecube: [], wii: [], wiiu: [], gameboy: [],
            gameboycolor: [], gameboyadvance: [], nds: [], '3ds': [], xbox: [], xbox360: [],
            segagenesis: [], segasaturn: [], sega_dreamcast: [], mame: [], arcade_y_mas: [],
            github_token: "TU_TOKEN_AQUI"
        });
    } else {
        const data = doc.data();
        if (data.github_token) github.token = data.github_token;
    }
}

// NAVEGACIÓN
document.getElementById('btn-ir-al-panel').onclick = async () => {
    document.getElementById('pantalla-bienvenida').style.display = 'none';
    document.getElementById('panel-principal').style.display = 'block';
    abrirModal('CARGANDO', 'Obteniendo catálogo...', 50);
    await cargarLista();
    cerrarModal();
};
document.getElementById('btn-ir-al-validador').onclick = async () => {
    document.getElementById('pantalla-bienvenida').style.display = 'none';
    document.getElementById('panel-validador').style.display = 'block';
    await inicializarValidador();
};
document.getElementById('btn-ir-a-huerfanas').onclick = () => {
    document.getElementById('pantalla-bienvenida').style.display = 'none';
    document.getElementById('panel-huerfanas').style.display = 'block';
};
document.getElementById('btn-ir-a-reportes').onclick = async () => {
    document.getElementById('pantalla-bienvenida').style.display = 'none';
    document.getElementById('panel-reportes').style.display = 'block';
    await Reportes.cargar();
};
document.getElementById('btn-ir-a-extras').onclick = () => {
    document.getElementById('pantalla-bienvenida').style.display = 'none';
    document.getElementById('panel-extras').style.display = 'block';
};
document.getElementById('btn-ir-validador-desde-panel').onclick = async () => {
    document.getElementById('panel-principal').style.display = 'none';
    document.getElementById('panel-validador').style.display = 'block';
    await inicializarValidador();
};
document.getElementById('btn-volver-inicio').onclick = () => {
    document.getElementById('panel-principal').style.display = 'none';
    document.getElementById('pantalla-bienvenida').style.display = 'flex';
};
document.getElementById('btn-volver-inicio-desde-val').onclick = () => {
    document.getElementById('panel-validador').style.display = 'none';
    document.getElementById('pantalla-bienvenida').style.display = 'flex';
};
document.getElementById('btn-volver-inicio-desde-huerfanas').onclick = () => {
    document.getElementById('panel-huerfanas').style.display = 'none';
    document.getElementById('pantalla-bienvenida').style.display = 'flex';
};
document.getElementById('btn-volver-inicio-desde-reportes').onclick = () => {
    document.getElementById('panel-reportes').style.display = 'none';
    document.getElementById('pantalla-bienvenida').style.display = 'flex';
};
document.getElementById('btn-volver-inicio-desde-extras').onclick = () => {
    document.getElementById('panel-extras').style.display = 'none';
    document.getElementById('pantalla-bienvenida').style.display = 'flex';
};
document.getElementById('btn-logout-bienvenida').onclick = () => location.reload();

// TABS DE EXTRAS
document.querySelectorAll('.panel-extras-tab').forEach(tab => {
    tab.onclick = () => {
        document.querySelectorAll('.panel-extras-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        document.querySelectorAll('.panel-extras-seccion').forEach(s => s.classList.remove('activa'));
        document.getElementById(`extras-${tabName}`).classList.add('activa');
        if (tabName === 'emuladores') Emuladores.cargar();
        if (tabName === 'apps') Apps.cargar();
        if (tabName === 'mods') Mods.cargar();
        if (tabName === 'archivos') Archivos.cargar();
        if (tabName === 'novedades') Novedades.cargar();
        if (tabName === 'top') TopBuscados.cargar();
    };
});

// SUBIDA DE IMÁGENES ROMs
document.getElementById('imgPortada').onchange = async (e) => {
    const arch = e.target.files[0];
    if (!arch) return;
    if (arch.size > 5 * 1024 * 1024) { mostrarToast('La imagen excede 5MB.', 'error'); e.target.value = ''; return; }
    abrirModal('OPTIMIZANDO', 'Comprimiendo imagen...', 30);
    try {
        const blobComprimido = await comprimirImagen(arch);
        abrirModal('SUBIENDO PORTADA', 'Enviando a GitHub...', 70);
        const idUnico = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        const ruta = `portadas/portada_${idUnico}.jpg`;
        const resultado = await subirArchivoGitHub(blobComprimido, ruta);
        document.getElementById('coverUrl').value = resultado.url;
        document.getElementById('coverPath').value = resultado.path;
        const img = document.getElementById('prevPortada');
        img.src = limpiarUrl(resultado.url); img.style.display = 'block';
        cerrarModal();
        mostrarToast('Portada subida correctamente', 'success');
    } catch (err) { cerrarModal(); modalError('Fallo al subir: ' + err.message); }
};

document.getElementById('imgCapturas').onchange = async (e) => {
    const archs = [...e.target.files];
    if (archs.length === 0) return;
    capturasTemp = [];
    document.getElementById('prevCapturas').innerHTML = '';
    for (let i = 0; i < archs.length; i++) {
        if (archs[i].size > 5 * 1024 * 1024) { mostrarToast(`${archs[i].name} excede 5MB.`, 'error'); continue; }
        abrirModal('OPTIMIZANDO', `Comprimiendo ${i+1}/${archs.length}...`, (i/archs.length)*50);
        try {
            const blobComprimido = await comprimirImagen(archs[i]);
            abrirModal('SUBIENDO', `Enviando ${i+1}/${archs.length}...`, 50 + ((i+1)/archs.length)*50);
            const idUnico = Date.now().toString(36) + i;
            const ruta = `capturas/capt_${idUnico}.jpg`;
            const resultado = await subirArchivoGitHub(blobComprimido, ruta);
            capturasTemp.push(resultado);
            const img = document.createElement('img');
            img.src = limpiarUrl(resultado.url); img.className = 'vista-previa-mini';
            document.getElementById('prevCapturas').appendChild(img);
        } catch (err) { mostrarToast(`Error al subir ${archs[i].name}`, 'error'); }
    }
    document.getElementById('capturasData').value = JSON.stringify(capturasTemp);
    cerrarModal();
    if (capturasTemp.length > 0) mostrarToast(`${capturasTemp.length} capturas subidas`, 'success');
};

// CARGAR LISTA
async function cargarLista() {
    try {
        const doc = await db.collection('sistema').doc('catalogo_por_consola').get();
        if (!doc.exists) return;
        const data = doc.data();
        listaJuegos = [];
        for (const [nombreConsola, juegosArray] of Object.entries(data)) {
            if (Array.isArray(juegosArray)) {
                juegosArray.forEach(juego => { juego.consola = nombreConsola; listaJuegos.push(juego); });
            }
        }
        listaJuegos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        document.getElementById('total').textContent = listaJuegos.length;
        document.getElementById('roms').textContent = listaJuegos.filter(x => x.tipo === 'rom').length;
        document.getElementById('mods').textContent = listaJuegos.filter(x => x.tipo === 'mod').length;
        document.getElementById('ports').textContent = listaJuegos.filter(x => x.tipo === 'port').length;
        renderizarLista();
        poblarFiltroConsolas();
    } catch (err) {
        console.error("Error cargando lista:", err);
        document.getElementById('lista').innerHTML = `<div class="text-red-400 text-center py-10">Error al cargar: ${err.message}</div>`;
    }
}

function poblarFiltroConsolas() {
    const consolas = [...new Set(listaJuegos.map(j => j.consola).filter(Boolean))].sort();
    const select = document.getElementById('filtroConsola');
    select.innerHTML = '<option value="">Todas las plataformas</option>' + 
        consolas.map(c => `<option value="${c}">${c.toUpperCase()}</option>`).join('');
}

function renderizarLista() {
    const busqueda = document.getElementById('buscar').value.toLowerCase();
    const tipoFiltro = document.getElementById('filtroTipo').value;
    const consolaFiltro = document.getElementById('filtroConsola').value;
    const adminFiltro = document.getElementById('filtroAdmin').value;
    const filtrados = listaJuegos.filter(j =>
        (!busqueda || (j.title && j.title.toLowerCase().includes(busqueda))) &&
        (!tipoFiltro || j.tipo === tipoFiltro) &&
        (!consolaFiltro || j.consola === consolaFiltro) &&
        (adminFiltro === 'todos' || j.uploadedBy === adminActual)
    );
    const contenedor = document.getElementById('lista');
    if (filtrados.length === 0) {
        contenedor.innerHTML = `<div class="text-center py-10 text-amber-500/50"><i class="fa fa-inbox text-3xl mb-3"></i><p>No se encontraron juegos</p></div>`;
        return;
    }
    contenedor.innerHTML = filtrados.map(j => {
        const tipoColor = j.tipo === 'rom' ? 'text-yellow-300' : (j.tipo === 'mod' ? 'text-pink-400' : 'text-cyan-400');
        const subidoPor = j.uploadedBy || 'Desconocido';
        const editadoBadge = j.editedBy ? `<span class="text-xs text-amber-400/80 ml-2" title="Editado por ${j.editedBy}"><i class="fa fa-pencil"></i></span>` : '';
        const tienePortada = j.cover && j.cover.trim() !== '';
        const portadaSrc = tienePortada ? limpiarUrl(j.cover) : 'https://via.placeholder.com/80x100/1a1400/ffd700?text=Sin+Portada';
        const warningBadge = !tienePortada ? '<span class="text-xs text-red-400 ml-1" title="Sin portada"><i class="fa fa-exclamation-triangle"></i></span>' : '';
        return `
        <div class="elemento-lista p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div class="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <img src="${portadaSrc}" class="w-14 h-18 sm:w-16 sm:h-20 object-cover rounded-lg border border-amber-700/50 shadow-md flex-shrink-0" 
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/80x100/1a1400/ff4444?text=Error'; this.style.opacity='0.5';" loading="lazy">
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-base sm:text-lg truncate text-white flex items-center">${j.title || 'Sin título'} ${editadoBadge} ${warningBadge}</h3>
                    <p class="text-xs sm:text-sm text-amber-400/70 flex items-center gap-2 flex-wrap mt-1">
                        <span class="bg-amber-900/30 px-2 py-0.5 rounded text-xs border border-amber-700/30 uppercase">${j.consola || 'N/A'}</span>
                        <span class="${tipoColor} font-bold uppercase text-xs">${j.tipo || 'N/A'}</span>
                        ${!tienePortada ? '<span class="text-red-400 text-xs">⚠ Sin portada</span>' : ''}
                    </p>
                    <p class="text-xs text-blue-400/80 mt-1 truncate"><i class="fa fa-user"></i> ${subidoPor}</p>
                </div>
            </div>
            <div class="flex gap-2 w-full sm:w-auto justify-end sm:justify-start">
                <button onclick="editarJuego('${j.id}', '${j.consola}')" class="boton-accion boton-editar flex-1 sm:flex-none text-xs sm:text-sm">
                    <i class="fa fa-pencil"></i> <span class="hidden sm:inline">Editar</span>
                </button>
                <button onclick="borrarJuego('${j.id}', '${j.consola}')" class="boton-accion boton-borrar flex-1 sm:flex-none text-xs sm:text-sm">
                    <i class="fa fa-trash"></i> <span class="hidden sm:inline">Borrar</span>
                </button>
            </div>
        </div>`;
    }).join('');
}

// ==========================================
// GESTIÓN DE DATOS Y PARTES DINÁMICAS
// ==========================================
function crearFilaCampo(tipo, nombre = '', url = '') {
    const div = document.createElement('div');
    div.className = `flex gap-2 items-start grupo-${tipo} animate-fade-in`;
    div.innerHTML = `
        <input type="text" class="input-lujo text-xs flex-1 ${tipo}-nombre" placeholder="Nombre (ej: Parte 1, Save Data)" value="${nombre}" required>
        <input type="url" class="input-lujo text-xs flex-[2] ${tipo}-url" placeholder="URL de descarga" value="${url}" required>
        <button type="button" class="btn-eliminar-campo bg-red-900/30 text-red-300 border border-red-600/50 w-8 h-8 flex items-center justify-center rounded hover:bg-red-900/50 transition-colors flex-shrink-0" title="Eliminar">
            <i class="fa fa-trash"></i>
        </button>
    `;
    div.querySelector('.btn-eliminar-campo').addEventListener('click', () => { div.remove(); });
    return div;
}

document.getElementById('form-juego').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-circle-o-notch fa-spin"></i> GUARDANDO...';
    try {
        // Recolección de Datos y Partes
        const datosArray = [];
        document.querySelectorAll('#contenedor-datos .grupo-dato').forEach(fila => {
            const nombre = fila.querySelector('.dato-nombre').value.trim();
            const url = fila.querySelector('.dato-url').value.trim();
            if (nombre && url) datosArray.push({ nombre, url });
        });

        const partesArray = [];
        document.querySelectorAll('#contenedor-partes .grupo-parte').forEach(fila => {
            const nombre = fila.querySelector('.parte-nombre').value.trim();
            const url = fila.querySelector('.parte-url').value.trim();
            if (nombre && url) partesArray.push({ nombre, url });
        });

        const linkPrincipal = document.getElementById('link').value.trim();
        if (!linkPrincipal && datosArray.length === 0 && partesArray.length === 0) {
            mostrarToast('Debes proporcionar al menos un enlace de descarga principal, un Dato o una Parte.', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa fa-save"></i> GUARDAR EN BASE DE DATOS';
            return;
        }

        const consolaSeleccionada = document.getElementById('consola').value;
        const coverUrlFinal = limpiarUrl(document.getElementById('coverUrl').value);
        const nuevoJuego = {
            id: Date.now().toString(),
            consola: consolaSeleccionada,
            tipo: document.querySelector('[name="tipo"]:checked').value,
            title: document.getElementById('titulo').value,
            idJuego: document.getElementById('idJuego').value,
            cover: coverUrlFinal,
            coverPath: document.getElementById('coverPath').value,
            screenshots: capturasTemp.map(c => limpiarUrl(c.url)),
            screenshotsPaths: capturasTemp.map(c => c.path),
            link: linkPrincipal,
            descripcion: document.getElementById('descripcion').value,
            uploadedBy: adminActual,
            timestamp: Date.now(),
            datos: datosArray,
            partes: partesArray
        };
        await db.collection('sistema').doc('catalogo_por_consola').update({
            [consolaSeleccionada]: firebase.firestore.FieldValue.arrayUnion(nuevoJuego)
        });
        e.target.reset();
        document.getElementById('prevPortada').style.display = 'none';
        document.getElementById('prevCapturas').innerHTML = '';
        document.getElementById('coverUrl').value = '';
        document.getElementById('coverPath').value = '';
        document.getElementById('capturasData').value = '';
        document.getElementById('contenedor-datos').innerHTML = '';
        document.getElementById('contenedor-partes').innerHTML = '';
        capturasTemp = [];
        mostrarToast(`Juego guardado por ${adminActual}`, 'success');
        await cargarLista();
    } catch (err) { mostrarToast('Error al guardar: ' + err.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fa fa-save"></i> GUARDAR EN BASE DE DATOS'; }
};

window.borrarJuego = async function(idJuego, consola) {
    if (!confirm("⚠️ ¿ESTÁS SEGURO?\n\nSe eliminarán las imágenes de GitHub y el registro.")) return;
    const juego = listaJuegos.find(x => x.id === idJuego);
    if (!juego) return;
    abrirModal("ELIMINANDO", "Paso 1: Actualizando base de datos...", 10);
    try {
        const docRef = db.collection('sistema').doc('catalogo_por_consola');
        const doc = await docRef.get();
        const data = doc.data();
        const nuevoArray = (data[consola] || []).filter(j => j.id !== idJuego);
        await docRef.update({ [consola]: nuevoArray });
        document.getElementById('detalle-modal').textContent = "Paso 2: Eliminando imágenes de GitHub...";
        document.getElementById('barra-progreso').style.width = "50%";
        if (juego.coverPath) await borrarArchivoGitHub(juego.coverPath);
        const pathsCapturas = juego.screenshotsPaths || [];
        for (let i = 0; i < pathsCapturas.length; i++) {
            document.getElementById('detalle-modal').textContent = `Eliminando captura ${i+1}/${pathsCapturas.length}...`;
            document.getElementById('barra-progreso').style.width = `${50 + ((i+1)/pathsCapturas.length)*40}%`;
            await borrarArchivoGitHub(pathsCapturas[i]);
        }
        modalExito("Juego e imágenes eliminados correctamente.");
        await cargarLista();
    } catch (err) { modalError("Error: " + err.message); }
};

window.editarJuego = function(id, consolaOriginal) {
    const j = listaJuegos.find(x => x.id === id);
    if (!j) return;
    editCoverPathToDelete = '';
    editCapturasPathsToDelete = [];
    editCapturasUrlsToKeep = [...(j.screenshots || [])];
    document.getElementById('editId').value = id;
    document.getElementById('editConsolaOriginal').value = consolaOriginal;
    document.getElementById('editUploadedBy').value = j.uploadedBy || 'Desconocido';
    document.getElementById('editOriginalTimestamp').value = j.timestamp || Date.now();
    document.getElementById('editConsola').value = j.consola || '';
    document.getElementById('edit-subido-por').textContent = j.uploadedBy || 'Desconocido';
    document.getElementById('edit-editado-por').textContent = j.editedBy ? `${j.editedBy} (${formatearFecha(j.editTimestamp)})` : 'Nunca editado';
    const radioTipo = document.querySelector(`[name="editTipo"][value="${j.tipo}"]`);
    if (radioTipo) radioTipo.checked = true;
    document.getElementById('editTitulo').value = j.title || '';
    document.getElementById('editIdJuego').value = j.idJuego || '';
    document.getElementById('editLink').value = j.link || '';
    document.getElementById('editDesc').value = j.descripcion || '';
    
    // Cargar Datos y Partes en el modal de edición
    const contEditDatos = document.getElementById('contenedor-edit-datos');
    const contEditPartes = document.getElementById('contenedor-edit-partes');
    if (contEditDatos) contEditDatos.innerHTML = '';
    if (contEditPartes) contEditPartes.innerHTML = '';

    if (Array.isArray(j.datos)) {
        j.datos.forEach(d => { if (contEditDatos) contEditDatos.appendChild(crearFilaCampo('dato', d.nombre, d.url)); });
    }
    if (Array.isArray(j.partes)) {
        j.partes.forEach(p => { if (contEditPartes) contEditPartes.appendChild(crearFilaCampo('parte', p.nombre, p.url)); });
    }

    const coverPreview = document.getElementById('edit-cover-preview');
    const coverNoImg = document.getElementById('edit-cover-no-img');
    const btnDeleteCover = document.getElementById('btn-delete-edit-cover');
    const coverUrlInput = document.getElementById('editCoverUrlInput');
    coverUrlInput.value = limpiarUrl(j.cover || '');
    if (j.cover) {
        coverPreview.src = limpiarUrl(j.cover); coverPreview.style.display = 'block';
        coverNoImg.classList.add('hidden'); btnDeleteCover.classList.remove('hidden');
        editCoverPathToDelete = j.coverPath || '';
    } else {
        coverPreview.style.display = 'none'; coverNoImg.classList.remove('hidden');
        btnDeleteCover.classList.add('hidden');
    }
    renderizarCapturasEdit(j.screenshots || [], j.screenshotsPaths || []);
    document.getElementById('editCapturasUrlInput').value = '';
    document.getElementById('modal-editar').style.display = 'flex';
};

function renderizarCapturasEdit(urls, paths) {
    const grid = document.getElementById('edit-capturas-grid');
    const noImg = document.getElementById('edit-capturas-no-img');
    grid.innerHTML = '';
    if (urls.length === 0) { noImg.classList.remove('hidden'); return; }
    noImg.classList.add('hidden');
    urls.forEach((url, index) => {
        const div = document.createElement('div');
        div.className = 'relative group';
        div.innerHTML = `
            <img src="${limpiarUrl(url)}" class="w-20 h-20 object-cover rounded-lg border border-amber-700/50" 
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/80x80/1a1400/ff4444?text=Error'; this.style.opacity='0.5';">
            <button type="button" onclick="eliminarCapturaEdit(${index})" class="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-700 active:scale-95 text-xs">
                <i class="fa fa-times"></i>
            </button>`;
        grid.appendChild(div);
    });
}

window.eliminarCapturaEdit = function(index) {
    const juego = listaJuegos.find(x => x.id === document.getElementById('editId').value);
    if (!juego) return;
    const path = juego.screenshotsPaths ? juego.screenshotsPaths[index] : '';
    if (path) editCapturasPathsToDelete.push(path);
    editCapturasUrlsToKeep.splice(index, 1);
    renderizarCapturasEdit(editCapturasUrlsToKeep, []);
};

document.getElementById('edit-imgPortada').onchange = async (e) => {
    const arch = e.target.files[0]; if (!arch) return;
    if (arch.size > 5 * 1024 * 1024) { mostrarToast('Excede 5MB.', 'error'); e.target.value = ''; return; }
    abrirModal('OPTIMIZANDO', 'Comprimiendo...', 30);
    try {
        const blobComprimido = await comprimirImagen(arch);
        abrirModal('SUBIENDO PORTADA', 'Enviando...', 70);
        const idUnico = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        const ruta = `portadas/portada_edit_${idUnico}.jpg`;
        const resultado = await subirArchivoGitHub(blobComprimido, ruta);
        const juego = listaJuegos.find(x => x.id === document.getElementById('editId').value);
        if (juego && juego.coverPath) editCoverPathToDelete = juego.coverPath;
        document.getElementById('edit-cover-preview').src = limpiarUrl(resultado.url);
        document.getElementById('edit-cover-preview').style.display = 'block';
        document.getElementById('edit-cover-no-img').classList.add('hidden');
        document.getElementById('btn-delete-edit-cover').classList.remove('hidden');
        document.getElementById('editCoverUrlInput').value = limpiarUrl(resultado.url);
        cerrarModal();
        mostrarToast('Nueva portada lista', 'success');
    } catch (err) { cerrarModal(); modalError('Fallo: ' + err.message); }
};

document.getElementById('btn-delete-edit-cover').onclick = function() {
    const juego = listaJuegos.find(x => x.id === document.getElementById('editId').value);
    if (juego && juego.coverPath) editCoverPathToDelete = juego.coverPath;
    document.getElementById('edit-cover-preview').style.display = 'none';
    document.getElementById('edit-cover-no-img').classList.remove('hidden');
    document.getElementById('btn-delete-edit-cover').classList.add('hidden');
    document.getElementById('editCoverUrlInput').value = '';
};

document.getElementById('edit-imgCapturas').onchange = async (e) => {
    const archs = [...e.target.files]; if (archs.length === 0) return;
    for (let i = 0; i < archs.length; i++) {
        if (archs[i].size > 5 * 1024 * 1024) { mostrarToast(`${archs[i].name} excede 5MB.`, 'error'); continue; }
        abrirModal('OPTIMIZANDO', `Comprimiendo ${i+1}/${archs.length}...`, (i/archs.length)*50);
        try {
            const blobComprimido = await comprimirImagen(archs[i]);
            abrirModal('SUBIENDO', `Enviando ${i+1}/${archs.length}...`, 50 + ((i+1)/archs.length)*50);
            const idUnico = Date.now().toString(36) + i;
            const ruta = `capturas/capt_edit_${idUnico}.jpg`;
            const resultado = await subirArchivoGitHub(blobComprimido, ruta);
            editCapturasUrlsToKeep.push(limpiarUrl(resultado.url));
        } catch (err) { mostrarToast(`Error al subir ${archs[i].name}`, 'error'); }
    }
    renderizarCapturasEdit(editCapturasUrlsToKeep, []);
    cerrarModal();
    mostrarToast(`${archs.length} capturas agregadas`, 'success');
    e.target.value = '';
};

document.getElementById('formEditar').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const consolaOriginal = document.getElementById('editConsolaOriginal').value;
    const nuevaConsola = document.getElementById('editConsola').value;
    const uploadedByOriginal = document.getElementById('editUploadedBy').value;
    const timestampOriginal = parseInt(document.getElementById('editOriginalTimestamp').value) || Date.now();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'ACTUALIZANDO...';
    try {
        // Recolección de Datos y Partes del modal de edición
        const datosArray = [];
        document.querySelectorAll('#contenedor-edit-datos .grupo-dato').forEach(fila => {
            const nombre = fila.querySelector('.dato-nombre').value.trim();
            const url = fila.querySelector('.dato-url').value.trim();
            if (nombre && url) datosArray.push({ nombre, url });
        });

        const partesArray = [];
        document.querySelectorAll('#contenedor-edit-partes .grupo-parte').forEach(fila => {
            const nombre = fila.querySelector('.parte-nombre').value.trim();
            const url = fila.querySelector('.parte-url').value.trim();
            if (nombre && url) partesArray.push({ nombre, url });
        });

        const coverUrlFinal = limpiarUrl(document.getElementById('editCoverUrlInput').value.trim());
        let coverPathFinal = extraerPathDeUrl(coverUrlFinal);
        const urlsPegadas = document.getElementById('editCapturasUrlInput').value
            .split('\n').map(u => u.trim()).filter(u => u).map(u => limpiarUrl(u));
        const capturasFinales = [...new Set([...editCapturasUrlsToKeep.map(limpiarUrl), ...urlsPegadas])];
        const docRef = db.collection('sistema').doc('catalogo_por_consola');
        const doc = await docRef.get();
        const data = doc.data();
        const juegoActualizado = {
            id: id, consola: nuevaConsola,
            tipo: document.querySelector('[name="editTipo"]:checked').value,
            title: document.getElementById('editTitulo').value,
            idJuego: document.getElementById('editIdJuego').value,
            cover: coverUrlFinal, coverPath: coverPathFinal,
            screenshots: capturasFinales,
            screenshotsPaths: capturasFinales.map(extraerPathDeUrl).filter(Boolean),
            link: document.getElementById('editLink').value,
            descripcion: document.getElementById('editDesc').value,
            uploadedBy: uploadedByOriginal, editedBy: adminActual,
            editTimestamp: Date.now(), timestamp: timestampOriginal,
            datos: datosArray,
            partes: partesArray
        };
        if (data[consolaOriginal]) data[consolaOriginal] = data[consolaOriginal].filter(j => j.id !== id);
        if (!data[nuevaConsola]) data[nuevaConsola] = [];
        data[nuevaConsola].push(juegoActualizado);
        const updates = {};
        updates[consolaOriginal] = data[consolaOriginal];
        if (consolaOriginal !== nuevaConsola) updates[nuevaConsola] = data[nuevaConsola];
        await docRef.update(updates);
        if (editCoverPathToDelete && editCoverPathToDelete !== coverPathFinal) await borrarArchivoGitHub(editCoverPathToDelete);
        for (const path of editCapturasPathsToDelete) { if (path) await borrarArchivoGitHub(path); }
        document.getElementById('modal-editar').style.display = 'none';
        mostrarToast('Juego actualizado por ' + adminActual, 'success');
        await cargarLista();
    } catch (err) { mostrarToast('Error al actualizar: ' + err.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'ACTUALIZAR REGISTRO'; }
};

// ==========================================
// VALIDADOR DE URLs
// ==========================================
const DOMINIOS_PROBLEMATICOS = [
    'mediafire.com', 'mega.nz', 'mega.co.nz', 'minecrfapkmod.com', 'apkadmin.com',
    'uploadhaven.com', 'usersdrive.com', 'zippyshare.com', 'solidfiles.com',
    'anonfiles.com', 'dropbox.com', 'drive.google.com', '1fichier.com',
    'uptobox.com', 'uptofile.com', 'file.io', 'sendspace.com', '4shared.com',
    'gofile.io', 'pixeldrain.com', 'androidapksfree.com', 'apkdone.com',
    'apkmirror.com', 'apkpure.com', 'revdl.com', 'apkmb.com', 'happy-mod.com',
    'dodi-repacks.site', 'fitgirl-repacks.site'
];

const ValidadorURLs = {
    urls: [], cancelado: false, procesando: false, concurrencia: 5,
    cacheKey: 'gmh_url_validation_cache_v2', tiempos: [],
    
    esDominioProblematico(url) {
        try { const host = new URL(url).hostname.toLowerCase(); return DOMINIOS_PROBLEMATICOS.some(d => host.includes(d)); }
        catch (e) { return false; }
    },
    
    async inicializar() {
        if (listaJuegos.length === 0) await cargarLista();
        this.poblarFiltroConsolas();
        this.urls = []; this.renderizar(); this.renderizarRotas(); this.actualizarStats();
    },
    
    poblarFiltroConsolas() {
        const consolas = [...new Set(listaJuegos.map(j => j.consola).filter(Boolean))].sort();
        const select = document.getElementById('val-filtro-consola');
        select.innerHTML = '<option value="todas">🌐 Todas las plataformas</option>' + 
            consolas.map(c => `<option value="${c}">${c.toUpperCase()}</option>`).join('');
    },
    
    construirLista() {
        const filtroConsola = document.getElementById('val-filtro-consola').value;
        const filtroTipoUrl = document.getElementById('val-filtro-tipo-url').value;
        const busqueda = (document.getElementById('val-buscar').value || '').toLowerCase();
        this.urls = [];
        let idCounter = 0;
        const juegos = listaJuegos.filter(j => {
            if (filtroConsola !== 'todas' && j.consola !== filtroConsola) return false;
            if (busqueda && !(j.title || '').toLowerCase().includes(busqueda)) return false;
            return true;
        });
        juegos.forEach(j => {
            if (j.cover && j.cover.trim() !== '') {
                if (filtroTipoUrl === 'todas' || filtroTipoUrl === 'cover') {
                    this.urls.push({ id: idCounter++, juegoId: j.id, titulo: j.title || 'Sin título', consola: j.consola || 'N/A', tipo: j.tipo || 'rom', uploadedBy: j.uploadedBy || 'Desconocido', timestamp: j.timestamp || 0, tipoUrl: 'cover', url: limpiarUrl(j.cover), path: j.coverPath || '', status: 'pending', codigoHttp: null, tiempoMs: null });
                }
            }
            if (Array.isArray(j.screenshots)) {
                j.screenshots.forEach((url, idx) => {
                    if (url && url.trim() !== '') {
                        if (filtroTipoUrl === 'todas' || filtroTipoUrl === 'screenshot') {
                            this.urls.push({ id: idCounter++, juegoId: j.id, titulo: j.title || 'Sin título', consola: j.consola || 'N/A', tipo: j.tipo || 'rom', uploadedBy: j.uploadedBy || 'Desconocido', timestamp: j.timestamp || 0, tipoUrl: 'screenshot', subIndice: idx, url: limpiarUrl(url), path: (j.screenshotsPaths && j.screenshotsPaths[idx]) || '', status: 'pending', codigoHttp: null, tiempoMs: null });
                        }
                    }
                });
            }
            if (j.link && j.link.trim() !== '') {
                if (filtroTipoUrl === 'todas' || filtroTipoUrl === 'download') {
                    this.urls.push({ id: idCounter++, juegoId: j.id, titulo: j.title || 'Sin título', consola: j.consola || 'N/A', tipo: j.tipo || 'rom', uploadedBy: j.uploadedBy || 'Desconocido', timestamp: j.timestamp || 0, tipoUrl: 'download', url: j.link, path: '', status: 'pending', codigoHttp: null, tiempoMs: null });
                }
            }
        });
    },
    
    cargarCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return {};
            const obj = JSON.parse(cached);
            if (Date.now() - obj.timestamp > 24 * 60 * 60 * 1000) { localStorage.removeItem(this.cacheKey); return {}; }
            return obj.data || {};
        } catch (e) { return {}; }
    },
    
    guardarCache() {
        const data = {};
        this.urls.forEach(u => { if (u.status === 'ok' || u.status === 'error') { data[u.url] = { status: u.status, codigoHttp: u.codigoHttp, tiempoMs: u.tiempoMs, timestamp: Date.now() }; } });
        try { localStorage.setItem(this.cacheKey, JSON.stringify({ timestamp: Date.now(), data: data })); } catch (e) {}
    },
    
    limpiarCache() {
        localStorage.removeItem(this.cacheKey);
        mostrarToast('Cache limpiada', 'info');
        this.urls.forEach(u => { if (u.status === 'ok' || u.status === 'error') { u.status = 'pending'; u.codigoHttp = null; u.tiempoMs = null; } });
        this.renderizar(); this.renderizarRotas(); this.actualizarStats();
    },
    
    aplicarCache() {
        const cache = this.cargarCache();
        let aplicadas = 0;
        this.urls.forEach(u => {
            if (cache[u.url]) { u.status = cache[u.url].status; u.codigoHttp = cache[u.url].codigoHttp; u.tiempoMs = cache[u.url].tiempoMs; aplicadas++; }
        });
        return aplicadas;
    },
    
    async validarDescarga(urlObj) {
        const inicio = performance.now();
        urlObj.status = 'checking'; this.renderItem(urlObj);
        const intentos = 2;
        for (let intento = 1; intento <= intentos; intento++) {
            if (this.cancelado) { urlObj.status = 'pending'; this.renderItem(urlObj); return; }
            try {
                const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8', 'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8' };
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);
                const response = await fetch(urlObj.url, { method: 'GET', mode: 'cors', credentials: 'omit', redirect: 'follow', signal: controller.signal, headers: headers, cache: 'no-cache' });
                clearTimeout(timeoutId);
                urlObj.tiempoMs = Math.round(performance.now() - inicio);
                if (response.ok) { urlObj.status = 'ok'; urlObj.codigoHttp = response.status; this.renderItem(urlObj); this.actualizarStats(); return; }
                if (response.status === 403 || response.status === 405 || response.status === 451) {
                    const funciona = await this.testFallbackNavegador(urlObj.url);
                    urlObj.tiempoMs = Math.round(performance.now() - inicio);
                    if (funciona) { urlObj.status = 'ok'; urlObj.codigoHttp = `${response.status}*`; this.renderItem(urlObj); this.actualizarStats(); return; }
                }
                if (response.status === 404 || response.status === 410) { urlObj.status = 'error'; urlObj.codigoHttp = response.status; this.renderItem(urlObj); this.actualizarStats(); return; }
                throw new Error('HTTP ' + response.status);
            } catch (err) {
                if (err.name === 'TypeError' || err.message.includes('Failed to fetch') || err.message.includes('CORS')) {
                    const funciona = await this.testFallbackNavegador(urlObj.url);
                    urlObj.tiempoMs = Math.round(performance.now() - inicio);
                    if (funciona) { urlObj.status = 'ok'; urlObj.codigoHttp = 'OK*'; this.renderItem(urlObj); this.actualizarStats(); return; }
                }
                if (intento === intentos) { urlObj.tiempoMs = Math.round(performance.now() - inicio); urlObj.status = 'error'; urlObj.codigoHttp = err.name === 'AbortError' ? 'TIMEOUT' : 'ERR'; this.renderItem(urlObj); this.actualizarStats(); return; }
                await new Promise(r => setTimeout(r, 1000 * intento));
            }
        }
    },
    
    testFallbackNavegador(url) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(false), 8000);
            const img = new Image();
            img.onload = () => { clearTimeout(timeout); resolve(true); };
            img.onerror = () => { clearTimeout(timeout); this.testDominioConPreconnect(url).then(resolve); };
            img.src = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
        });
    },
    
    testDominioConPreconnect(url) {
        return new Promise((resolve) => {
            try {
                const host = new URL(url).origin;
                const timeout = setTimeout(() => resolve(false), 6000);
                const link = document.createElement('link');
                link.rel = 'preconnect'; link.href = host;
                document.head.appendChild(link);
                fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-cache', redirect: 'follow' })
                    .then(() => { clearTimeout(timeout); document.head.removeChild(link); resolve(true); })
                    .catch(() => { clearTimeout(timeout); document.head.removeChild(link); resolve(false); });
            } catch (e) { resolve(false); }
        });
    },
    
    async validarImagen(urlObj, intentos = 3) {
        const inicio = performance.now();
        urlObj.status = 'checking'; this.renderItem(urlObj);
        for (let intento = 1; intento <= intentos; intento++) {
            if (this.cancelado) { urlObj.status = 'pending'; this.renderItem(urlObj); return; }
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);
                let response;
                try { response = await fetch(urlObj.url, { method: 'HEAD', mode: 'cors', signal: controller.signal, cache: 'no-cache' }); }
                catch (headErr) {
                    clearTimeout(timeoutId);
                    const controller2 = new AbortController();
                    const timeoutId2 = setTimeout(() => controller2.abort(), 15000);
                    try { response = await fetch(urlObj.url, { method: 'GET', mode: 'cors', signal: controller2.signal, headers: { 'Range': 'bytes=0-0' }, cache: 'no-cache' }); clearTimeout(timeoutId2); }
                    catch (getErr) { clearTimeout(timeoutId2); throw getErr; }
                }
                clearTimeout(timeoutId);
                urlObj.tiempoMs = Math.round(performance.now() - inicio);
                if (response.ok || response.status === 206) { urlObj.status = 'ok'; urlObj.codigoHttp = response.status; this.renderItem(urlObj); this.actualizarStats(); return; }
                else if (response.status === 404 || response.status === 410 || response.status === 403) { urlObj.status = 'error'; urlObj.codigoHttp = response.status; this.renderItem(urlObj); this.actualizarStats(); return; }
                else throw new Error('HTTP ' + response.status);
            } catch (err) {
                if (intento === intentos) { urlObj.tiempoMs = Math.round(performance.now() - inicio); urlObj.status = 'error'; urlObj.codigoHttp = err.name === 'AbortError' ? 'TIMEOUT' : 'ERR'; this.renderItem(urlObj); this.actualizarStats(); return; }
                await new Promise(r => setTimeout(r, 500 * intento));
            }
        }
    },
    
    async validarUna(urlObj) {
        if (urlObj.tipoUrl === 'download') await this.validarDescarga(urlObj);
        else await this.validarImagen(urlObj);
    },
    
    async validarMultiples(urlsAValidar) {
        if (this.procesando) return;
        this.procesando = true; this.cancelado = false; this.tiempos = [];
        const total = urlsAValidar.length;
        if (total === 0) { mostrarToast('No hay URLs para validar', 'info'); this.procesando = false; return; }
        document.getElementById('val-btn-validar-todas').disabled = true;
        document.getElementById('val-btn-validar-pendientes').disabled = true;
        document.getElementById('val-btn-validar-rotas').disabled = true;
        document.getElementById('val-btn-cancelar').disabled = false;
        document.getElementById('val-progress-bar').style.display = 'block';
        document.getElementById('val-progress-text').style.display = 'block';
        document.getElementById('val-progress-total').textContent = total;
        let completadas = 0;
        const inicioTotal = Date.now();
        const cola = [...urlsAValidar];
        const workers = [];
        const worker = async () => {
            while (cola.length > 0 && !this.cancelado) {
                const urlObj = cola.shift();
                if (!urlObj) break;
                await this.validarUna(urlObj);
                completadas++;
                this.tiempos.push(urlObj.tiempoMs || 0);
                const pct = (completadas / total) * 100;
                document.getElementById('val-progress-fill').style.width = pct + '%';
                document.getElementById('val-progress-current').textContent = completadas;
                if (completadas > 5) {
                    const avg = this.tiempos.reduce((a, b) => a + b, 0) / this.tiempos.length;
                    const restantes = total - completadas;
                    const etaSeg = Math.round((restantes * avg) / 1000 / this.concurrencia);
                    document.getElementById('val-progress-eta').textContent = `· ETA: ${etaSeg < 60 ? etaSeg + 's' : Math.round(etaSeg/60) + 'm'}`;
                }
            }
        };
        for (let i = 0; i < Math.min(this.concurrencia, total); i++) workers.push(worker());
        await Promise.all(workers);
        this.procesando = false;
        document.getElementById('val-btn-validar-todas').disabled = false;
        document.getElementById('val-btn-validar-pendientes').disabled = false;
        document.getElementById('val-btn-validar-rotas').disabled = false;
        document.getElementById('val-btn-cancelar').disabled = true;
        const duracion = Math.round((Date.now() - inicioTotal) / 1000);
        const ok = urlsAValidar.filter(u => u.status === 'ok').length;
        const err = urlsAValidar.filter(u => u.status === 'error').length;
        this.guardarCache();
        this.actualizarStats();
        this.renderizarRotas();
        if (this.cancelado) mostrarToast(`Validación cancelada. ${completadas}/${total} analizadas.`, 'info');
        else {
            mostrarToast(`✅ Análisis completo en ${duracion}s · ${ok} OK · ${err} errores`, err > 0 ? 'error' : 'success');
            if (err > 0) setTimeout(() => { document.getElementById('val-rotas-container').scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300);
        }
    },
    
    cancelar() { this.cancelado = true; mostrarToast('Cancelando validación...', 'info'); },
    
    renderizar() {
        const contenedor = document.getElementById('val-lista-urls');
        const filtroEstado = document.getElementById('val-filtro-estado').value;
        let urlsFiltradas = this.urls;
        if (filtroEstado !== 'todos') urlsFiltradas = this.urls.filter(u => u.status === filtroEstado);
        document.getElementById('val-list-count').textContent = urlsFiltradas.length;
        if (this.urls.length === 0) {
            contenedor.innerHTML = `<div class="text-center py-10 text-amber-500/50"><i class="fa fa-info-circle text-3xl mb-3"></i><p class="text-sm">Presioná "Cargar URLs" para comenzar</p></div>`;
            return;
        }
        if (urlsFiltradas.length === 0) {
            contenedor.innerHTML = `<div class="text-center py-10 text-amber-500/50"><i class="fa fa-filter text-3xl mb-3"></i><p class="text-sm">No hay URLs con este filtro</p></div>`;
            return;
        }
        const MAX_RENDER = 200;
        const limitadas = urlsFiltradas.slice(0, MAX_RENDER);
        const sobrantes = urlsFiltradas.length - MAX_RENDER;
        contenedor.innerHTML = limitadas.map(u => this.renderItemHTML(u)).join('');
        if (sobrantes > 0) {
            contenedor.innerHTML += `<div class="text-center py-3 text-amber-400/60 text-xs"><i class="fa fa-info-circle"></i> Mostrando ${MAX_RENDER} de ${urlsFiltradas.length} URLs.</div>`;
        }
    },
    
    renderItemHTML(u) {
        const tipoUrlIcono = u.tipoUrl === 'cover' ? '📷' : (u.tipoUrl === 'screenshot' ? '🖼️' : '⬇️');
        const estadoTexto = { 'ok': u.codigoHttp && String(u.codigoHttp).includes('*') ? '✅ OK (fallback)' : '✅ OK', 'error': `❌ ${u.codigoHttp || 'ERR'}`, 'pending': '⏳ Pendiente', 'checking': u.tipoUrl === 'download' ? '🔄 Analizando descarga...' : '🔄 Analizando...', 'eliminada': '🗑️ Eliminada' }[u.status];
        const urlCorta = u.url.length > 70 ? u.url.substring(0, 35) + '...' + u.url.substring(u.url.length - 30) : u.url;
        const thumbSrc = u.tipoUrl !== 'download' ? u.url : 'https://via.placeholder.com/45x60/1a1400/ffd700?text=DL';
        const avisoDominio = (u.tipoUrl === 'download' && this.esDominioProblematico(u.url)) ? '<span style="color: #ffa500; font-size: 0.65rem;" title="Dominio con protecciones especiales">⚡</span>' : '';
        return `
        <div class="val-url-item status-${u.status}" data-url-id="${u.id}">
            <img class="val-url-thumb" src="${thumbSrc}" onerror="this.onerror=null; this.src='https://via.placeholder.com/45x60/1a1400/ff4444?text=X';" loading="lazy" alt="">
            <div class="val-url-info">
                <div class="val-url-title" title="${u.titulo}">${u.titulo} ${avisoDominio}</div>
                <div class="val-url-meta">
                    <span class="val-url-badge ${u.tipo}">${(u.tipo || 'N/A').toUpperCase()}</span>
                    <span class="val-url-badge ${u.tipoUrl}">${tipoUrlIcono} ${u.tipoUrl}</span>
                    <span style="color: rgba(255,215,0,0.6);">${u.consola}</span>
                    ${u.tiempoMs ? `<span style="color: rgba(255,215,0,0.5);">${u.tiempoMs}ms</span>` : ''}
                </div>
                <div style="font-size: 0.7rem; color: rgba(255,215,0,0.4); margin-top: 0.2rem; word-break: break-all;" title="${u.url}">${urlCorta}</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.3rem; align-items: flex-end;">
                <span class="val-url-status ${u.status}">${estadoTexto}</span>
                ${u.status !== 'eliminada' ? `<button onclick="ValidadorURLs.revalidarUna(${u.id})" class="text-xs text-amber-400 hover:text-amber-200" title="Revalidar" style="background:none; border:none; cursor:pointer;"><i class="fa fa-refresh"></i></button>` : ''}
            </div>
        </div>`;
    },
    
    renderItem(urlObj) {
        const el = document.querySelector(`[data-url-id="${urlObj.id}"]`);
        if (el) el.outerHTML = this.renderItemHTML(urlObj);
    },
    
    revalidarUna(id) {
        const u = this.urls.find(x => x.id === id);
        if (u && u.status !== 'eliminada') this.validarUna(u);
    },
    
    actualizarStats() {
        const activas = this.urls.filter(u => u.status !== 'eliminada');
        const total = activas.length;
        const ok = activas.filter(u => u.status === 'ok').length;
        const error = activas.filter(u => u.status === 'error').length;
        const pending = activas.filter(u => u.status === 'pending' || u.status === 'checking').length;
        document.getElementById('val-stat-total').textContent = total;
        document.getElementById('val-stat-ok').textContent = ok;
        document.getElementById('val-stat-error').textContent = error;
        document.getElementById('val-stat-pending').textContent = pending;
    },
    
    renderizarRotas() {
        const container = document.getElementById('val-rotas-container');
        const lista = document.getElementById('val-rotas-lista');
        const rotas = this.urls.filter(u => u.status === 'error');
        if (rotas.length === 0) { container.style.display = 'none'; return; }
        container.style.display = 'block';
        document.getElementById('val-rotas-count').textContent = rotas.length;
        const orden = { cover: 1, screenshot: 2, download: 3 };
        rotas.sort((a, b) => (orden[a.tipoUrl] || 9) - (orden[b.tipoUrl] || 9));
        lista.innerHTML = rotas.map(u => this.renderRotaCardHTML(u)).join('');
    },
    
    renderRotaCardHTML(u) {
        const tipoUrlIcono = u.tipoUrl === 'cover' ? '📷' : (u.tipoUrl === 'screenshot' ? '🖼️' : '⬇️');
        const tipoUrlLabel = u.tipoUrl === 'cover' ? 'PORTADA' : (u.tipoUrl === 'screenshot' ? 'CAPTURA' : 'ENLACE DESCARGA');
        const thumbSrc = u.tipoUrl !== 'download' ? u.url : 'https://via.placeholder.com/70x90/1a1400/ff4444?text=DL';
        const fechaSubida = u.timestamp ? formatearFecha(u.timestamp) : 'N/A';
        let botonesHTML = '';
        botonesHTML += `<button class="val-rota-btn reemplazar" onclick="ValidadorURLs.abrirModalReparar(${u.id})"><i class="fa fa-wrench"></i> Reemplazar</button>`;
        if (u.tipoUrl === 'screenshot') botonesHTML += `<button class="val-rota-btn eliminar-captura" onclick="ValidadorURLs.eliminarCapturaRota(${u.id})"><i class="fa fa-trash"></i> Eliminar captura</button>`;
        if (u.tipoUrl === 'cover') botonesHTML += `<div class="val-rota-warning"><i class="fa fa-info-circle"></i> Para quitar el juego, usá "Cargar ROMs"</div>`;
        else if (u.tipoUrl === 'download') botonesHTML += `<div class="val-rota-warning"><i class="fa fa-info-circle"></i> Enlace obligatorio · reemplazalo</div>`;
        botonesHTML += `<button class="val-rota-btn ir-editor" onclick="ValidadorURLs.irAEditorCompleto('${u.juegoId}', '${u.consola}')"><i class="fa fa-external-link"></i> Editor completo</button>`;
        return `
        <div class="val-rota-card" data-rota-id="${u.id}">
            <img class="val-rota-thumb" src="${thumbSrc}" onerror="this.onerror=null; this.src='https://via.placeholder.com/70x90/1a1400/ff4444?text=BROKEN';" loading="lazy" alt="">
            <div class="val-rota-info">
                <div class="val-rota-title">${u.titulo}</div>
                <div class="val-rota-badges">
                    <span class="val-rota-badge consola"><i class="fa fa-gamepad"></i> ${u.consola}</span>
                    <span class="val-rota-badge tipo-${u.tipo}">${(u.tipo || 'N/A').toUpperCase()}</span>
                    <span class="val-rota-badge tipo-url">${tipoUrlIcono} ${tipoUrlLabel}</span>
                    <span class="val-rota-badge error-code">HTTP ${u.codigoHttp || 'ERR'}</span>
                </div>
                <div class="val-rota-url" title="${u.url}"><strong>URL rota:</strong> ${u.url}</div>
                <div class="val-rota-subido"><i class="fa fa-user"></i> Subido por: ${u.uploadedBy} · ${fechaSubida}</div>
            </div>
            <div class="val-rota-actions">${botonesHTML}</div>
        </div>`;
    },
    
    abrirModalReparar(id) {
        const u = this.urls.find(x => x.id === id);
        if (!u) return;
        document.getElementById('roto-url-id').value = id;
        document.getElementById('roto-juego-titulo').textContent = u.titulo;
        document.getElementById('roto-juego-consola').innerHTML = `<i class="fa fa-gamepad"></i> ${u.consola}`;
        const tipoBadge = document.getElementById('roto-juego-tipo');
        tipoBadge.textContent = (u.tipo || 'N/A').toUpperCase();
        tipoBadge.className = `val-rota-badge tipo-${u.tipo}`;
        const tipoUrlLabel = u.tipoUrl === 'cover' ? '📷 PORTADA' : (u.tipoUrl === 'screenshot' ? '🖼️ CAPTURA' : '⬇️ ENLACE DESCARGA');
        document.getElementById('roto-tipo-url').innerHTML = tipoUrlLabel;
        document.getElementById('roto-juego-uploader').textContent = u.uploadedBy;
        document.getElementById('roto-url-actual').textContent = u.url;
        document.getElementById('roto-codigo-error').innerHTML = `<i class="fa fa-exclamation-triangle"></i> Código de error: <strong>HTTP ${u.codigoHttp || 'ERR'}</strong>`;
        const imagenContainer = document.getElementById('roto-imagen-container');
        const nuevaLabel = document.getElementById('roto-nueva-label');
        const preview = document.getElementById('roto-img-preview');
        const nuevaUrlInput = document.getElementById('roto-nueva-url');
        const nuevoPathInput = document.getElementById('roto-nuevo-path');
        preview.style.display = 'none'; preview.src = ''; nuevaUrlInput.value = ''; nuevoPathInput.value = '';
        if (u.tipoUrl === 'download') { imagenContainer.style.display = 'none'; nuevaLabel.innerHTML = '🔗 NUEVO ENLACE DE DESCARGA'; nuevaUrlInput.placeholder = 'Pegá el nuevo enlace de descarga'; }
        else { imagenContainer.style.display = 'block'; nuevaLabel.innerHTML = u.tipoUrl === 'cover' ? '📷 NUEVA PORTADA' : '🖼️ NUEVA CAPTURA'; nuevaUrlInput.placeholder = 'O pegá la URL directa de la imagen'; }
        document.getElementById('modal-editar-url-rota').style.display = 'flex';
    },
    
    async eliminarCapturaRota(id) {
        const u = this.urls.find(x => x.id === id);
        if (!u || u.tipoUrl !== 'screenshot') { mostrarToast('Solo se pueden eliminar capturas', 'error'); return; }
        const juego = listaJuegos.find(j => j.id === u.juegoId);
        if (!juego) { mostrarToast('No se encontró el juego', 'error'); return; }
        if (!confirm(`¿Eliminar esta captura rota de "${juego.title}"?\n\nLa imagen se borrará de GitHub y del catálogo.`)) return;
        abrirModal('ELIMINANDO', 'Actualizando base de datos...', 20);
        try {
            const urlLimpia = limpiarUrl(u.url);
            const idx = (juego.screenshots || []).findIndex(s => limpiarUrl(s) === urlLimpia);
            if (idx === -1) { cerrarModal(); mostrarToast('No se encontró la captura en el juego', 'error'); return; }
            juego.screenshots.splice(idx, 1);
            if (juego.screenshotsPaths && juego.screenshotsPaths[idx]) {
                const pathABorrar = juego.screenshotsPaths[idx];
                juego.screenshotsPaths.splice(idx, 1);
                document.getElementById('detalle-modal').textContent = 'Eliminando imagen de GitHub...';
                document.getElementById('barra-progreso').style.width = '70%';
                await borrarArchivoGitHub(pathABorrar);
            }
            const docRef = db.collection('sistema').doc('catalogo_por_consola');
            const doc = await docRef.get();
            const data = doc.data();
            if (data[juego.consola]) {
                const juegoEnDb = data[juego.consola].find(j => j.id === juego.id);
                if (juegoEnDb) { juegoEnDb.screenshots = [...juego.screenshots]; juegoEnDb.screenshotsPaths = [...(juego.screenshotsPaths || [])]; await docRef.update({ [juego.consola]: data[juego.consola] }); }
            }
            u.status = 'eliminada';
            this.renderItem(u); this.renderizarRotas(); this.actualizarStats();
            modalExito(`Captura eliminada de "${juego.title}"`);
        } catch (err) { modalError('Error al eliminar: ' + err.message); }
    },
    
    async irAEditorCompleto(juegoId, consola) {
        if (!confirm('¿Ir al editor completo del juego?\n\nSe cerrará el validador y se abrirá el panel principal con el editor.')) return;
        document.getElementById('panel-validador').style.display = 'none';
        document.getElementById('panel-principal').style.display = 'block';
        if (listaJuegos.length === 0) await cargarLista();
        setTimeout(() => { editarJuego(juegoId, consola); }, 100);
    },
    
    async cargarYRenderizar() {
        this.construirLista();
        const cacheadas = this.aplicarCache();
        this.renderizar(); this.renderizarRotas(); this.actualizarStats();
        mostrarToast(`${this.urls.length} URLs cargadas · ${cacheadas} desde cache`, 'info');
    },
    
    async validarTodas() { this.construirLista(); await this.validarMultiples([...this.urls.filter(u => u.status !== 'eliminada')]); },
    async validarPendientes() { this.construirLista(); this.aplicarCache(); const pendientes = this.urls.filter(u => u.status === 'pending'); await this.validarMultiples(pendientes); },
    async validarRotas() { this.construirLista(); const rotas = this.urls.filter(u => u.status === 'error'); if (rotas.length === 0) { mostrarToast('No hay URLs marcadas como rotas', 'info'); return; } rotas.forEach(u => { u.status = 'pending'; u.codigoHttp = null; u.tiempoMs = null; }); this.renderizar(); await this.validarMultiples(rotas); }
};

document.getElementById('roto-img-input').onchange = async (e) => {
    const arch = e.target.files[0];
    if (!arch) return;
    if (arch.size > 5 * 1024 * 1024) { mostrarToast('Excede 5MB.', 'error'); e.target.value = ''; return; }
    abrirModal('OPTIMIZANDO', 'Comprimiendo imagen...', 30);
    try {
        const blobComprimido = await comprimirImagen(arch);
        abrirModal('SUBIENDO', 'Enviando a GitHub...', 70);
        const idUnico = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        const urlId = parseInt(document.getElementById('roto-url-id').value);
        const u = ValidadorURLs.urls.find(x => x.id === urlId);
        const prefijo = u && u.tipoUrl === 'cover' ? 'portada_repair_' : 'captura_repair_';
        const carpeta = u && u.tipoUrl === 'cover' ? 'portadas' : 'capturas';
        const ruta = `${carpeta}/${prefijo}${idUnico}.jpg`;
        const resultado = await subirArchivoGitHub(blobComprimido, ruta);
        document.getElementById('roto-nueva-url').value = limpiarUrl(resultado.url);
        document.getElementById('roto-nuevo-path').value = resultado.path;
        const preview = document.getElementById('roto-img-preview');
        preview.src = limpiarUrl(resultado.url); preview.style.display = 'block';
        cerrarModal();
        mostrarToast('Imagen subida. Ahora guardá la reparación.', 'success');
    } catch (err) { cerrarModal(); modalError('Fallo al subir: ' + err.message); }
    e.target.value = '';
};

document.getElementById('form-reparar-url').onsubmit = async (e) => {
    e.preventDefault();
    const urlId = parseInt(document.getElementById('roto-url-id').value);
    const u = ValidadorURLs.urls.find(x => x.id === urlId);
    if (!u) { mostrarToast('URL no encontrada', 'error'); return; }
    const nuevaUrl = limpiarUrl(document.getElementById('roto-nueva-url').value.trim());
    const nuevoPath = document.getElementById('roto-nuevo-path').value.trim();
    if (!nuevaUrl) { mostrarToast('Debés subir una imagen o pegar una URL', 'error'); return; }
    const juego = listaJuegos.find(j => j.id === u.juegoId);
    if (!juego) { mostrarToast('Juego no encontrado', 'error'); return; }
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.innerHTML = '<i class="fa fa-circle-o-notch fa-spin"></i> GUARDANDO...';
    abrirModal('REPARANDO', 'Actualizando base de datos...', 30);
    try {
        const pathViejo = u.path || '';
        if (u.tipoUrl === 'cover') { juego.cover = nuevaUrl; juego.coverPath = nuevoPath; }
        else if (u.tipoUrl === 'screenshot') { const urlViejaLimpia = limpiarUrl(u.url); const idx = (juego.screenshots || []).findIndex(s => limpiarUrl(s) === urlViejaLimpia); if (idx !== -1) { juego.screenshots[idx] = nuevaUrl; if (juego.screenshotsPaths) juego.screenshotsPaths[idx] = nuevoPath; } }
        else if (u.tipoUrl === 'download') { juego.link = nuevaUrl; }
        const docRef = db.collection('sistema').doc('catalogo_por_consola');
        const doc = await docRef.get(); const data = doc.data();
        if (data[juego.consola]) {
            const juegoEnDb = data[juego.consola].find(j => j.id === juego.id);
            if (juegoEnDb) {
                if (u.tipoUrl === 'cover') { juegoEnDb.cover = nuevaUrl; juegoEnDb.coverPath = nuevoPath; }
                else if (u.tipoUrl === 'screenshot') { juegoEnDb.screenshots = [...juego.screenshots]; juegoEnDb.screenshotsPaths = [...(juego.screenshotsPaths || [])]; }
                else if (u.tipoUrl === 'download') { juegoEnDb.link = nuevaUrl; }
                await docRef.update({ [juego.consola]: data[juego.consola] });
            }
        }
        document.getElementById('detalle-modal').textContent = 'Eliminando archivo viejo de GitHub...';
        document.getElementById('barra-progreso').style.width = '70%';
        if (pathViejo && pathViejo !== nuevoPath) await borrarArchivoGitHub(pathViejo);
        u.url = nuevaUrl; u.path = nuevoPath; u.status = 'ok'; u.codigoHttp = 200;
        ValidadorURLs.renderItem(u); ValidadorURLs.renderizarRotas(); ValidadorURLs.actualizarStats();
        ValidadorURLs.guardarCache();
        document.getElementById('modal-editar-url-rota').style.display = 'none';
        modalExito(`URL reparada correctamente en "${juego.title}"`);
    } catch (err) { modalError('Error al reparar: ' + err.message); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fa fa-check"></i> GUARDAR REPARACIÓN'; }
};

async function inicializarValidador() { await ValidadorURLs.inicializar(); }

document.getElementById('val-btn-cargar').onclick = () => ValidadorURLs.cargarYRenderizar();
document.getElementById('val-btn-validar-todas').onclick = () => ValidadorURLs.validarTodas();
document.getElementById('val-btn-validar-pendientes').onclick = () => ValidadorURLs.validarPendientes();
document.getElementById('val-btn-validar-rotas').onclick = () => ValidadorURLs.validarRotas();
document.getElementById('val-btn-cancelar').onclick = () => ValidadorURLs.cancelar();
document.getElementById('val-btn-limpiar-cache').onclick = () => ValidadorURLs.limpiarCache();

document.getElementById('val-filtro-consola').onchange = () => { ValidadorURLs.construirLista(); ValidadorURLs.aplicarCache(); ValidadorURLs.renderizar(); ValidadorURLs.renderizarRotas(); ValidadorURLs.actualizarStats(); };
document.getElementById('val-filtro-tipo-url').onchange = () => { ValidadorURLs.construirLista(); ValidadorURLs.aplicarCache(); ValidadorURLs.renderizar(); ValidadorURLs.renderizarRotas(); ValidadorURLs.actualizarStats(); };
document.getElementById('val-filtro-estado').onchange = () => ValidadorURLs.renderizar();
document.getElementById('val-concurrencia').onchange = (e) => { ValidadorURLs.concurrencia = parseInt(e.target.value); };
document.getElementById('val-buscar').oninput = () => { ValidadorURLs.construirLista(); ValidadorURLs.aplicarCache(); ValidadorURLs.renderizar(); ValidadorURLs.renderizarRotas(); ValidadorURLs.actualizarStats(); };

document.getElementById('cerrar-modal-proceso').onclick = cerrarModal;
document.getElementById('buscar').oninput = renderizarLista;
document.getElementById('filtroTipo').onchange = renderizarLista;
document.getElementById('filtroConsola').onchange = renderizarLista;
document.getElementById('filtroAdmin').onchange = renderizarLista;

window.onclick = function(event) { if (event.target.classList.contains('modal-global')) event.target.style.display = 'none'; }

document.addEventListener('DOMContentLoaded', () => {
    const consolas = ['android', 'windows', 'psp', 'psvita', 'ps1', 'ps2', 'ps3', 'ps4', 'nes', 'snes', 'n64', 'gamecube', 'wii', 'wiiu', 'gameboy', 'gameboycolor', 'gameboyadvance', 'nds', '3ds', 'xbox', 'xbox360', 'segagenesis', 'segasaturn', 'sega_dreamcast', 'mame', 'arcade_y_mas'];
    const selectEditar = document.getElementById('editConsola');
    consolas.forEach(c => { const opt = document.createElement('option'); opt.value = c; opt.textContent = c.toUpperCase(); selectEditar.appendChild(opt); });

    // Event listeners para Datos y Partes (Nuevo Juego)
    const btnAgregarDato = document.getElementById('btn-agregar-dato');
    const btnAgregarParte = document.getElementById('btn-agregar-parte');
    const contenedorDatos = document.getElementById('contenedor-datos');
    const contenedorPartes = document.getElementById('contenedor-partes');

    if (btnAgregarDato && contenedorDatos) {
        btnAgregarDato.addEventListener('click', () => contenedorDatos.appendChild(crearFilaCampo('dato')));
    }
    if (btnAgregarParte && contenedorPartes) {
        btnAgregarParte.addEventListener('click', () => contenedorPartes.appendChild(crearFilaCampo('parte')));
    }

    // Event listeners para Datos y Partes (Modal Editar)
    document.querySelector('.btn-agregar-edit-datos')?.addEventListener('click', () => {
        document.getElementById('contenedor-edit-datos').appendChild(crearFilaCampo('dato'));
    });
    document.querySelector('.btn-agregar-edit-partes')?.addEventListener('click', () => {
        document.getElementById('contenedor-edit-partes').appendChild(crearFilaCampo('parte'));
    });
});

// ==========================================
// HUÉRFANAS
// ==========================================
const Huerfanas = {
    archivos: [], seleccionados: new Set(), procesando: false,
    async escanear() {
        if (this.procesando) return; this.procesando = true;
        document.getElementById('huer-progress-bar').style.display = 'block';
        document.getElementById('huer-progress-text').style.display = 'block';
        document.getElementById('huer-progress-detalle').textContent = 'Consultando API de GitHub...';
        document.getElementById('huer-progress-fill').style.width = '30%';
        try {
            await cargarLista();
            const resp = await fetch(`https://api.github.com/repos/${CFG.user}/${CFG.repo}/git/trees/${CFG.rama}?recursive=1`, { headers: { 'Authorization': `token ${github.token}` } });
            if (!resp.ok) throw new Error('Error al listar archivos de GitHub');
            const data = await resp.json();
            const archivosGitHub = (data.tree || []).filter(item => item.type === 'blob' && (item.path.startsWith('portadas/') || item.path.startsWith('capturas/'))).map(item => ({ path: item.path, carpeta: item.path.split('/')[0], nombre: item.path.split('/').pop(), size: item.size || 0, url: `${CFG.baseURL}${item.path}`, vinculado: false, juegoAsociado: null }));
            document.getElementById('huer-progress-detalle').textContent = 'Comparando con la base de datos...';
            document.getElementById('huer-progress-fill').style.width = '70%';
            archivosGitHub.forEach(archivo => { archivo.vinculado = false; archivo.juegoAsociado = null; for (const juego of listaJuegos) { if (juego.coverPath === archivo.path) { archivo.vinculado = true; archivo.juegoAsociado = juego; return; } if (Array.isArray(juego.screenshotsPaths) && juego.screenshotsPaths.includes(archivo.path)) { archivo.vinculado = true; archivo.juegoAsociado = juego; return; } } });
            this.archivos = archivosGitHub; this.seleccionados.clear(); this.render(); this.actualizarStats();
            document.getElementById('huer-progress-fill').style.width = '100%';
            const huerfanos = this.archivos.filter(a => !a.vinculado).length;
            document.getElementById('huer-progress-detalle').textContent = `✅ Análisis completo · ${huerfanos} archivos huérfanos`;
            setTimeout(() => { document.getElementById('huer-progress-bar').style.display = 'none'; document.getElementById('huer-progress-text').style.display = 'none'; }, 3000);
            if (huerfanos > 0) mostrarToast(`👻 Se encontraron ${huerfanos} archivos huérfanos`, 'info');
            else mostrarToast('✅ No hay archivos huérfanos. Todo limpio.', 'success');
        } catch (e) {
            document.getElementById('huer-progress-bar').style.display = 'none';
            document.getElementById('huer-progress-text').style.display = 'none';
            modalError('Error al escanear: ' + e.message);
        } finally { this.procesando = false; }
    },
    render() {
        const lista = document.getElementById('huer-lista');
        if (this.archivos.length === 0) { lista.innerHTML = '<div class="text-center py-10 text-amber-500/50"><i class="fa fa-ghost text-3xl mb-3"></i><p>Presioná "Escanear GitHub"</p></div>'; return; }
        lista.innerHTML = this.archivos.map(a => {
            const isHuerfano = !a.vinculado;
            const isSelected = this.seleccionados.has(a.path);
            const infoVinculo = a.vinculado && a.juegoAsociado ? `<span style="color:#00c851"><i class="fa fa-check-circle"></i> ${escapeHtml(a.juegoAsociado.title || 'Sin título')} <span style="opacity:0.6">(${a.juegoAsociado.consola || '?'})</span></span>` : `<span style="color:#ff9966"><i class="fa fa-ghost"></i> <strong>HUÉRFANO</strong></span>`;
            return `<div class="huerfana-item ${isSelected ? 'selected' : ''}" data-path="${escapeHtml(a.path)}"><input type="checkbox" class="huerfana-checkbox" ${isSelected ? 'checked' : ''} ${!isHuerfano ? 'disabled' : ''} onchange="Huerfanas.toggleSeleccion('${escapeHtml(a.path)}', this.checked)"><img class="huerfana-thumb" src="${escapeHtml(a.url)}" onerror="this.src='https://via.placeholder.com/50x65/1a1400/ffa500?text=?'" loading="lazy"><div class="huerfana-info"><div class="huerfana-path">${a.carpeta === 'portadas' ? '📷' : '🖼️'} ${escapeHtml(a.path)}</div><div class="huerfana-meta">${infoVinculo} · ${(a.size / 1024).toFixed(1)} KB</div></div></div>`;
        }).join('');
    },
    toggleSeleccion(path, checked) { if (checked) this.seleccionados.add(path); else this.seleccionados.delete(path); this.actualizarStats(); const el = document.querySelector(`[data-path="${CSS.escape(path)}"]`); if (el) el.classList.toggle('selected', checked); },
    seleccionarTodos() { this.archivos.filter(a => !a.vinculado).forEach(a => this.seleccionados.add(a.path)); this.render(); this.actualizarStats(); },
    deseleccionarTodos() { this.seleccionados.clear(); this.render(); this.actualizarStats(); },
    async eliminarSeleccionados() {
        if (this.seleccionados.size === 0) { mostrarToast('No hay archivos seleccionados', 'info'); return; }
        const cantidad = this.seleccionados.size;
        if (!confirm(`⚠️ ¿Eliminar ${cantidad} archivo(s) huérfano(s) de GitHub?`)) return;
        document.getElementById('huer-progress-bar').style.display = 'block';
        document.getElementById('huer-progress-text').style.display = 'block';
        const paths = [...this.seleccionados];
        let eliminados = 0, fallidos = 0;
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            document.getElementById('huer-progress-detalle').textContent = `Eliminando ${i + 1}/${cantidad}: ${path.split('/').pop()}`;
            document.getElementById('huer-progress-fill').style.width = `${((i + 1) / cantidad) * 100}%`;
            const ok = await borrarArchivoGitHub(path);
            if (ok) eliminados++; else fallidos++;
        }
        this.archivos = this.archivos.filter(a => !this.seleccionados.has(a.path));
        this.seleccionados.clear(); this.render(); this.actualizarStats();
        setTimeout(() => { document.getElementById('huer-progress-bar').style.display = 'none'; document.getElementById('huer-progress-text').style.display = 'none'; }, 2000);
        if (fallidos === 0) mostrarToast(`✅ ${eliminados} eliminados`, 'success');
        else mostrarToast(`⚠️ ${eliminados} eliminados, ${fallidos} fallaron`, 'error');
    },
    actualizarStats() {
        const total = this.archivos.length;
        const vinculados = this.archivos.filter(a => a.vinculado).length;
        const huerfanos = this.archivos.filter(a => !a.vinculado).length;
        const seleccionados = this.seleccionados.size;
        document.getElementById('huer-stat-total').textContent = total;
        document.getElementById('huer-stat-vinculados').textContent = vinculados;
        document.getElementById('huer-stat-huerfanos').textContent = huerfanos;
        document.getElementById('huer-stat-seleccionados').textContent = seleccionados;
    }
};

// ==========================================
// REPORTES
// ==========================================
const Reportes = {
    reportes: [], filtroEstado: 'pendientes',
    async cargar() {
        try {
            const snap = await db.collection('reportes').get();
            this.reportes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            this.reportes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            this.actualizarStats(); this.render();
        } catch (e) { console.error(e); }
    },
    filtrar(estado) {
        this.filtroEstado = estado;
        document.querySelectorAll('#panel-reportes .filter-chip').forEach(c => c.classList.toggle('active', c.dataset.estado === estado));
        this.render();
    },
    render() {
        const lista = document.getElementById('rep-lista');
        let f = this.reportes;
        if (this.filtroEstado === 'pendientes') f = f.filter(r => !r.resuelto);
        else if (this.filtroEstado === 'resueltos') f = f.filter(r => r.resuelto);
        if (f.length === 0) { lista.innerHTML = '<div class="text-center py-10 text-amber-500/50"><i class="fa fa-flag text-3xl mb-3"></i><p>Sin reportes</p></div>'; return; }
        lista.innerHTML = f.map(r => {
            const tipoLabel = r.tipo === 'link_caido' ? '🔗 Link caído' : r.tipo === 'juego_incorrecto' ? '⚠️ Incorrecto' : '📝 Otro';
            return `<div class="reporte-card ${r.resuelto ? 'resuelto' : 'pendiente'}"><div class="flex items-start gap-3 flex-wrap"><div class="flex-1 min-w-0"><div class="flex items-center gap-2 flex-wrap mb-1"><span class="font-bold text-white">${escapeHtml(r.titulo || 'Desconocido')}</span><span class="bg-red-900/30 text-red-300 px-2 py-0.5 rounded text-xs border border-red-600/30">${tipoLabel}</span>${r.resuelto ? '<span class="bg-green-900/30 text-green-300 px-2 py-0.5 rounded text-xs border border-green-600/30">✅ Resuelto</span>' : ''}</div><div class="text-xs text-amber-500/70 mb-1">${escapeHtml(r.consola || 'N/A')} · ${r.timestamp ? new Date(r.timestamp).toLocaleString('es-ES') : ''}</div>${r.mensaje ? `<p class="text-amber-200/80 text-sm mb-1">"${escapeHtml(r.mensaje)}"</p>` : ''}<p class="text-xs text-amber-500/50">Usuario: ${escapeHtml(r.usuario || 'Anónimo')}</p></div><div class="flex gap-2">${!r.resuelto ? `<button class="boton-accion boton-nuevo" onclick="Reportes.marcarResuelto('${r.id}')"><i class="fa fa-check"></i></button>` : ''}<button class="boton-accion boton-borrar" onclick="Reportes.eliminar('${r.id}')"><i class="fa fa-trash"></i></button></div></div></div>`;
        }).join('');
    },
    async marcarResuelto(id) {
        await db.collection('reportes').doc(id).update({ resuelto: true, resueltoPor: adminActual, resueltoTimestamp: Date.now() });
        mostrarToast('✅ Reporte resuelto', 'success'); this.cargar();
    },
    async marcarTodosResueltos() {
        if (!confirm('¿Marcar todos como resueltos?')) return;
        const pendientes = this.reportes.filter(r => !r.resuelto);
        for (const r of pendientes) await db.collection('reportes').doc(r.id).update({ resuelto: true, resueltoPor: adminActual });
        mostrarToast('✅ Todos resueltos', 'success'); this.cargar();
    },
    async eliminar(id) {
        if (!confirm('¿Eliminar este reporte?')) return;
        await db.collection('reportes').doc(id).delete();
        mostrarToast('🗑️ Eliminado', 'success'); this.cargar();
    },
    async limpiarResueltos() {
        const resueltos = this.reportes.filter(r => r.resuelto);
        if (resueltos.length === 0) { mostrarToast('No hay resueltos', 'info'); return; }
        if (!confirm(`¿Eliminar ${resueltos.length} reporte(s) resueltos?`)) return;
        for (const r of resueltos) await db.collection('reportes').doc(r.id).delete();
        mostrarToast('🗑️ Limpiado', 'success'); this.cargar();
    },
    actualizarStats() {
        const total = this.reportes.length;
        const pendientes = this.reportes.filter(r => !r.resuelto).length;
        const resueltos = this.reportes.filter(r => r.resuelto).length;
        const juegos = new Set(this.reportes.map(r => r.juegoId)).size;
        document.getElementById('rep-stat-total').textContent = total;
        document.getElementById('rep-stat-pendientes').textContent = pendientes;
        document.getElementById('rep-stat-resueltos').textContent = resueltos;
        document.getElementById('rep-stat-juegos').textContent = juegos;
    }
};

// ==========================================
// GESTOR CRUD GENÉRICO
// ==========================================
class GestorCRUD {
    constructor(cfg) { this.cfg = cfg; this.items = []; this.editandoId = null; this.filtroCategoria = 'all'; this.busqueda = ''; }
    async cargar() {
        try { const d = await db.collection('sistema').doc(this.cfg.docId).get(); this.items = d.exists ? (d.data().items || []) : []; this.render(); }
        catch (e) { console.error(e); mostrarToast('Error al cargar: ' + e.message, 'error'); }
    }
    render() {
        const lista = document.getElementById(this.cfg.listaId); if (!lista) return;
        let f = [...this.items];
        if (this.busqueda) { const q = this.busqueda.toLowerCase(); f = f.filter(i => (i.nombre || '').toLowerCase().includes(q) || (i.descripcion || '').toLowerCase().includes(q) || (i.juego || '').toLowerCase().includes(q)); }
        if (this.cfg.tieneCategoria && this.filtroCategoria !== 'all') f = f.filter(i => i.categoria === this.filtroCategoria);
        if (f.length === 0) { lista.innerHTML = '<div class="text-center py-12 text-amber-500/50 col-span-full"><i class="fa fa-inbox text-4xl mb-3 opacity-50"></i><p>Sin items. ¡Agregá el primero!</p></div>'; return; }
        lista.innerHTML = f.map(i => this.renderItemCard(i)).join('');
    }
    renderItemCard(item) {
        const img = item.imagen || 'https://via.placeholder.com/600x375/1a1a2e/ffd700?text=SIN+IMAGEN';
        const badges = [];
        if (item.version) badges.push(`<span class="item-card-badge"><i class="fa fa-code-fork"></i> v${escapeHtml(item.version)}</span>`);
        if (item.categoria && this.cfg.categorias) { const cat = this.cfg.categorias[item.categoria]; if (cat) badges.push(`<span class="item-card-badge">${cat.icono} ${escapeHtml(cat.nombre)}</span>`); }
        if (item.plataforma) badges.push(`<span class="item-card-badge"><i class="fa fa-desktop"></i> ${escapeHtml(item.plataforma)}</span>`);
        if (item.juego) badges.push(`<span class="item-card-badge"><i class="fa fa-gamepad"></i> ${escapeHtml(item.juego)}</span>`);
        return `<div class="item-card"><img class="item-card-img" src="${escapeHtml(img)}" alt="${escapeHtml(item.nombre || '')}" loading="lazy" onerror="this.src='https://via.placeholder.com/600x375/1a1a2e/ffd700?text=SIN+IMAGEN'"><div class="item-card-body"><h4 class="item-card-title">${escapeHtml(item.nombre || 'Sin nombre')}</h4><div class="item-card-meta">${badges.join('')}</div><p class="item-card-desc">${escapeHtml(item.descripcion || 'Sin descripción')}</p><div class="item-card-actions"><button class="boton-accion boton-editar" onclick="${this.cfg.nombreGlobal}.editar('${item.id}')"><i class="fa fa-pencil"></i></button><button class="boton-accion boton-borrar" onclick="${this.cfg.nombreGlobal}.eliminar('${item.id}')"><i class="fa fa-trash"></i></button></div></div></div>`;
    }
    abrirModal(item = null) {
        this.editandoId = item ? item.id : null;
        document.getElementById('modal-crud-titulo').textContent = item ? `Editar: ${item.nombre || ''}` : `Nuevo ${this.cfg.nombreSingular}`;
        const campos = document.getElementById('modal-crud-campos');
        campos.innerHTML = this.cfg.campos.map(c => this.renderCampo(c, item ? (item[c.id] || '') : '')).join('');
        this.cfg.campos.filter(c => c.tipo === 'file').forEach(c => {
            const inp = document.getElementById(`campo-${c.id}`);
            if (inp) { inp.onchange = e => { const f = e.target.files[0]; if (!f) return; const prev = document.getElementById(`campo-${c.id}-preview`); if (f.type.startsWith('image/')) { const r = new FileReader(); r.onload = ev => { prev.innerHTML = `<img src="${ev.target.result}">`; }; r.readAsDataURL(f); } }; }
        });
        document.getElementById('modal-crud').style.display = 'flex';
    }
    renderCampo(c, valor) {
        const id = `campo-${c.id}`; let input = '';
        switch (c.tipo) {
            case 'text': input = `<input type="text" id="${id}" class="input-lujo" placeholder="${c.placeholder || ''}" value="${escapeHtml(valor)}" ${c.requerido ? 'required' : ''}>`; break;
            case 'url': input = `<input type="url" id="${id}" class="input-lujo" placeholder="${c.placeholder || ''}" value="${escapeHtml(valor)}" ${c.requerido ? 'required' : ''}>`; break;
            case 'textarea': input = `<textarea id="${id}" class="input-lujo" placeholder="${c.placeholder || ''}" rows="3">${escapeHtml(valor)}</textarea>`; break;
            case 'select': input = `<select id="${id}" class="input-lujo" ${c.requerido ? 'required' : ''}><option value="">-- Seleccionar --</option>${Object.entries(c.opciones).map(([k, v]) => `<option value="${k}" ${valor === k ? 'selected' : ''}>${v.icono || ''} ${v.nombre || v}</option>`).join('')}</select>`; break;
            case 'file': input = `<input type="file" id="${id}" accept="image/*" class="input-lujo text-sm"><div class="preview-box" id="${id}-preview">${valor ? `<img src="${escapeHtml(valor)}">` : '<span class="placeholder-text">Subir imagen</span>'}</div>`; break;
        }
        return `<div class="mb-3"><label class="text-xs text-amber-400/70 uppercase font-bold block mb-1">${c.icono || ''} ${c.label}${c.requerido ? ' *' : ''}</label>${input}</div>`;
    }
    async guardar(e) {
        e.preventDefault();
        const btn = document.getElementById('modal-crud-submit');
        btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Guardando...';
        try {
            const itemData = { id: this.editandoId || Date.now().toString(), timestamp: Date.now() };
            for (const c of this.cfg.campos) {
                const inp = document.getElementById(`campo-${c.id}`); if (!inp) continue;
                if (c.tipo === 'file') {
                    const f = inp.files[0];
                    if (f) { abrirModal('SUBIENDO', 'Optimizando imagen...', 30); const blob = await comprimirImagen(f); const ruta = `${this.cfg.carpetaGithub}/${c.id}_${itemData.id}.jpg`; const r = await subirArchivoGitHub(blob, ruta); itemData[c.id] = r.url; itemData[c.id + 'Path'] = r.path; cerrarModal(); }
                    else if (this.editandoId) { const orig = this.items.find(i => i.id === this.editandoId); itemData[c.id] = orig ? orig[c.id] : ''; itemData[c.id + 'Path'] = orig ? orig[c.id + 'Path'] : ''; }
                } else { itemData[c.id] = inp.value; }
            }
            if (this.editandoId) { const idx = this.items.findIndex(i => i.id === this.editandoId); if (idx !== -1) this.items[idx] = itemData; }
            else { this.items.unshift(itemData); }
            await db.collection('sistema').doc(this.cfg.docId).update({ items: this.items });
            cerrarModalCrud(); mostrarToast('✅ Guardado correctamente', 'success'); this.render();
        } catch (e) { console.error(e); mostrarToast('Error: ' + e.message, 'error'); }
        finally { btn.disabled = false; btn.innerHTML = '<i class="fa fa-save"></i> Guardar'; }
    }
    editar(id) { const item = this.items.find(i => i.id === id); if (item) this.abrirModal(item); }
    async eliminar(id) {
        if (!confirm('¿Eliminar este item? Esta acción no se puede deshacer.')) return;
        const item = this.items.find(i => i.id === id); if (!item) return;
        if (item.imagenPath) { abrirModal('ELIMINANDO', 'Borrando imágenes...', 50); await borrarArchivoGitHub(item.imagenPath); cerrarModal(); }
        this.items = this.items.filter(i => i.id !== id);
        await db.collection('sistema').doc(this.cfg.docId).update({ items: this.items });
        mostrarToast('🗑️ Eliminado', 'success'); this.render();
    }
}

function cerrarModalCrud() { document.getElementById('modal-crud').style.display = 'none'; document.getElementById('form-crud').reset(); }
document.getElementById('form-crud').addEventListener('submit', function (e) { e.preventDefault(); if (window.gestorActivo) window.gestorActivo.guardar(e); });

// ==========================================
// INSTANCIAS DE GESTORES
// ==========================================
const Emuladores = new GestorCRUD({ docId: 'emuladores', listaId: 'emuladores-lista', nombreGlobal: 'Emuladores', nombreSingular: 'Emulador', carpetaGithub: 'emuladores', tieneCategoria: false, campos: [
    { id: 'nombre', label: 'Nombre', tipo: 'text', requerido: true, icono: '📝', placeholder: 'PPSSPP' },
    { id: 'version', label: 'Versión', tipo: 'text', icono: '🏷️', placeholder: '1.17.1' },
    { id: 'plataforma', label: 'Plataforma', tipo: 'text', icono: '💻', placeholder: 'Windows / Android' },
    { id: 'imagen', label: 'Imagen', tipo: 'file', icono: '🖼️' },
    { id: 'link', label: 'Link de descarga', tipo: 'url', requerido: true, icono: '🔗', placeholder: 'https://...' },
    { id: 'descripcion', label: 'Descripción', tipo: 'textarea', icono: '📄', placeholder: 'Descripción del emulador...' }
]});
document.getElementById('emuladores-buscar').addEventListener('input', function () { Emuladores.busqueda = this.value; Emuladores.render(); });

const Apps = new GestorCRUD({ docId: 'apps', listaId: 'apps-lista', nombreGlobal: 'Apps', nombreSingular: 'Aplicación', carpetaGithub: 'apps', tieneCategoria: true, categorias: APPS_CATEGORIES, campos: [
    { id: 'nombre', label: 'Nombre', tipo: 'text', requerido: true, icono: '📝', placeholder: 'Game Booster' },
    { id: 'version', label: 'Versión', tipo: 'text', icono: '🏷️', placeholder: '2.5' },
    { id: 'categoria', label: 'Categoría', tipo: 'select', requerido: true, icono: '📁', opciones: APPS_CATEGORIES },
    { id: 'imagen', label: 'Imagen', tipo: 'file', icono: '🖼️' },
    { id: 'link', label: 'Link de descarga', tipo: 'url', requerido: true, icono: '🔗', placeholder: 'https://...' },
    { id: 'descripcion', label: 'Descripción', tipo: 'textarea', icono: '📄', placeholder: 'Descripción de la app...' }
]});
document.getElementById('apps-buscar').addEventListener('input', function () { Apps.busqueda = this.value; Apps.render(); });

const Mods = new GestorCRUD({ docId: 'mods', listaId: 'mods-lista', nombreGlobal: 'Mods', nombreSingular: 'Mod', carpetaGithub: 'mods', tieneCategoria: true, categorias: MODS_CATEGORIES, campos: [
    { id: 'nombre', label: 'Nombre del Mod', tipo: 'text', requerido: true, icono: '📝', placeholder: 'HD Texture Pack' },
    { id: 'juego', label: 'Juego relacionado', tipo: 'text', icono: '🎮', placeholder: 'GTA San Andreas' },
    { id: 'version', label: 'Versión', tipo: 'text', icono: '🏷️', placeholder: '3.0' },
    { id: 'categoria', label: 'Categoría', tipo: 'select', requerido: true, icono: '📁', opciones: MODS_CATEGORIES },
    { id: 'imagen', label: 'Imagen', tipo: 'file', icono: '🖼️' },
    { id: 'link', label: 'Link de descarga', tipo: 'url', requerido: true, icono: '🔗', placeholder: 'https://...' },
    { id: 'descripcion', label: 'Descripción', tipo: 'textarea', icono: '📄', placeholder: 'Descripción del mod...' }
]});
document.getElementById('mods-categorias').innerHTML = `<div class="category-option selected" onclick="Mods.filtrarCategoria('all')"><div class="icono">📋</div><div class="nombre">Todas</div></div>` + Object.entries(MODS_CATEGORIES).map(([k, v]) => `<div class="category-option" onclick="Mods.filtrarCategoria('${k}')"><div class="icono">${v.icono}</div><div class="nombre">${v.nombre}</div></div>`).join('');
Mods.filtrarCategoria = function (cat) { this.filtroCategoria = cat; document.querySelectorAll('#mods-categorias .category-option').forEach((el, i) => { const esAll = i === 0; const esEste = !esAll && Object.keys(MODS_CATEGORIES)[i - 1] === cat; el.classList.toggle('selected', cat === 'all' ? esAll : esEste); }); this.render(); };
document.getElementById('mods-buscar').addEventListener('input', function () { Mods.busqueda = this.value; Mods.render(); });

const Archivos = new GestorCRUD({ docId: 'archivos_gamer', listaId: 'archivos-lista', nombreGlobal: 'Archivos', nombreSingular: 'Archivo', carpetaGithub: 'archivos', tieneCategoria: true, categorias: ARCHIVOS_CATEGORIES, campos: [
    { id: 'nombre', label: 'Nombre', tipo: 'text', requerido: true, icono: '📝', placeholder: 'PS2 BIOS v2.0' },
    { id: 'sistema', label: 'Sistema/Consola', tipo: 'text', icono: '🎮', placeholder: 'PS2' },
    { id: 'categoria', label: 'Categoría', tipo: 'select', requerido: true, icono: '📁', opciones: ARCHIVOS_CATEGORIES },
    { id: 'imagen', label: 'Imagen', tipo: 'file', icono: '🖼️' },
    { id: 'link', label: 'Link de descarga', tipo: 'url', requerido: true, icono: '🔗', placeholder: 'https://...' },
    { id: 'descripcion', label: 'Descripción', tipo: 'textarea', icono: '📄', placeholder: 'Descripción del archivo...' }
]});
document.getElementById('archivos-categorias').innerHTML = `<div class="category-option selected" onclick="Archivos.filtrarCategoria('all')"><div class="icono">📋</div><div class="nombre">Todas</div></div>` + Object.entries(ARCHIVOS_CATEGORIES).map(([k, v]) => `<div class="category-option" onclick="Archivos.filtrarCategoria('${k}')"><div class="icono">${v.icono}</div><div class="nombre">${v.nombre}</div></div>`).join('');
Archivos.filtrarCategoria = function (cat) { this.filtroCategoria = cat; document.querySelectorAll('#archivos-categorias .category-option').forEach((el, i) => { const esAll = i === 0; const esEste = !esAll && Object.keys(ARCHIVOS_CATEGORIES)[i - 1] === cat; el.classList.toggle('selected', cat === 'all' ? esAll : esEste); }); this.render(); };
document.getElementById('archivos-buscar').addEventListener('input', function () { Archivos.busqueda = this.value; Archivos.render(); });

// ==========================================
// NOVEDADES
// ==========================================
const Novedades = {
    items: [], colorSeleccionado: 'green-400', editandoId: null,
    async cargar() {
        try { const d = await db.collection('sistema').doc('novedades').get(); this.items = d.exists ? (d.data().items || []) : []; this.items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); this.render(); }
        catch (e) { console.error(e); }
    },
    render() {
        const lista = document.getElementById('novedades-lista');
        if (this.items.length === 0) { lista.innerHTML = '<div class="text-center py-12 text-amber-500/50"><i class="fa fa-bullhorn text-4xl mb-3 opacity-50"></i><p>Sin novedades. ¡Agregá la primera!</p></div>'; return; }
        lista.innerHTML = this.items.map(n => `<div class="elemento-lista p-3 flex items-start gap-3"><div class="flex-1"><div class="flex items-center gap-2 mb-1 flex-wrap"><span class="font-bold text-${n.color || 'green-400'} uppercase text-sm">${escapeHtml(n.titulo || 'NUEVO')}</span><span class="text-xs text-amber-500/50">${n.fecha ? new Date(n.fecha).toLocaleDateString('es-ES') : ''}</span></div><p class="text-amber-200/80 text-sm">${escapeHtml(n.texto || '')}</p></div><button class="boton-accion boton-editar" onclick="Novedades.editar('${n.id}')"><i class="fa fa-pencil"></i></button><button class="boton-accion boton-borrar" onclick="Novedades.eliminar('${n.id}')"><i class="fa fa-trash"></i></button></div>`).join('');
    },
    abrirModal(item = null) {
        this.editandoId = item ? item.id : null;
        this.colorSeleccionado = item ? item.color : 'green-400';
        document.getElementById('modal-crud-titulo').textContent = item ? 'Editar Novedad' : 'Nueva Novedad';
        document.getElementById('modal-crud-campos').innerHTML = `<div class="mb-3"><label class="text-xs text-amber-400/70 uppercase font-bold block mb-1">📌 Título</label><input type="text" id="campo-titulo" class="input-lujo" placeholder="ACTUALIZACIÓN" value="${escapeHtml(item?.titulo || '')}" required></div><div class="mb-3"><label class="text-xs text-amber-400/70 uppercase font-bold block mb-1">📄 Texto</label><textarea id="campo-texto" class="input-lujo" placeholder="Contenido de la novedad..." rows="3" required>${escapeHtml(item?.texto || '')}</textarea></div><div class="mb-3"><label class="text-xs text-amber-400/70 uppercase font-bold block mb-1">🎨 Color del título</label><div class="color-picker">${['cyan-400', 'green-400', 'purple-400', 'pink-400', 'orange-400', 'red-400'].map(c => `<div class="color-option ${c} ${this.colorSeleccionado === c ? 'selected' : ''}" onclick="Novedades.seleccionarColor('${c}')"></div>`).join('')}</div></div>`;
        document.getElementById('modal-crud').style.display = 'flex';
    },
    seleccionarColor(color) { this.colorSeleccionado = color; document.querySelectorAll('.color-option').forEach(el => el.classList.toggle('selected', el.classList.contains(color))); },
    async guardar(e) {
        e.preventDefault();
        const btn = document.getElementById('modal-crud-submit');
        btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Guardando...';
        try {
            const hoy = new Date();
            const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
            const item = { id: this.editandoId || Date.now().toString(), titulo: document.getElementById('campo-titulo').value, texto: document.getElementById('campo-texto').value, color: this.colorSeleccionado, fecha, timestamp: Date.now() };
            if (this.editandoId) { const idx = this.items.findIndex(i => i.id === this.editandoId); if (idx !== -1) this.items[idx] = item; }
            else this.items.unshift(item);
            await db.collection('sistema').doc('novedades').update({ items: this.items });
            cerrarModalCrud(); mostrarToast('✅ Novedad guardada', 'success'); this.render();
        } catch (e) { mostrarToast('Error: ' + e.message, 'error'); }
        finally { btn.disabled = false; btn.innerHTML = '<i class="fa fa-save"></i> Guardar'; }
    },
    editar(id) { const item = this.items.find(i => i.id === id); if (item) this.abrirModal(item); },
    async eliminar(id) {
        if (!confirm('¿Eliminar esta novedad?')) return;
        this.items = this.items.filter(i => i.id !== id);
        await db.collection('sistema').doc('novedades').update({ items: this.items });
        mostrarToast('🗑️ Eliminada', 'success'); this.render();
    }
};

// ==========================================
// TOP BUSCADOS
// ==========================================
const TopBuscados = {
    games: [],
    async cargar() {
        try { const d = await db.collection('sistema').doc('top_buscados').get(); this.games = d.exists ? (d.data().games || []) : []; this.render(); }
        catch (e) { console.error(e); }
    },
    render() {
        const lista = document.getElementById('top-lista');
        if (this.games.length === 0) { lista.innerHTML = '<div class="text-center py-12 text-amber-500/50"><i class="fa fa-fire text-4xl mb-3 opacity-50"></i><p>Sin juegos en el top. ¡Agregá el primero!</p></div>'; return; }
        lista.innerHTML = this.games.map((g, i) => `<div class="top-item"><div class="top-item-pos">${i + 1}</div><div class="top-item-info"><div class="top-item-title">${escapeHtml(g.title || 'Sin título')}</div><div class="top-item-console">${escapeHtml(g.consola || 'N/A')}</div></div><button class="boton-accion boton-borrar" onclick="TopBuscados.eliminar(${i})"><i class="fa fa-trash"></i></button></div>`).join('');
    },
    abrirModal() {
        document.getElementById('modal-top').style.display = 'flex';
        document.getElementById('top-buscar-juego').value = '';
        this.renderResultados('');
    },
    renderResultados(q) {
        const resultados = document.getElementById('top-resultados');
        let f = listaJuegos;
        if (q) f = listaJuegos.filter(j => (j.title || '').toLowerCase().includes(q.toLowerCase()));
        f = f.slice(0, 20);
        if (f.length === 0) { resultados.innerHTML = '<div class="text-center py-4 text-amber-500/50 text-sm">Sin resultados</div>'; return; }
        resultados.innerHTML = f.map(j => `<div class="elemento-lista p-2 flex items-center gap-2 cursor-pointer hover:bg-amber-900/20" onclick='TopBuscados.agregarDesdeCatalogo(${JSON.stringify(j).replace(/'/g, "&#39;")})'><img src="${escapeHtml(j.cover || '')}" class="w-8 h-10 object-cover rounded" onerror="this.src='https://via.placeholder.com/32x40/1a1400/ffd700?text=?'"><div class="flex-1 min-w-0"><div class="font-bold text-white truncate text-sm">${escapeHtml(j.title || 'Sin título')}</div><div class="text-xs text-amber-500/70">${j.consola}</div></div><i class="fa fa-plus text-green-400"></i></div>`).join('');
    },
    agregarDesdeCatalogo(juego) {
        this.games.push({ title: juego.title, consola: juego.consola, cover: juego.cover, link: juego.link, tipo: juego.tipo });
        this.guardar(); document.getElementById('modal-top').style.display = 'none';
    },
    async guardar() {
        await db.collection('sistema').doc('top_buscados').update({ games: this.games });
        mostrarToast('✅ Top actualizado', 'success'); this.render();
    },
    async eliminar(index) {
        if (!confirm('¿Quitar este juego del top?')) return;
        this.games.splice(index, 1); await this.guardar();
    }
};
document.getElementById('top-buscar-juego').addEventListener('input', function () { TopBuscados.renderResultados(this.value); });
document.getElementById('form-top-manual').addEventListener('submit', async function (e) {
    e.preventDefault();
    const titulo = document.getElementById('top-manual-titulo').value;
    const consola = document.getElementById('top-manual-consola').value;
    const cover = document.getElementById('top-manual-cover').value;
    const link = document.getElementById('top-manual-link').value;
    if (!titulo) { mostrarToast('Ingresá al menos el título', 'error'); return; }
    TopBuscados.games.push({ title: titulo, consola, cover, link });
    await TopBuscados.guardar(); document.getElementById('modal-top').style.display = 'none'; this.reset();
});

// Observador para el gestor activo
const observer = new MutationObserver(() => {
    const activa = document.querySelector('.panel-extras-seccion.activa');
    if (activa) {
        const id = activa.id.replace('extras-', '');
        const mapa = { emuladores: 'Emuladores', apps: 'Apps', mods: 'Mods', archivos: 'Archivos', novedades: 'Novedades' };
        if (mapa[id]) window.gestorActivo = { Emuladores, Apps, Mods, Archivos, Novedades }[mapa[id]];
    }
});
observer.observe(document.getElementById('panel-extras'), { subtree: true, attributes: true, attributeFilter: ['class'] });





// ==========================================
// GESTIÓN DE JUEGOS +18 (NSFW)
// ==========================================
let nsfwGamesList = [];
let nsfwCapturasTemp = [];

// Navegación desde bienvenida
document.getElementById('btn-ir-a-nsfw').onclick = async () => {
    document.getElementById('pantalla-bienvenida').style.display = 'none';
    document.getElementById('panel-nsfw').style.display = 'block';
    document.getElementById('admin-nsfw-name').textContent = adminActual;
    abrirModal('CARGANDO', 'Obteniendo juegos +18...', 50);
    await cargarNSFWGames();
    cerrarModal();
};

// Volver desde NSFW
document.getElementById('btn-volver-inicio-desde-nsfw').onclick = () => {
    document.getElementById('panel-nsfw').style.display = 'none';
    document.getElementById('pantalla-bienvenida').style.display = 'flex';
};

// ==========================================
// CARGAR LISTA NSFW
// ==========================================
async function cargarNSFWGames() {
    try {
        const doc = await db.collection('sistema').doc('nsfw_games').get();
        if (doc.exists && doc.data().games) {
            nsfwGamesList = doc.data().games.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        } else {
            nsfwGamesList = [];
        }
        renderNSFWStats();
        renderNSFWLista();
    } catch (err) {
        console.error("Error cargando NSFW:", err);
        document.getElementById('nsfw-lista').innerHTML = `<div class="text-red-400 text-center py-10">Error al cargar: ${err.message}</div>`;
    }
}

function renderNSFWStats() {
    document.getElementById('nsfw-total').textContent = nsfwGamesList.length;
    document.getElementById('nsfw-con-link').textContent = nsfwGamesList.filter(g => g.link && g.link.trim() !== '').length;
    document.getElementById('nsfw-con-partes').textContent = nsfwGamesList.filter(g => Array.isArray(g.partes) && g.partes.length > 0).length;
}

function renderNSFWLista() {
    const busqueda = (document.getElementById('nsfw-buscar').value || '').toLowerCase();
    const filtrados = nsfwGamesList.filter(j => !busqueda || (j.title && j.title.toLowerCase().includes(busqueda)));
    const contenedor = document.getElementById('nsfw-lista');
    
    if (filtrados.length === 0) {
        contenedor.innerHTML = `<div class="text-center py-10 text-red-500/50"><i class="fa fa-inbox text-3xl mb-3"></i><p>${nsfwGamesList.length === 0 ? 'Sin juegos +18. ¡Agregá el primero!' : 'No se encontraron resultados'}</p></div>`;
        return;
    }
    
    contenedor.innerHTML = filtrados.map(j => {
        const tienePortada = j.cover && j.cover.trim() !== '';
        const portadaSrc = tienePortada ? limpiarUrl(j.cover) : 'https://via.placeholder.com/80x100/1a0000/ff0040?text=NSFW';
        const tieneLink = j.link && j.link.trim() !== '';
        const tienePartes = Array.isArray(j.partes) && j.partes.length > 0;
        const tieneDatos = Array.isArray(j.datos) && j.datos.length > 0;
        
        let badges = '';
        if (tieneLink) badges += '<span class="text-xs text-green-400 ml-1" title="Tiene link principal"><i class="fa fa-link"></i></span>';
        if (tienePartes) badges += `<span class="text-xs text-purple-400 ml-1" title="${j.partes.length} parte(s)"><i class="fa fa-cubes"></i> ${j.partes.length}</span>`;
        if (tieneDatos) badges += `<span class="text-xs text-orange-400 ml-1" title="${j.datos.length} dato(s)"><i class="fa fa-database"></i> ${j.datos.length}</span>`;
        
        return `
        <div class="elemento-lista p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4" style="border-left: 3px solid #ff0040;">
            <div class="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <img src="${portadaSrc}" class="w-14 h-18 sm:w-16 sm:h-20 object-cover rounded-lg border border-red-700/50 shadow-md flex-shrink-0" 
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/80x100/1a0000/ff4444?text=Error'; this.style.opacity='0.5';" loading="lazy">
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-base sm:text-lg truncate text-white flex items-center">
                        ${j.title || 'Sin título'}
                        <span class="nsfw-badge-mini ml-2 text-white" style="background: linear-gradient(135deg, #ff0040, #cc0033); font-size: 0.6rem; padding: 2px 6px; border-radius: 999px;">+18</span>
                    </h3>
                    <p class="text-xs sm:text-sm text-red-400/70 flex items-center gap-2 flex-wrap mt-1">
                        ${badges}
                    </p>
                    ${j.descripcion ? `<p class="text-xs text-gray-400 mt-1 line-clamp-2">${j.descripcion.substring(0, 80)}${j.descripcion.length > 80 ? '...' : ''}</p>` : ''}
                </div>
            </div>
            <div class="flex gap-2 w-full sm:w-auto justify-end sm:justify-start">
                <button onclick="editarNSFWGame('${j.id}')" class="boton-accion boton-editar flex-1 sm:flex-none text-xs sm:text-sm">
                    <i class="fa fa-pencil"></i> <span class="hidden sm:inline">Editar</span>
                </button>
                <button onclick="borrarNSFWGame('${j.id}')" class="boton-accion boton-borrar flex-1 sm:flex-none text-xs sm:text-sm">
                    <i class="fa fa-trash"></i> <span class="hidden sm:inline">Borrar</span>
                </button>
            </div>
        </div>`;
    }).join('');
}

document.getElementById('nsfw-buscar').oninput = renderNSFWLista;

// ==========================================
// SUBIDA DE IMÁGENES NSFW
// ==========================================
document.getElementById('nsfw-imgPortada').onchange = async (e) => {
    const arch = e.target.files[0];
    if (!arch) return;
    if (arch.size > 5 * 1024 * 1024) { mostrarToast('La imagen excede 5MB.', 'error'); e.target.value = ''; return; }
    abrirModal('OPTIMIZANDO', 'Comprimiendo imagen...', 30);
    try {
        const blobComprimido = await comprimirImagen(arch);
        abrirModal('SUBIENDO PORTADA', 'Enviando a GitHub...', 70);
        const idUnico = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        const ruta = `nsfw/portadas/portada_nsfw_${idUnico}.jpg`;
        const resultado = await subirArchivoGitHub(blobComprimido, ruta);
        document.getElementById('nsfw-coverUrl').value = resultado.url;
        document.getElementById('nsfw-coverPath').value = resultado.path;
        const img = document.getElementById('nsfw-prevPortada');
        img.src = limpiarUrl(resultado.url); img.style.display = 'block';
        cerrarModal();
        mostrarToast('Portada subida correctamente', 'success');
    } catch (err) { cerrarModal(); modalError('Fallo al subir: ' + err.message); }
};

document.getElementById('nsfw-imgCapturas').onchange = async (e) => {
    const archs = [...e.target.files];
    if (archs.length === 0) return;
    nsfwCapturasTemp = [];
    document.getElementById('nsfw-prevCapturas').innerHTML = '';
    for (let i = 0; i < archs.length; i++) {
        if (archs[i].size > 5 * 1024 * 1024) { mostrarToast(`${archs[i].name} excede 5MB.`, 'error'); continue; }
        abrirModal('OPTIMIZANDO', `Comprimiendo ${i+1}/${archs.length}...`, (i/archs.length)*50);
        try {
            const blobComprimido = await comprimirImagen(archs[i]);
            abrirModal('SUBIENDO', `Enviando ${i+1}/${archs.length}...`, 50 + ((i+1)/archs.length)*50);
            const idUnico = Date.now().toString(36) + i;
            const ruta = `nsfw/capturas/capt_nsfw_${idUnico}.jpg`;
            const resultado = await subirArchivoGitHub(blobComprimido, ruta);
            nsfwCapturasTemp.push(resultado);
            const img = document.createElement('img');
            img.src = limpiarUrl(resultado.url); img.className = 'vista-previa-mini';
            document.getElementById('nsfw-prevCapturas').appendChild(img);
        } catch (err) { mostrarToast(`Error al subir ${archs[i].name}`, 'error'); }
    }
    document.getElementById('nsfw-capturasData').value = JSON.stringify(nsfwCapturasTemp);
    cerrarModal();
    if (nsfwCapturasTemp.length > 0) mostrarToast(`${nsfwCapturasTemp.length} capturas subidas`, 'success');
};

// ==========================================
// DATOS Y PARTES DINÁMICAS (NSFW)
// ==========================================
function crearFilaCampoNSFW(tipo, nombre = '', url = '') {
    const div = document.createElement('div');
    div.className = `flex gap-2 items-start grupo-${tipo}-nsfw animate-fade-in`;
    div.innerHTML = `
        <input type="text" class="input-lujo text-xs flex-1 ${tipo}-nombre-nsfw" placeholder="Nombre (ej: Parte 1, Save Data)" value="${nombre}" required>
        <input type="url" class="input-lujo text-xs flex-[2] ${tipo}-url-nsfw" placeholder="URL de descarga" value="${url}" required>
        <button type="button" class="btn-eliminar-campo-nsfw bg-red-900/30 text-red-300 border border-red-600/50 w-8 h-8 flex items-center justify-center rounded hover:bg-red-900/50 transition-colors flex-shrink-0" title="Eliminar">
            <i class="fa fa-trash"></i>
        </button>
    `;
    div.querySelector('.btn-eliminar-campo-nsfw').addEventListener('click', () => { div.remove(); });
    return div;
}

document.getElementById('nsfw-btn-agregar-dato').addEventListener('click', () => {
    document.getElementById('nsfw-contenedor-datos').appendChild(crearFilaCampoNSFW('dato'));
});
document.getElementById('nsfw-btn-agregar-parte').addEventListener('click', () => {
    document.getElementById('nsfw-contenedor-partes').appendChild(crearFilaCampoNSFW('parte'));
});

// ==========================================
// GUARDAR NUEVO JUEGO NSFW
// ==========================================
document.getElementById('form-nsfw').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa fa-circle-o-notch fa-spin"></i> GUARDANDO...';
    try {
        // Recolección de Datos y Partes
        const datosArray = [];
        document.querySelectorAll('#nsfw-contenedor-datos .grupo-dato-nsfw').forEach(fila => {
            const nombre = fila.querySelector('.dato-nombre-nsfw').value.trim();
            const url = fila.querySelector('.dato-url-nsfw').value.trim();
            if (nombre && url) datosArray.push({ nombre, url });
        });

        const partesArray = [];
        document.querySelectorAll('#nsfw-contenedor-partes .grupo-parte-nsfw').forEach(fila => {
            const nombre = fila.querySelector('.parte-nombre-nsfw').value.trim();
            const url = fila.querySelector('.parte-url-nsfw').value.trim();
            if (nombre && url) partesArray.push({ nombre, url });
        });

        const linkPrincipal = document.getElementById('nsfw-link').value.trim();
        if (!linkPrincipal && datosArray.length === 0 && partesArray.length === 0) {
            mostrarToast('Debes proporcionar al menos un enlace, un Dato o una Parte.', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa fa-save"></i> GUARDAR JUEGO +18';
            return;
        }

        const coverUrlFinal = limpiarUrl(document.getElementById('nsfw-coverUrl').value);
        const nuevoJuego = {
            id: Date.now().toString(),
            title: document.getElementById('nsfw-titulo').value.trim(),
            idJuego: document.getElementById('nsfw-idJuego').value.trim(),
            cover: coverUrlFinal,
            coverPath: document.getElementById('nsfw-coverPath').value,
            screenshots: nsfwCapturasTemp.map(c => limpiarUrl(c.url)),
            screenshotsPaths: nsfwCapturasTemp.map(c => c.path),
            link: linkPrincipal,
            descripcion: document.getElementById('nsfw-descripcion').value.trim(),
            tipo: 'nsfw',
            consola: 'nsfw',
            uploadedBy: adminActual,
            timestamp: Date.now(),
            datos: datosArray,
            partes: partesArray
        };

        // Guardar en Firebase
        const docRef = db.collection('sistema').doc('nsfw_games');
        const docSnap = await docRef.get();
        const currentGames = docSnap.exists && docSnap.data().games ? docSnap.data().games : [];
        currentGames.push(nuevoJuego);
        await docRef.set({ games: currentGames }, { merge: true });

        // Limpieza
        e.target.reset();
        document.getElementById('nsfw-prevPortada').style.display = 'none';
        document.getElementById('nsfw-prevCapturas').innerHTML = '';
        document.getElementById('nsfw-coverUrl').value = '';
        document.getElementById('nsfw-coverPath').value = '';
        document.getElementById('nsfw-capturasData').value = '';
        document.getElementById('nsfw-contenedor-datos').innerHTML = '';
        document.getElementById('nsfw-contenedor-partes').innerHTML = '';
        nsfwCapturasTemp = [];
        
        mostrarToast(`Juego +18 guardado por ${adminActual}`, 'success');
        await cargarNSFWGames();
    } catch (err) { 
        console.error(err);
        mostrarToast('Error al guardar: ' + err.message, 'error'); 
    }
    finally { 
        btn.disabled = false; 
        btn.innerHTML = '<i class="fa fa-save"></i> GUARDAR JUEGO +18'; 
    }
};

// ==========================================
// EDITAR JUEGO NSFW
// ==========================================
window.editarNSFWGame = function(id) {
    const j = nsfwGamesList.find(x => x.id === id);
    if (!j) return;
    
    document.getElementById('editNsfwId').value = id;
    document.getElementById('editNsfwOriginalTimestamp').value = j.timestamp || Date.now();
    document.getElementById('editNsfwIdJuego').value = j.idJuego || '';
    document.getElementById('editNsfwTitulo').value = j.title || '';
    document.getElementById('editNsfwLink').value = j.link || '';
    document.getElementById('editNsfwDesc').value = j.descripcion || '';
    document.getElementById('editNsfwCoverUrlInput').value = limpiarUrl(j.cover || '');
    
    // Portada preview
    const coverPreview = document.getElementById('edit-nsfw-cover-preview');
    const coverNoImg = document.getElementById('edit-nsfw-cover-no-img');
    const btnDeleteCover = document.getElementById('btn-delete-edit-nsfw-cover');
    if (j.cover) {
        coverPreview.src = limpiarUrl(j.cover); 
        coverPreview.style.display = 'block';
        coverNoImg.classList.add('hidden'); 
        btnDeleteCover.classList.remove('hidden');
    } else {
        coverPreview.style.display = 'none'; 
        coverNoImg.classList.remove('hidden');
        btnDeleteCover.classList.add('hidden');
    }
    
    // Capturas
    renderizarCapturasEditNSFW(j.screenshots || []);
    document.getElementById('editNsfwCapturasUrlInput').value = '';
    
    // Datos y Partes
    const contEditDatos = document.getElementById('contenedor-edit-nsfw-datos');
    const contEditPartes = document.getElementById('contenedor-edit-nsfw-partes');
    contEditDatos.innerHTML = '';
    contEditPartes.innerHTML = '';
    
    if (Array.isArray(j.datos)) {
        j.datos.forEach(d => contEditDatos.appendChild(crearFilaCampoNSFW('dato', d.nombre, d.url)));
    }
    if (Array.isArray(j.partes)) {
        j.partes.forEach(p => contEditPartes.appendChild(crearFilaCampoNSFW('parte', p.nombre, p.url)));
    }
    
    document.getElementById('modal-editar-nsfw').style.display = 'flex';
};

function renderizarCapturasEditNSFW(urls) {
    const grid = document.getElementById('edit-nsfw-capturas-grid');
    const noImg = document.getElementById('edit-nsfw-capturas-no-img');
    grid.innerHTML = '';
    if (urls.length === 0) { noImg.classList.remove('hidden'); return; }
    noImg.classList.add('hidden');
    urls.forEach((url, index) => {
        const div = document.createElement('div');
        div.className = 'relative group';
        div.innerHTML = `
            <img src="${limpiarUrl(url)}" class="w-20 h-20 object-cover rounded-lg border border-red-700/50" 
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/80x80/1a0000/ff4444?text=Error'; this.style.opacity='0.5';">
            <button type="button" onclick="eliminarCapturaEditNSFW(${index})" class="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-700 active:scale-95 text-xs">
                <i class="fa fa-times"></i>
            </button>`;
        grid.appendChild(div);
    });
}

let editNsfwCapturasUrlsToKeep = [];
let editNsfwCapturasPathsToDelete = [];
let editNsfwCoverPathToDelete = '';

window.eliminarCapturaEditNSFW = function(index) {
    const juego = nsfwGamesList.find(x => x.id === document.getElementById('editNsfwId').value);
    if (!juego) return;
    const path = juego.screenshotsPaths ? juego.screenshotsPaths[index] : '';
    if (path) editNsfwCapturasPathsToDelete.push(path);
    editNsfwCapturasUrlsToKeep.splice(index, 1);
    renderizarCapturasEditNSFW(editNsfwCapturasUrlsToKeep);
};

// Al abrir el modal de edición, inicializar las variables
const originalEditarNSFW = window.editarNSFWGame;
window.editarNSFWGame = function(id) {
    editNsfwCapturasUrlsToKeep = [];
    editNsfwCapturasPathsToDelete = [];
    editNsfwCoverPathToDelete = '';
    const j = nsfwGamesList.find(x => x.id === id);
    if (j) {
        editNsfwCapturasUrlsToKeep = [...(j.screenshots || [])];
        if (j.coverPath) editNsfwCoverPathToDelete = j.coverPath;
    }
    originalEditarNSFW(id);
};

// Subir nueva portada en edición NSFW
document.getElementById('edit-nsfw-imgPortada').onchange = async (e) => {
    const arch = e.target.files[0]; if (!arch) return;
    if (arch.size > 5 * 1024 * 1024) { mostrarToast('Excede 5MB.', 'error'); e.target.value = ''; return; }
    abrirModal('OPTIMIZANDO', 'Comprimiendo...', 30);
    try {
        const blobComprimido = await comprimirImagen(arch);
        abrirModal('SUBIENDO PORTADA', 'Enviando...', 70);
        const idUnico = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        const ruta = `nsfw/portadas/portada_nsfw_edit_${idUnico}.jpg`;
        const resultado = await subirArchivoGitHub(blobComprimido, ruta);
        const juego = nsfwGamesList.find(x => x.id === document.getElementById('editNsfwId').value);
        if (juego && juego.coverPath) editNsfwCoverPathToDelete = juego.coverPath;
        document.getElementById('edit-nsfw-cover-preview').src = limpiarUrl(resultado.url);
        document.getElementById('edit-nsfw-cover-preview').style.display = 'block';
        document.getElementById('edit-nsfw-cover-no-img').classList.add('hidden');
        document.getElementById('btn-delete-edit-nsfw-cover').classList.remove('hidden');
        document.getElementById('editNsfwCoverUrlInput').value = limpiarUrl(resultado.url);
        cerrarModal();
        mostrarToast('Nueva portada lista', 'success');
    } catch (err) { cerrarModal(); modalError('Fallo: ' + err.message); }
};

document.getElementById('btn-delete-edit-nsfw-cover').onclick = function() {
    const juego = nsfwGamesList.find(x => x.id === document.getElementById('editNsfwId').value);
    if (juego && juego.coverPath) editNsfwCoverPathToDelete = juego.coverPath;
    document.getElementById('edit-nsfw-cover-preview').style.display = 'none';
    document.getElementById('edit-nsfw-cover-no-img').classList.remove('hidden');
    document.getElementById('btn-delete-edit-nsfw-cover').classList.add('hidden');
    document.getElementById('editNsfwCoverUrlInput').value = '';
};

// Subir nuevas capturas en edición NSFW
document.getElementById('edit-nsfw-imgCapturas').onchange = async (e) => {
    const archs = [...e.target.files]; if (archs.length === 0) return;
    for (let i = 0; i < archs.length; i++) {
        if (archs[i].size > 5 * 1024 * 1024) { mostrarToast(`${archs[i].name} excede 5MB.`, 'error'); continue; }
        abrirModal('OPTIMIZANDO', `Comprimiendo ${i+1}/${archs.length}...`, (i/archs.length)*50);
        try {
            const blobComprimido = await comprimirImagen(archs[i]);
            abrirModal('SUBIENDO', `Enviando ${i+1}/${archs.length}...`, 50 + ((i+1)/archs.length)*50);
            const idUnico = Date.now().toString(36) + i;
            const ruta = `nsfw/capturas/capt_nsfw_edit_${idUnico}.jpg`;
            const resultado = await subirArchivoGitHub(blobComprimido, ruta);
            editNsfwCapturasUrlsToKeep.push(limpiarUrl(resultado.url));
        } catch (err) { mostrarToast(`Error al subir ${archs[i].name}`, 'error'); }
    }
    renderizarCapturasEditNSFW(editNsfwCapturasUrlsToKeep);
    cerrarModal();
    mostrarToast(`${archs.length} capturas agregadas`, 'success');
    e.target.value = '';
};

// Botones agregar en edición NSFW
document.querySelector('.btn-agregar-edit-nsfw-datos')?.addEventListener('click', () => {
    document.getElementById('contenedor-edit-nsfw-datos').appendChild(crearFilaCampoNSFW('dato'));
});
document.querySelector('.btn-agregar-edit-nsfw-partes')?.addEventListener('click', () => {
    document.getElementById('contenedor-edit-nsfw-partes').appendChild(crearFilaCampoNSFW('parte'));
});

// ==========================================
// GUARDAR EDICIÓN NSFW
// ==========================================
document.getElementById('formEditarNSFW').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('editNsfwId').value;
    const timestampOriginal = parseInt(document.getElementById('editNsfwOriginalTimestamp').value) || Date.now();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'ACTUALIZANDO...';
    try {
        // Recolección de Datos y Partes
        const datosArray = [];
        document.querySelectorAll('#contenedor-edit-nsfw-datos .grupo-dato-nsfw').forEach(fila => {
            const nombre = fila.querySelector('.dato-nombre-nsfw').value.trim();
            const url = fila.querySelector('.dato-url-nsfw').value.trim();
            if (nombre && url) datosArray.push({ nombre, url });
        });

        const partesArray = [];
        document.querySelectorAll('#contenedor-edit-nsfw-partes .grupo-parte-nsfw').forEach(fila => {
            const nombre = fila.querySelector('.parte-nombre-nsfw').value.trim();
            const url = fila.querySelector('.parte-url-nsfw').value.trim();
            if (nombre && url) partesArray.push({ nombre, url });
        });

        const coverUrlFinal = limpiarUrl(document.getElementById('editNsfwCoverUrlInput').value.trim());
        let coverPathFinal = extraerPathDeUrl(coverUrlFinal);
        const urlsPegadas = document.getElementById('editNsfwCapturasUrlInput').value
            .split('\n').map(u => u.trim()).filter(u => u).map(u => limpiarUrl(u));
        const capturasFinales = [...new Set([...editNsfwCapturasUrlsToKeep.map(limpiarUrl), ...urlsPegadas])];

        const juegoActualizado = {
            id: id,
            title: document.getElementById('editNsfwTitulo').value.trim(),
            idJuego: document.getElementById('editNsfwIdJuego').value.trim(),
            cover: coverUrlFinal,
            coverPath: coverPathFinal,
            screenshots: capturasFinales,
            screenshotsPaths: capturasFinales.map(extraerPathDeUrl).filter(Boolean),
            link: document.getElementById('editNsfwLink').value.trim(),
            descripcion: document.getElementById('editNsfwDesc').value.trim(),
            tipo: 'nsfw',
            consola: 'nsfw',
            editedBy: adminActual,
            editTimestamp: Date.now(),
            timestamp: timestampOriginal,
            datos: datosArray,
            partes: partesArray
        };

        // Actualizar en Firebase
        const docRef = db.collection('sistema').doc('nsfw_games');
        const docSnap = await docRef.get();
        let games = docSnap.exists && docSnap.data().games ? docSnap.data().games : [];
        games = games.filter(g => g.id !== id);
        games.push(juegoActualizado);
        await docRef.set({ games: games }, { merge: true });

        // Borrar archivos viejos de GitHub
        if (editNsfwCoverPathToDelete && editNsfwCoverPathToDelete !== coverPathFinal) {
            await borrarArchivoGitHub(editNsfwCoverPathToDelete);
        }
        for (const path of editNsfwCapturasPathsToDelete) {
            if (path) await borrarArchivoGitHub(path);
        }

        document.getElementById('modal-editar-nsfw').style.display = 'none';
        mostrarToast('Juego +18 actualizado por ' + adminActual, 'success');
        await cargarNSFWGames();
    } catch (err) { 
        console.error(err);
        mostrarToast('Error al actualizar: ' + err.message, 'error'); 
    }
    finally { 
        btn.disabled = false; 
        btn.textContent = 'ACTUALIZAR REGISTRO'; 
    }
};

// ==========================================
// BORRAR JUEGO NSFW
// ==========================================
window.borrarNSFWGame = async function(idJuego) {
    if (!confirm("⚠️ ¿ESTÁS SEGURO?\n\nSe eliminarán las imágenes de GitHub y el registro del juego +18.")) return;
    const juego = nsfwGamesList.find(x => x.id === idJuego);
    if (!juego) return;
    abrirModal("ELIMINANDO", "Paso 1: Actualizando base de datos...", 10);
    try {
        const docRef = db.collection('sistema').doc('nsfw_games');
        const docSnap = await docRef.get();
        let games = docSnap.exists && docSnap.data().games ? docSnap.data().games : [];
        games = games.filter(j => j.id !== idJuego);
        await docRef.set({ games: games }, { merge: true });
        
        document.getElementById('detalle-modal').textContent = "Paso 2: Eliminando imágenes de GitHub...";
        document.getElementById('barra-progreso').style.width = "50%";
        
        if (juego.coverPath) await borrarArchivoGitHub(juego.coverPath);
        const pathsCapturas = juego.screenshotsPaths || [];
        for (let i = 0; i < pathsCapturas.length; i++) {
            document.getElementById('detalle-modal').textContent = `Eliminando captura ${i+1}/${pathsCapturas.length}...`;
            document.getElementById('barra-progreso').style.width = `${50 + ((i+1)/pathsCapturas.length)*40}%`;
            await borrarArchivoGitHub(pathsCapturas[i]);
        }
        
        modalExito("Juego +18 e imágenes eliminados correctamente.");
        await cargarNSFWGames();
    } catch (err) { modalError("Error: " + err.message); }
};