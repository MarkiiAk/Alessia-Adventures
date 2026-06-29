document.addEventListener('DOMContentLoaded', async () => {
  const loading  = document.getElementById('loading');
  const errorEl  = document.getElementById('error');
  const errorMsg = document.getElementById('error-msg');
  const noEvents = document.getElementById('no-events');
  const grid     = document.getElementById('events-grid');

  try {
    const res  = await fetch('/api/events');
    const data = await res.json();

    loading.style.display = 'none';

    if (!data.success) throw new Error(data.error || 'Error cargando eventos');

    if (!data.events || data.events.length === 0) {
      noEvents.style.display = 'block';
      return;
    }

    data.events.forEach(event => {
      const card = document.createElement('div');
      card.className = 'event-card';

      const dateStr = event.event_date
        ? new Date(event.event_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Fecha por confirmar';

      card.innerHTML = `
        <div class="event-info">
          <div class="event-icon">🎂</div>
          <div class="event-name">${event.name}</div>
          <div class="event-meta"><i class="fas fa-calendar-star" style="margin-right:5px;color:#fbbf24"></i>${dateStr}</div>
        </div>
        <div class="event-actions">
          ${event.invitation_route ? `
            <button class="btn btn-invitation" onclick="goToInvitation('${encodeURIComponent(event.invitation_route)}')">
              <i class="fas fa-envelope-open-text"></i> Invitación
            </button>` : ''}
          <button class="btn btn-admin" onclick="goToAdmin('${encodeURIComponent(event.name)}')">
            <i class="fas fa-sliders"></i> Admin
          </button>
        </div>`;

      grid.appendChild(card);
    });

    grid.style.display = 'grid';

  } catch (err) {
    loading.style.display = 'none';
    errorMsg.textContent = err.message;
    errorEl.style.display = 'block';
  }
});

function goToInvitation(encodedRoute) {
  window.location.href = decodeURIComponent(encodedRoute);
}

function goToAdmin(encodedName) {
  window.location.href = `admin-event.html?event=${encodedName}`;
}
