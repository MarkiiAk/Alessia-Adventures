async function loadEvents() {
    try {
        console.log('🎯 Fetching events...');
        
        const response = await fetch('/api/events');
        const data = await response.json();
        
        console.log('✅ API response:', data);
        
        // Ocultar loading
        document.getElementById('loading').style.display = 'none';
        
        if (!data.success) {
            throw new Error(data.error || 'Error desconocido');
        }
        
        if (data.events.length === 0) {
            document.getElementById('no-events').style.display = 'block';
            return;
        }
        
        // Mostrar tabla y llenar con datos
        const table = document.getElementById('events-table');
        const tbody = document.getElementById('events-tbody');
        
        tbody.innerHTML = '';
        
        data.events.forEach(event => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${event.name}</td>
                <td>
                    <button type="button" class="invitation-btn" data-route="${event.invitation_route || ''}" style="margin-right: 10px;">Ir a la invitación</button>
                    <button type="button" class="admin-btn">Administración del evento</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Agregar event listeners para los botones
        addButtonEventListeners();
        
        table.style.display = 'table';
        
        console.log('✅ Events displayed:', data.events.length);
        
    } catch (error) {
        console.error('❌ Error loading events:', error);
        
        document.getElementById('loading').style.display = 'none';
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = `Error: ${error.message}`;
        errorDiv.style.display = 'block';
    }
}

function addButtonEventListeners() {
    // Event listener para botones de invitación
    const invitationButtons = document.querySelectorAll('.invitation-btn');
    invitationButtons.forEach(button => {
        button.addEventListener('click', function() {
            const route = this.getAttribute('data-route');
            if (route && route.trim() !== '') {
                console.log('🎯 Redirecting to:', route);
                window.location.href = route;
            } else {
                alert('No hay ruta de invitación disponible para este evento');
            }
        });
    });

    // Event listener para botones de administración
    const adminButtons = document.querySelectorAll('.admin-btn');
    adminButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            // Obtener el nombre del evento desde la fila de la tabla
            const row = this.closest('tr');
            const eventName = row.querySelector('td:first-child').textContent;
            
            console.log('🎯 Redirecting to admin for event:', eventName);
            window.location.href = `admin-event.html?event=${encodeURIComponent(eventName)}`;
        });
    });
}

// Cargar eventos cuando la página esté lista
document.addEventListener('DOMContentLoaded', loadEvents);
