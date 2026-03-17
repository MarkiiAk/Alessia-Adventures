/* ===========================
   DISNEY GUESTS MANAGER
   Sistema dinámico de invitados para Alessia
   =========================== */

class GuestsManager {
    constructor() {
        this.eventId = "turns3"; // ID del evento
        this.guests = [];
        this.currentInvitationId = null;
        this.currentGuest = null;
        this.init();
    }
    
    init() {
        // Obtener parámetro de invitación de la URL
        const urlParams = new URLSearchParams(window.location.search);
        this.currentInvitationId = urlParams.get('invitation');
        
        // Cargar invitados dinámicamente
        this.loadGuests();
        
        console.log('🎯 Guests Manager inicializado');
        if (this.currentInvitationId) {
            console.log('🎫 Invitación personal detectada:', this.currentInvitationId);
        }
    }
    
    async loadGuests() {
        try {
            console.log('🔄 Cargando invitados desde API...');
            const response = await fetch(`api/get-guests?eventId=${this.eventId}`);
            const data = await response.json();
            
            console.log('📡 Respuesta de API:', data);
            
            if (data.success && data.data && data.data.guests) {
                this.guests = data.data.guests;
                
                // Identificar al invitado actual si hay invitación
                if (this.currentInvitationId) {
                    this.currentGuest = this.guests.find(guest => guest.id === this.currentInvitationId);
                    console.log('🎯 Buscando invitación:', this.currentInvitationId);
                    console.log('🎭 Invitado encontrado:', this.currentGuest);
                }
                
                // Renderizar invitados dinámicos
                this.renderDynamicGuests();
                
                // Actualizar contador
                this.updateGuestCounter();
                
                // Resaltar invitado actual si aplica
                if (this.currentGuest) {
                    setTimeout(() => {
                        this.highlightCurrentGuest();
                    }, 1500);
                }
                
                console.log('✅ Invitados cargados:', this.guests.length);
                if (this.currentGuest) {
                    console.log('🎭 Invitado actual identificado:', this.currentGuest.name);
                }
            } else {
                console.warn('⚠️ No se pudieron cargar los invitados:', data);
                this.fallbackToStaticGuests();
            }
        } catch (error) {
            console.error('❌ Error cargando invitados:', error);
            this.fallbackToStaticGuests();
        }
    }
    
    renderDynamicGuests() {
        const adventurersGrid = document.querySelector('.adventurers-grid');
        if (!adventurersGrid) return;
        
        // Mantener solo la carta de Alessia (birthday-girl)
        const alessiaCard = adventurersGrid.querySelector('.adventurer-card.birthday-girl');
        adventurersGrid.innerHTML = '';
        if (alessiaCard) {
            adventurersGrid.appendChild(alessiaCard);
        }
        
        // Renderizar invitados dinámicos (excluyendo a Alessia si está en la base)
        this.guests.forEach((guest, index) => {
            // Skip Alessia si está en la base de datos
            if (guest.name.toLowerCase() === 'alessia') return;
            
            const card = this.createGuestCard(guest, index);
            adventurersGrid.appendChild(card);
        });
    }
    
    createGuestCard(guest, index) {
        const card = document.createElement('div');
        const isCurrentGuest = this.currentGuest && this.currentGuest.id === guest.id;
        
        // Determinar clases CSS según estado
        let statusClass = 'pending';
        let statusContent = '<i class="fas fa-clock"></i><span>Pendiente</span>';
        
        if (guest.status === 'CONFIRMED') {
            statusClass = 'confirmed';
            statusContent = '<i class="fas fa-check-circle"></i><span>Confirmado</span>';
        } else if (guest.status === 'DECLINED') {
            statusClass = 'declined';
            statusContent = '<i class="fas fa-times-circle"></i><span>Declinado</span>';
        }
        
        // Agregar clase especial si es el invitado actual
        const specialClass = isCurrentGuest ? ' current-guest' : '';
        
        card.className = `adventurer-card ${statusClass}${specialClass}`;
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 800ms ease ${(index + 1) * 100}ms`;
        
        // Avatar: usar foto si existe, o icono por defecto
        const avatarContent = guest.avatar && guest.avatar !== '/src/default-avatar.png' 
            ? `<img src="${guest.avatar}" alt="${guest.name}" class="avatar-image">`
            : `<i class="fas fa-user"></i>`;
        
        card.innerHTML = `
            ${statusClass === 'confirmed' ? `<div class="confirmed-seal">${statusContent}</div>` : 
              statusClass === 'declined' ? `<div class="declined-seal">${statusContent}</div>` :
              `<div class="pending-indicator">${statusContent}</div>`}
            
            <div class="adventurer-avatar">
                ${avatarContent}
            </div>
            
            <h3 class="adventurer-name">${guest.name}</h3>
            <p class="adventurer-role">${this.getGuestRoleIcon(guest)} ${guest.role || 'Aventurero Mágico'}</p>
            
            ${isCurrentGuest ? '<div class="current-guest-badge">👑 ¡Eres Tú!</div>' : ''}
        `;
        
        // Animar entrada después de un momento
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
        
        return card;
    }
    
    getGuestRoleIcon(guest) {
        // Asignar iconos según el rol
        const roleIcons = {
            'papá aventurero': '👨‍💼',
            'papa aventurero': '👨‍💼',
            'mamá mágica': '👩‍💖',
            'mama magica': '👩‍💖',
            'abuelo sabio': '👴',
            'abuelo legendario': '🏔️',
            'tía cool': '📱',
            'tia cool': '📱',
            'tío fav': '📞',
            'tio fav': '📞',
            'primo mayor': '🎓'
        };
        
        const roleKey = (guest.role || '').toLowerCase();
        return roleIcons[roleKey] || '⭐';
    }
    
    updateGuestCounter() {
        const subtitleElement = document.querySelector('#guests-counter');
        if (subtitleElement) {
            const totalGuests = this.guests.length + 1; // +1 por Alessia
            subtitleElement.textContent = `${totalGuests} valientes exploradores listos para la magia`;
        }
    }
    
    fallbackToStaticGuests() {
        console.log('🔄 Usando invitados estáticos como fallback');
        // En caso de error, mantener los invitados estáticos existentes
        // Contar los estáticos y actualizar
        const staticCards = document.querySelectorAll('.adventurer-card');
        const subtitleElement = document.querySelector('#guests-counter');
        if (subtitleElement && staticCards.length > 0) {
            subtitleElement.textContent = `${staticCards.length} valientes exploradores listos para la magia`;
        }
    }
    
    // Método para resaltar al invitado actual si viene con URL personalizada
    highlightCurrentGuest() {
        if (!this.currentGuest) return;
        
        const currentGuestCard = document.querySelector('.adventurer-card.current-guest');
        if (currentGuestCard) {
            // Agregar efectos especiales
            setTimeout(() => {
                currentGuestCard.classList.add('special-highlight');
            }, 1000);
        }
    }
}

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM LOADED - Inicializando GuestsManager...');
    // Esperar un poco para que otros scripts se inicialicen
    setTimeout(() => {
        console.log('🚀 CREANDO GUESTS MANAGER...');
        window.guestsManager = new GuestsManager();
    }, 500);
});

// También intentar inicializar si window ya está cargado
if (document.readyState === 'loading') {
    console.log('📄 Document still loading...');
} else {
    console.log('📄 Document already loaded, initializing immediately...');
    setTimeout(() => {
        console.log('🚀 BACKUP INIT - CREANDO GUESTS MANAGER...');
        if (!window.guestsManager) {
            window.guestsManager = new GuestsManager();
        }
    }, 100);
}

// Exportar para debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuestsManager;
}