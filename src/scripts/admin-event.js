// ============================
// ADMIN EVENT — ALESSIA ADVENTURES
// ============================

let currentEventName = '';
let eventData = null;
let pendingStatusGuestId = null;
let currentInvitationUrl = '';

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentEventName = urlParams.get('event');

  if (!currentEventName) {
    showError('No se especificó el evento a administrar. Agrega ?event=NombreDelEvento a la URL.');
    return;
  }

  loadEventData();
  setupFormListeners();
});

// ============================
// CARGA DE DATOS
// ============================
async function loadEventData() {
  showLoading(true);
  try {
    const res = await fetch(`/api/admin-events?eventId=${encodeURIComponent(currentEventName)}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.error || 'Error desconocido');

    eventData = data;
    fillGeneralForm(data.event);
    updateStats(data.stats);
    fillGuestsTable(data.guests);
    showLoading(false);
    document.getElementById('admin-content').style.display = 'block';
  } catch (err) {
    showError(`Error cargando datos: ${err.message}`);
    showLoading(false);
  }
}

// ============================
// UI HELPERS
// ============================
function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showError(msg) {
  const el = document.getElementById('error');
  el.textContent = msg;
  el.style.display = 'block';
}

function toast(msg, type = 'success') {
  // Remove any existing toast
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const icons = { success: '✅', error: '❌', info: '💡' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type] || '💬'}</span><span class="toast-msg">${msg}</span>`;
  document.body.appendChild(t);

  setTimeout(() => {
    t.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// ============================
// FORMULARIO GENERAL
// ============================
function fillGeneralForm(event) {
  document.getElementById('event-name').value = event.name || '';
  document.getElementById('event-description').value = event.description || '';
  if (event.event_date) {
    const d = new Date(event.event_date);
    const pad = n => String(n).padStart(2, '0');
    document.getElementById('event-date').value =
      `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}

function updateStats(stats) {
  document.getElementById('total-guests').textContent = stats.total;
  document.getElementById('confirmed-guests').textContent = stats.confirmed;
  document.getElementById('pending-guests').textContent = stats.pending;
}

async function handleGeneralFormSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = {
    name: fd.get('name'),
    description: fd.get('description'),
    event_date: fd.get('event_date')
  };

  try {
    const res = await fetch(`/api/admin-events?eventId=${encodeURIComponent(currentEventName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    currentEventName = data.name;
    window.history.replaceState({}, '', `?event=${encodeURIComponent(currentEventName)}`);
    toast('Información del evento guardada ✨');
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
  }
}

// ============================
// TABLA DE INVITADOS
// ============================
function fillGuestsTable(guests) {
  const tbody = document.getElementById('guests-tbody');
  const noGuests = document.getElementById('no-guests');
  const table = document.getElementById('guests-table');

  if (!guests || guests.length === 0) {
    noGuests.style.display = 'block';
    table.style.display = 'none';
    return;
  }

  noGuests.style.display = 'none';
  table.style.display = 'table';
  tbody.innerHTML = '';

  guests.forEach((guest, index) => {
    const row = document.createElement('tr');
    row.draggable = true;
    row.dataset.guestId = guest.guest_id;
    row.dataset.index = index;

    const statusLabels = { 1: 'Confirmado', 2: 'Declinado', 3: 'Pendiente' };
    const statusClasses = { 1: 'status-confirmed', 2: 'status-declined', 3: 'status-pending' };
    const statusText  = statusLabels[guest.status]  || 'Pendiente';
    const statusClass = statusClasses[guest.status] || 'status-pending';

    const avatarSrc = guest.avatar && guest.avatar.startsWith('http')
      ? guest.avatar
      : '/src/default-avatar.png';

    const displayName = guest.nickname
      ? `${guest.name} <span style="color:var(--text-muted);font-size:0.82rem">(${guest.nickname})</span>`
      : guest.name;

    const priorityControls = `
      <div class="priority-controls">
        <button class="priority-btn move-top"   onclick="moveTo(${index},'top')"    title="Al inicio" ${index === 0 ? 'disabled' : ''}>⬆⬆</button>
        <button class="priority-btn move-up"    onclick="moveTo(${index},'up')"     title="Subir"     ${index === 0 ? 'disabled' : ''}>⬆</button>
        <button class="priority-btn move-down"  onclick="moveTo(${index},'down')"   title="Bajar"     ${index === guests.length-1 ? 'disabled' : ''}>⬇</button>
        <button class="priority-btn move-bottom" onclick="moveTo(${index},'bottom')" title="Al final"  ${index === guests.length-1 ? 'disabled' : ''}>⬇⬇</button>
      </div>`;

    row.innerHTML = `
      <td class="priority-col">
        <span class="priority-number">${guest.priority_order || (index+1)}</span>
      </td>
      <td class="drag-col"><span class="drag-handle">⠿</span></td>
      <td class="avatar-cell">
        <img src="${avatarSrc}" alt="${guest.name}" class="guest-avatar"
             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(guest.name)}&background=1e3a8a&color=fff&size=80'">
      </td>
      <td>${displayName}</td>
      <td style="color:var(--text-secondary);font-size:0.85rem">${guest.email || '—'}</td>
      <td style="color:var(--text-secondary);font-size:0.85rem">${guest.phone || '—'}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>${priorityControls}</td>
      <td>
        <div class="action-btns">
          <button class="generate-invitation-btn"
                  onclick="generateInvitation(this, '${guest.name}', '${guest.email || ''}', '${guest.guest_id}')"
                  title="Generar URL de invitación">
            <i class="fas fa-link"></i> Invitación
          </button>
          <button class="change-status-btn"
                  onclick="openStatusModal('${guest.invitation_id}', '${guest.name}')"
                  title="Cambiar estado">
            <i class="fas fa-pen"></i>
          </button>
          <button class="delete-btn"
                  onclick="deleteGuest('${guest.guest_id}')"
                  title="Eliminar invitado">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>`;

    tbody.appendChild(row);
  });

  setupDragAndDrop();
}

// ============================
// AGREGAR INVITADO
// ============================
async function handleGuestFormSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const avatarFile = fd.get('avatar');
  let avatarUrl = null;

  if (avatarFile && avatarFile.size > 0) {
    try {
      const uploadFd = new FormData();
      uploadFd.append('avatar', avatarFile);
      const uploadRes = await fetch('/api/upload-avatar', { method: 'POST', body: uploadFd });
      const uploadResult = await uploadRes.json();
      if (!uploadResult.success) throw new Error(uploadResult.error);
      avatarUrl = uploadResult.url;
    } catch (err) {
      toast(`Error subiendo imagen: ${err.message}`, 'error');
      return;
    }
  }

  const data = {
    name:     fd.get('name').trim(),
    nickname: fd.get('nickname').trim(),
    avatar:   avatarUrl,
    email:    fd.get('email').trim(),
    phone:    fd.get('phone').trim()
  };

  if (!data.name) { toast('El nombre es requerido', 'error'); return; }

  try {
    const res = await fetch(`/api/admin-events?eventId=${encodeURIComponent(currentEventName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    e.target.reset();
    document.getElementById('avatar-preview').style.display = 'none';
    await loadEventData();
    toast(`${data.name} agregado a la aventura 🎉`);
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
  }
}

// ============================
// ELIMINAR INVITADO
// ============================
async function deleteGuest(guestId) {
  if (!confirm('¿Eliminar este invitado del evento?')) return;

  try {
    const res = await fetch(`/api/admin-events?eventId=${encodeURIComponent(currentEventName)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId, eventName: currentEventName })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    await loadEventData();
    toast('Invitado eliminado');
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
  }
}

// ============================
// GENERAR INVITACIÓN (modal)
// ============================
async function generateInvitation(btn, guestName, guestEmail, guestId) {
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  btn.disabled = true;

  try {
    const res = await fetch(`/api/admin-events?eventId=${encodeURIComponent(currentEventName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate_invitation',
        eventName: currentEventName,
        guestName,
        guestEmail
      })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    const invitationUrl = `${window.location.origin}/invites/turns3/turns3.html?invitation=${result.invitationId}`;
    showInvitationModal(guestName, invitationUrl);
  } catch (err) {
    toast(`Error generando invitación: ${err.message}`, 'error');
  } finally {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
}

function showInvitationModal(guestName, url) {
  currentInvitationUrl = url;
  document.getElementById('modal-guest-name').textContent = guestName;
  document.getElementById('modal-url').textContent = url;

  // WhatsApp message
  const waMsg = encodeURIComponent(
    `✨ ¡Hola ${guestName}! 🏰\n\nTe esperamos en la aventura Disney de Alessia 🎂\nAquí está tu invitación personalizada:\n${url}`
  );
  document.getElementById('btn-whatsapp').href = `https://wa.me/?text=${waMsg}`;

  // Reset copy button
  const copyBtn = document.getElementById('btn-copy');
  copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copiar URL';
  copyBtn.classList.remove('copied');

  document.getElementById('invitation-modal').style.display = 'flex';
}

async function copyInvitationUrl() {
  try {
    await navigator.clipboard.writeText(currentInvitationUrl);
    const btn = document.getElementById('btn-copy');
    btn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-copy"></i> Copiar URL';
      btn.classList.remove('copied');
    }, 2500);
  } catch {
    toast('No se pudo copiar — cópialo manualmente', 'error');
  }
}

// ============================
// CAMBIAR ESTADO (modal)
// ============================
function openStatusModal(guestId, guestName) {
  pendingStatusGuestId = guestId;
  document.getElementById('status-modal-guest').textContent = guestName;
  document.getElementById('status-modal').style.display = 'flex';
}

async function setGuestStatus(status) {
  if (!pendingStatusGuestId) return;
  closeModal('status-modal');

  try {
    const res = await fetch(`/api/admin-events?eventId=${encodeURIComponent(currentEventName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'confirm_rsvp',
        invitationId: pendingStatusGuestId,
        statusOverride: status
      })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);

    const labels = { 1: 'confirmado ✅', 2: 'declinado ❌', 3: 'pendiente ⏳' };
    await loadEventData();
    toast(`Estado actualizado a ${labels[status] || status}`);
  } catch (err) {
    toast(`Error: ${err.message}`, 'error');
  } finally {
    pendingStatusGuestId = null;
  }
}

// ============================
// REORDENAMIENTO
// ============================
async function moveTo(fromIndex, direction) {
  if (!eventData?.guests) return;
  const guests = [...eventData.guests];
  const len = guests.length;
  const targets = { top: 0, up: Math.max(0, fromIndex-1), down: Math.min(len-1, fromIndex+1), bottom: len-1 };
  const newIndex = targets[direction];
  if (newIndex === fromIndex) return;

  const [guest] = guests.splice(fromIndex, 1);
  guests.splice(newIndex, 0, guest);
  await saveNewOrder(guests);
}

function setupDragAndDrop() {
  const tbody = document.getElementById('guests-tbody');
  if (!tbody) return;

  let draggedIndex = null;
  const rows = tbody.querySelectorAll('tr');

  rows.forEach((row, index) => {
    row.addEventListener('dragstart', e => {
      draggedIndex = index;
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      rows.forEach(r => r.classList.remove('drag-over'));
    });

    row.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedIndex !== index) {
        rows.forEach(r => r.classList.remove('drag-over'));
        row.classList.add('drag-over');
      }
    });

    row.addEventListener('dragleave', e => {
      if (!row.contains(e.relatedTarget)) row.classList.remove('drag-over');
    });

    row.addEventListener('drop', async e => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) {
        const guests = [...eventData.guests];
        const [moved] = guests.splice(draggedIndex, 1);
        guests.splice(index, 0, moved);
        await saveNewOrder(guests);
      }
      rows.forEach(r => r.classList.remove('drag-over'));
    });
  });
}

async function saveNewOrder(reorderedGuests) {
  try {
    const guestsData = reorderedGuests.map((g, i) => ({ guest_id: g.guest_id, new_priority: i+1 }));
    const res = await fetch(`/api/admin-events?eventId=${encodeURIComponent(currentEventName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reorder_guests', guests: guestsData })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);
    await loadEventData();
    toast('Orden guardado');
  } catch (err) {
    toast(`Error guardando orden: ${err.message}`, 'error');
    await loadEventData();
  }
}

// ============================
// EVENT LISTENERS
// ============================
function setupFormListeners() {
  document.getElementById('general-form').addEventListener('submit', handleGeneralFormSubmit);
  document.getElementById('guest-form').addEventListener('submit', handleGuestFormSubmit);

  const avatarInput = document.getElementById('guest-avatar');
  const preview = document.getElementById('avatar-preview');
  const previewImg = document.getElementById('preview-img');

  if (avatarInput) {
    avatarInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = ev => {
          previewImg.src = ev.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        preview.style.display = 'none';
      }
    });
  }

  // Close modals on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal('invitation-modal');
      closeModal('status-modal');
    }
  });
}
