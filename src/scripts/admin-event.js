// Variables globales
let currentEventName = '';
let eventData = null;

// Inicializar la página cuando esté lista
document.addEventListener('DOMContentLoaded', function() {
    // Obtener el nombre del evento de la URL
    const urlParams = new URLSearchParams(window.location.search);
    currentEventName = urlParams.get('event');
    
    if (!currentEventName) {
        showError('No se especificó el evento a administrar');
        return;
    }
    
    // Cargar datos del evento
    loadEventData();
    
    // Configurar event listeners
    setupEventListeners();
});

// Cargar datos completos del evento
async function loadEventData() {
    try {
        console.log('🎯 Loading event data for:', currentEventName);
        showLoading(true);
        
        const response = await fetch(`/api/admin-events?eventId=${encodeURIComponent(currentEventName)}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Error desconocido');
        }
        
        eventData = data;
        
        // Llenar formulario de información general
        fillGeneralForm(data.event);
        
        // Actualizar estadísticas
        updateStats(data.stats);
        
        // Llenar tabla de invitados
        fillGuestsTable(data.guests);
        
        showLoading(false);
        document.getElementById('admin-content').style.display = 'block';
        
        console.log('✅ Event data loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading event data:', error);
        showError(`Error cargando datos del evento: ${error.message}`);
        showLoading(false);
    }
}

// Mostrar/ocultar loading
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// Mostrar error
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Llenar formulario de información general
function fillGeneralForm(event) {
    document.getElementById('event-name').value = event.name || '';
    document.getElementById('event-description').value = event.description || '';
    
    // Formatear fecha para input datetime-local
    if (event.event_date) {
        const date = new Date(event.event_date);
        const formattedDate = date.getFullYear() + '-' + 
                            String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                            String(date.getDate()).padStart(2, '0') + 'T' + 
                            String(date.getHours()).padStart(2, '0') + ':' + 
                            String(date.getMinutes()).padStart(2, '0');
        document.getElementById('event-date').value = formattedDate;
    }
}

// Actualizar estadísticas
function updateStats(stats) {
    document.getElementById('total-guests').textContent = stats.total;
    document.getElementById('confirmed-guests').textContent = stats.confirmed;
    document.getElementById('pending-guests').textContent = stats.pending;
}

// Llenar tabla de invitados
function fillGuestsTable(guests) {
    const tbody = document.getElementById('guests-tbody');
    const noGuests = document.getElementById('no-guests');
    const table = document.getElementById('guests-table');
    
    if (guests.length === 0) {
        noGuests.style.display = 'block';
        table.style.display = 'none';
        return;
    }
    
    noGuests.style.display = 'none';
    table.style.display = 'table';
    
    tbody.innerHTML = '';
    
    guests.forEach(guest => {
        const row = document.createElement('tr');
        
        // Determinar clase de estado
        let statusText, statusClass;
        switch (guest.status) {
            case 1:
                statusText = 'Confirmado';
                statusClass = 'status-confirmed';
                break;
            case 2:
                statusText = 'Declinado';
                statusClass = 'status-declined';
                break;
            case 3:
            default:
                statusText = 'Pendiente';
                statusClass = 'status-pending';
                break;
        }
        
        // Crear celda de avatar
        const avatarSrc = guest.avatar && guest.avatar.startsWith('http') ? 
            guest.avatar : // URL completa de Dropbox/externa
            (guest.avatar ? guest.avatar : '/src/default-avatar.svg'); // URL local relativa o fallback
        const displayName = guest.nickname ? `${guest.name} (${guest.nickname})` : guest.name;
        
        row.innerHTML = `
            <td class="avatar-cell">
                <img src="${avatarSrc}" alt="Avatar de ${guest.name}" class="guest-avatar" onerror="this.src='/src/default-avatar.png'">
            </td>
            <td>${displayName}</td>
            <td>${guest.email || '-'}</td>
            <td>${guest.phone || '-'}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="generate-invitation-btn" onclick="generateInvitation('${guest.name}', '${guest.email}')" title="Generar invitación personalizada">
                    <i class="fas fa-link">Generar Invitacion</i>
                </button>
                <button class="delete-btn" onclick="deleteGuest(${guest.guest_id})" title="Eliminar invitado">
                    <i class="fas fa-trash">Eliminar</i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Formulario de información general
    document.getElementById('general-form').addEventListener('submit', handleGeneralFormSubmit);
    
    // Formulario de agregar invitado
    document.getElementById('guest-form').addEventListener('submit', handleGuestFormSubmit);
    
    // Vista previa de avatar
    const avatarInput = document.getElementById('guest-avatar');
    const avatarPreview = document.getElementById('avatar-preview');
    const previewImg = document.getElementById('preview-img');
    
    if (avatarInput && avatarPreview && previewImg) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    avatarPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                avatarPreview.style.display = 'none';
            }
        });
    }
}

// Manejar envío del formulario general
async function handleGeneralFormSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            description: formData.get('description'),
            event_date: formData.get('event_date')
        };
        
        console.log('💾 Updating event info:', data);
        
        const response = await fetch(`/api/admin-events?eventId=${encodeURIComponent(currentEventName)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error actualizando evento');
        }
        
        // Actualizar nombre actual si cambió
        currentEventName = data.name;
        
        // Actualizar URL sin recargar página
        const newUrl = window.location.pathname + '?event=' + encodeURIComponent(currentEventName);
        window.history.replaceState({}, '', newUrl);
        
        showSuccessMessage('Información del evento actualizada exitosamente');
        
        console.log('✅ Event info updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating event info:', error);
        alert(`Error: ${error.message}`);
    }
}

// Manejar envío del formulario de invitado
async function handleGuestFormSubmit(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const avatarFile = formData.get('avatar');
        
        let avatarUrl = null;
        
        // Si hay un archivo de avatar, subirlo primero
        if (avatarFile && avatarFile.size > 0) {
            try {
                const uploadFormData = new FormData();
                uploadFormData.append('avatar', avatarFile);
                
                const uploadResponse = await fetch('/api/upload-avatar', {
                    method: 'POST',
                    body: uploadFormData
                });
                
                const uploadResult = await uploadResponse.json();
                
                if (uploadResult.success) {
                    avatarUrl = uploadResult.url; // Usar la URL directa de Dropbox
                } else {
                    throw new Error(uploadResult.error);
                }
            } catch (error) {
                console.error('Error subiendo avatar:', error);
                alert('Error subiendo la imagen del avatar: ' + error.message);
                return;
            }
        }
        
        const data = {
            name: formData.get('name').trim(),
            nickname: formData.get('nickname').trim(),
            avatar: avatarUrl,
            email: formData.get('email').trim(),
            phone: formData.get('phone').trim()
        };
        
        if (!data.name) {
            alert('El nombre del invitado es requerido');
            return;
        }
        
        console.log('👤 Adding guest:', data);
        
        const response = await fetch(`/api/admin-events?eventId=${encodeURIComponent(currentEventName)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error agregando invitado');
        }
        
        // Limpiar formulario
        e.target.reset();
        
        // Limpiar vista previa de avatar
        const avatarPreview = document.getElementById('avatar-preview');
        if (avatarPreview) {
            avatarPreview.style.display = 'none';
        }
        
        // Recargar datos
        await loadEventData();
        
        showSuccessMessage('Invitado agregado exitosamente');
        
        console.log('✅ Guest added successfully');
        
    } catch (error) {
        console.error('❌ Error adding guest:', error);
        alert(`Error: ${error.message}`);
    }
}

// Eliminar invitado
async function deleteGuest(guestId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este invitado del evento?')) {
        return;
    }
    
    try {
        console.log('🗑️ Deleting guest:', guestId);
        
        const response = await fetch(`/api/admin-events?eventId=${encodeURIComponent(currentEventName)}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guestId: guestId,
                eventName: currentEventName
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error eliminando invitado');
        }
        
        // Recargar datos
        await loadEventData();
        
        showSuccessMessage('Invitado eliminado exitosamente');
        
        console.log('✅ Guest deleted successfully');
        
    } catch (error) {
        console.error('❌ Error deleting guest:', error);
        alert(`Error: ${error.message}`);
    }
}

// Generar invitación personalizada
async function generateInvitation(guestName, guestEmail) {
    try {
        console.log('🔗 Generating invitation for:', guestName);
        
        // Mostrar indicador de carga en el botón
        const button = event.target.closest('button');
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        button.disabled = true;
        
        const response = await fetch(`/api/admin-events?eventId=${encodeURIComponent(currentEventName)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'generate_invitation',
                eventName: currentEventName,
                guestName: guestName,
                guestEmail: guestEmail
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error generando invitación');
        }
        
        // Crear URL personalizada
        const baseUrl = window.location.origin;
        const invitationUrl = `${baseUrl}/invites/turns3/turns3.html?invitation=${result.invitationId}`;
        
        // Copiar al portapapeles
        await navigator.clipboard.writeText(invitationUrl);
        
        // Restaurar botón
        button.innerHTML = originalHTML;
        button.disabled = false;
        
        showSuccessMessage(`✅ Invitación generada y copiada al portapapeles!\n${invitationUrl}`);
        
        console.log('✅ Invitation generated successfully:', invitationUrl);
        
    } catch (error) {
        console.error('❌ Error generating invitation:', error);
        
        // Restaurar botón en caso de error
        if (button) {
            button.innerHTML = originalHTML;
            button.disabled = false;
        }
        
        alert(`Error generando invitación: ${error.message}`);
    }
}

// Mostrar mensaje de éxito temporal
function showSuccessMessage(message) {
    // Crear elemento de mensaje
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #d4edda;
        color: #155724;
        padding: 15px 20px;
        border-radius: 5px;
        border: 1px solid #c3e6cb;
        z-index: 1000;
        animation: slideIn 0.3s ease-in-out;
    `;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-in-out';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 3000);
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);