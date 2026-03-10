/* ===========================
   DISNEY MAGIC JAVASCRIPT - PREMIUM EDITION
   Cumpleaños #3 de Alessia
   =========================== */

// ===========================
// CONFIGURACIÓN GLOBAL
// ===========================
const CONFIG = {
    // Fecha del viaje
    tripDate: new Date('2026-08-31T07:25:00'),
    
    // Configuración de animaciones
    animations: {
        enabled: true,
        duration: 800
    },
    
    // WhatsApp RSVP
    whatsapp: {
        number: '+5215555555555', // Reemplazar con número real
        message: '¡Hola! Me encantaría unirme a la aventura Disney de Alessia 🏰✨ Quiero confirmar mi asistencia al cumpleaños #3.'
    }
};

// ===========================
// UTILIDADES
// ===========================
class Utils {
    static $(selector) {
        return document.querySelector(selector);
    }
    
    static $$(selector) {
        return document.querySelectorAll(selector);
    }
    
    static addClass(element, className) {
        if (element) element.classList.add(className);
    }
    
    static removeClass(element, className) {
        if (element) element.classList.remove(className);
    }
    
    static toggleClass(element, className) {
        if (element) element.classList.toggle(className);
    }
    
    static hasClass(element, className) {
        return element ? element.classList.contains(className) : false;
    }
    
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    static easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
    
    static lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }
}

// ===========================
// LOADING SCREEN
// ===========================
class LoadingScreen {
    constructor() {
        this.loadingScreen = Utils.$('#loading-screen');
        this.progress = Utils.$('.loading-progress');
        this.loadingSteps = [
            { text: 'Preparando el castillo...', duration: 850 },
            { text: 'Invocando la magia Disney...', duration: 850 },
            { text: 'Reuniendo a los personajes...', duration: 850 },
            { text: '¡Listo para la aventura!', duration: 1500 }
        ];
        this.currentStep = 0;
    }
    
    init() {
        this.startLoading();
    }
    
    startLoading() {
        const titleElement = Utils.$('.loading-title');
        let totalDuration = 0;
        
        this.loadingSteps.forEach((step, index) => {
            setTimeout(() => {
                if (titleElement) {
                    titleElement.textContent = step.text;
                }
                this.updateProgress((index + 1) / this.loadingSteps.length);
                
                if (index === this.loadingSteps.length - 1) {
                    setTimeout(() => this.hide(), step.duration);
                }
            }, totalDuration);
            
            totalDuration += step.duration;
        });
    }
    
    updateProgress(percent) {
        if (this.progress) {
            this.progress.style.width = `${percent * 100}%`;
        }
    }
    
    hide() {
        if (this.loadingScreen) {
            Utils.addClass(this.loadingScreen, 'fade-out');
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                document.body.classList.remove('loading');
                this.onLoadingComplete();
            }, 1000);
        }
    }
    
    onLoadingComplete() {
        // Inicializar otros componentes después de la carga
        App.init();
    }
}

// ===========================
// NAVEGACIÓN
// ===========================
class Navigation {
    constructor() {
        this.nav = Utils.$('#main-nav');
        this.links = Utils.$$('.nav-link');
        this.isScrolling = false;
        this.mobileMenuOpen = false;
        
        this.initMobileMenu();
        this.bindEvents();
    }
    
    bindEvents() {
        // Scroll navigation
        window.addEventListener('scroll', Utils.throttle(() => {
            this.handleScroll();
        }, 16));
        
        // Navigation links
        this.links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href');
                this.scrollToSection(target);
                this.setActiveLink(link);
                this.closeMobileMenu(); // Cerrar menú móvil al navegar
            });
        });
    }

    initMobileMenu() {
        // Crear botón de menú móvil si no existe
        let toggleButton = Utils.$('.mobile-menu-toggle');
        if (!toggleButton) {
            toggleButton = document.createElement('button');
            toggleButton.className = 'mobile-menu-toggle';
            toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
            toggleButton.setAttribute('aria-label', 'Toggle Mobile Menu');
            
            // Insertar después del logo
            const navLogo = Utils.$('.nav-logo');
            if (navLogo && navLogo.parentNode) {
                navLogo.parentNode.insertBefore(toggleButton, navLogo.nextSibling);
            }
        }

        // Eventos del menú móvil
        toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMobileMenu();
        });

        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', (e) => {
            const navMenu = Utils.$('.nav-menu');
            const toggleBtn = Utils.$('.mobile-menu-toggle');
            
            if (this.mobileMenuOpen && 
                navMenu && !navMenu.contains(e.target) && 
                toggleBtn && !toggleBtn.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Cerrar menú con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.mobileMenuOpen) {
                this.closeMobileMenu();
            }
        });

        // Cerrar menú en resize a desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 767 && this.mobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        if (this.mobileMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        const navMenu = Utils.$('.nav-menu');
        const toggleButton = Utils.$('.mobile-menu-toggle');
        
        if (navMenu) navMenu.classList.add('active');
        if (toggleButton) {
            toggleButton.classList.add('active');
            const icon = toggleButton.querySelector('i');
            if (icon) icon.className = 'fas fa-times';
        }
        
        this.mobileMenuOpen = true;
        document.body.style.overflow = 'hidden';
    }

    closeMobileMenu() {
        const navMenu = Utils.$('.nav-menu');
        const toggleButton = Utils.$('.mobile-menu-toggle');
        
        if (navMenu) navMenu.classList.remove('active');
        if (toggleButton) {
            toggleButton.classList.remove('active');
            const icon = toggleButton.querySelector('i');
            if (icon) icon.className = 'fas fa-bars';
        }
        
        this.mobileMenuOpen = false;
        document.body.style.overflow = '';
    }
    
    handleScroll() {
        const scrollY = window.scrollY;
        
        // Add scrolled class
        if (scrollY > 50) {
            Utils.addClass(this.nav, 'scrolled');
        } else {
            Utils.removeClass(this.nav, 'scrolled');
        }
        
        // Update active section
        if (!this.isScrolling) {
            this.updateActiveSection();
        }
    }
    
    updateActiveSection() {
        const sections = Utils.$$('section[id]');
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                const activeLink = Utils.$(`a[href="#${sectionId}"]`);
                if (activeLink) {
                    this.setActiveLink(activeLink);
                }
            }
        });
    }
    
    setActiveLink(activeLink) {
        this.links.forEach(link => Utils.removeClass(link, 'active'));
        Utils.addClass(activeLink, 'active');
    }
    
    scrollToSection(target) {
        const section = Utils.$(target);
        if (!section) return;
        
        this.isScrolling = true;
        const targetPosition = section.offsetTop - 80;
        
        this.smoothScrollTo(targetPosition, () => {
            this.isScrolling = false;
        });
    }
    
    smoothScrollTo(targetPosition, callback) {
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = Math.min(Math.abs(distance) * 0.8, 1200);
        let startTime = null;
        
        const animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            const ease = Utils.easeInOutCubic(progress);
            window.scrollTo(0, startPosition + (distance * ease));
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            } else if (callback) {
                callback();
            }
        };
        
        requestAnimationFrame(animation);
    }
}

// ===========================
// COUNTDOWN TIMER
// ===========================
class CountdownTimer {
    constructor() {
        this.targetDate = CONFIG.tripDate;
        this.elements = {
            days: Utils.$('#days'),
            hours: Utils.$('#hours'),
            minutes: Utils.$('#minutes'),
            seconds: Utils.$('#seconds')
        };
        this.isRunning = false;
    }
    
    init() {
        this.start();
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.update();
        this.timer = setInterval(() => this.update(), 1000);
    }
    
    update() {
        const now = new Date().getTime();
        const distance = this.targetDate.getTime() - now;
        
        if (distance < 0) {
            this.handleExpired();
            return;
        }
        
        const timeLeft = {
            days: Math.floor(distance / (1000 * 60 * 60 * 24)),
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000)
        };
        
        this.updateDisplay(timeLeft);
    }
    
    updateDisplay(timeLeft) {
        Object.keys(this.elements).forEach(key => {
            if (this.elements[key]) {
                const newValue = String(timeLeft[key]).padStart(2, '0');
                if (this.elements[key].textContent !== newValue) {
                    this.animateChange(this.elements[key], newValue);
                }
            }
        });
    }
    
    animateChange(element, newValue) {
        const unit = element.closest('.time-unit');
        Utils.addClass(unit, 'updating');
        
        setTimeout(() => {
            element.textContent = newValue;
            Utils.removeClass(unit, 'updating');
        }, 150);
    }
    
    handleExpired() {
        clearInterval(this.timer);
        this.isRunning = false;
        
        // Mostrar mensaje especial
        const countdownContainer = Utils.$('.countdown-container');
        if (countdownContainer) {
            countdownContainer.innerHTML = `
                <div class="countdown-expired">
                    <h3>🎉 ¡LA AVENTURA HA COMENZADO! 🎉</h3>
                    <p>¡Alessia está viviendo su magia Disney en este momento!</p>
                </div>
            `;
        }
    }
    
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.isRunning = false;
        }
    }
}

// ===========================
// EFECTOS DE PARTÍCULAS
// ===========================
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.isRunning = false;
        
        this.createCanvas();
        this.bindEvents();
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'particle-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            opacity: 0.6;
        `;
        
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
    }
    
    bindEvents() {
        window.addEventListener('resize', Utils.debounce(() => {
            this.resize();
        }, 300));
        
        // Crear partículas en hover de elementos especiales
        Utils.$$('.character-card, .adventurer-card, .cta-button').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.createBurst(e.pageX, e.pageY);
            });
        });
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticle(x, y, options = {}) {
        return {
            x: x + (Math.random() - 0.5) * 20,
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            life: 1,
            decay: Math.random() * 0.02 + 0.01,
            size: Math.random() * 4 + 2,
            color: options.color || `hsl(${Math.random() * 60 + 40}, 70%, 60%)`,
            symbol: options.symbol || ['✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 4)]
        };
    }
    
    createBurst(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(x, y));
        }
        
        if (!this.isRunning) {
            this.start();
        }
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.animate();
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Actualizar partículas
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Gravedad
            particle.life -= particle.decay;
            
            if (particle.life <= 0) return false;
            
            // Dibujar partícula
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.font = `${particle.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(particle.symbol, particle.x, particle.y);
            this.ctx.restore();
            
            return true;
        });
        
        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.isRunning = false;
        }
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.isRunning = false;
        }
    }
}

// ===========================
// ANIMACIONES DE SCROLL
// ===========================
class ScrollAnimations {
    constructor() {
        this.observer = null;
        this.elements = [];
        
        this.init();
    }
    
    init() {
        if (!CONFIG.animations.enabled) return;
        
        // Configurar Intersection Observer
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        this.observeElements();
    }
    
    observeElements() {
        // Elementos a animar
        const selectors = [
            '.adventurer-card',
            '.character-card',
            '.timeline-day',
            '.cost-item',
            '.detail-card',
            '.plan-item'
        ];
        
        selectors.forEach(selector => {
            Utils.$$(selector).forEach((element, index) => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';
                element.style.transition = `all ${CONFIG.animations.duration}ms ease`;
                element.style.transitionDelay = `${index * 100}ms`;
                
                this.observer.observe(element);
            });
        });
    }
    
    animateElement(element) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
        
        // Efectos especiales para ciertos elementos
        if (element.classList.contains('birthday-girl')) {
            setTimeout(() => {
                Utils.addClass(element, 'special-glow');
            }, 500);
        }
        
        // Dejar de observar el elemento
        this.observer.unobserve(element);
    }
}

// ===========================
// RSVP FUNCTIONALITY
// ===========================
class RSVPManager {
    constructor() {
        this.confirmButton = Utils.$('.rsvp-button.confirm');
        this.bindEvents();
    }
    
    bindEvents() {
        if (this.confirmButton) {
            this.confirmButton.addEventListener('click', () => {
                this.handleRSVP();
            });
        }
    }
    
    handleRSVP() {
        // Crear mensaje personalizado
        const message = CONFIG.whatsapp.message;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${CONFIG.whatsapp.number}?text=${encodedMessage}`;
        
        // Efecto visual antes de redirigir
        Utils.addClass(this.confirmButton, 'sending');
        this.confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Conectando...</span>';
        
        setTimeout(() => {
            window.open(whatsappUrl, '_blank');
            this.resetButton();
        }, 1500);
    }
    
    resetButton() {
        Utils.removeClass(this.confirmButton, 'sending');
        this.confirmButton.innerHTML = '<i class="fas fa-check-circle"></i><span>¡Sí, me uno a la aventura!</span>';
    }
}

// ===========================
// EFECTOS INTERACTIVOS
// ===========================
class InteractiveEffects {
    constructor() {
        this.bindEvents();
    }
    
    bindEvents() {
        // Efecto de hover en tarjetas
        Utils.$$('.adventurer-card, .character-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.addHoverEffect(card);
            });
            
            card.addEventListener('mouseleave', () => {
                this.removeHoverEffect(card);
            });
        });
        
        // Efecto de click en botones
        Utils.$$('.cta-button, .rsvp-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.createRipple(e);
            });
        });
        
        // Parallax suave en elementos de fondo
        window.addEventListener('scroll', Utils.throttle(() => {
            this.handleParallax();
        }, 16));
    }
    
    addHoverEffect(card) {
        Utils.addClass(card, 'hover-active');
        
        // Crear partículas si está disponible
        if (window.particleSystem) {
            const rect = card.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            window.particleSystem.createBurst(x, y, 5);
        }
    }
    
    removeHoverEffect(card) {
        Utils.removeClass(card, 'hover-active');
    }
    
    createRipple(e) {
        const button = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    handleParallax() {
        const scrollY = window.pageYOffset;
        
        // Elementos con parallax
        Utils.$$('.stars-layer').forEach(layer => {
            const speed = 0.5;
            layer.style.transform = `translateY(${scrollY * speed}px)`;
        });
        
        Utils.$$('.floating-elements').forEach(element => {
            const speed = 0.3;
            element.style.transform = `translateY(${scrollY * speed}px)`;
        });
    }
}

// ===========================
// GESTIÓN DE ESTADO DE RSVP
// ===========================
class RSVPState {
    constructor() {
        this.attendees = [
            { name: 'Alessia', status: 'confirmed', role: 'birthday-girl' },
            { name: 'Marco', status: 'confirmed', role: 'guardian' },
            { name: 'Lilo', status: 'confirmed', role: 'companion' },
            { name: 'Cony', status: 'pending', role: 'explorer' },
            { name: 'Valeria', status: 'pending', role: 'adventurer' },
            { name: 'Ramon', status: 'pending', role: 'knight' },
            { name: 'Diego', status: 'pending', role: 'explorer' },
            { name: 'Dieguito', status: 'pending', role: 'little-adventurer' }
        ];
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        const confirmedCount = this.attendees.filter(a => a.status === 'confirmed').length;
        const totalCount = this.attendees.length;
        
        // Actualizar contadores si existen elementos para ello
        const confirmedCounter = Utils.$('.confirmed-count');
        const totalCounter = Utils.$('.total-count');
        
        if (confirmedCounter) confirmedCounter.textContent = confirmedCount;
        if (totalCounter) totalCounter.textContent = totalCount;
    }
    
    confirmAttendee(name) {
        const attendee = this.attendees.find(a => a.name === name);
        if (attendee) {
            attendee.status = 'confirmed';
            this.updateDisplay();
            this.animateConfirmation(name);
        }
    }
    
    animateConfirmation(name) {
        const card = Utils.$(`.adventurer-card[data-name="${name}"]`);
        if (card) {
            Utils.addClass(card, 'newly-confirmed');
            setTimeout(() => {
                Utils.removeClass(card, 'newly-confirmed');
            }, 2000);
        }
    }
}

// ===========================
// UTILIDADES GLOBALES
// ===========================

// Función para scroll suave a sección
function scrollToSection(sectionId) {
    if (window.navigation) {
        window.navigation.scrollToSection(`#${sectionId}`);
    }
}

// Función para confirmar RSVP
function confirmRSVP() {
    if (window.rsvpManager) {
        window.rsvpManager.handleRSVP();
    }
}

// Función para compartir invitación
function shareInvitation() {
    const shareData = {
        title: '🏰 Cumpleaños #3 de Alessia - Aventura Disney ✨',
        text: '¡Únete a la aventura Disney de Alessia! Celebremos sus 3 años en Disneyland.',
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(() => {
            // Fallback
            copyToClipboard(window.location.href);
        });
    } else {
        copyToClipboard(window.location.href);
    }
}

// Función para copiar al portapapeles
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('¡Enlace copiado al portapapeles! 📋✨');
    }).catch(() => {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('¡Enlace copiado! 📋✨');
    });
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #34d399);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideInRight 0.5s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 4000);
}

// ===========================
// APLICACIÓN PRINCIPAL
// ===========================
class App {
    static async init() {
        console.log('🏰 Disney Magic App iniciando...');
        
        try {
            // Inicializar componentes principales
            window.navigation = new Navigation();
            window.countdownTimer = new CountdownTimer();
            window.particleSystem = new ParticleSystem();
            window.scrollAnimations = new ScrollAnimations();
            window.rsvpManager = new RSVPManager();
            window.interactiveEffects = new InteractiveEffects();
            window.rsvpState = new RSVPState();
            
            // Inicializar timers y animaciones
            window.countdownTimer.init();
            
            // Agregar estilos CSS para animaciones adicionales
            this.addCustomStyles();
            
            // Configurar eventos globales
            this.setupGlobalEvents();
            
            console.log('✨ Disney Magic App iniciado correctamente!');
            
        } catch (error) {
            console.error('❌ Error al inicializar la aplicación:', error);
        }
    }
    
    static addCustomStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .notification {
                font-family: 'Poppins', sans-serif;
                font-weight: 500;
            }
            
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
            }
            
            .notification button {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.3s ease;
            }
            
            .notification button:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .special-glow {
                animation: specialGlow 2s ease-in-out infinite;
            }
            
            @keyframes specialGlow {
                0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.3); }
                50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.6); }
            }
            
            .time-unit.updating {
                transform: scale(1.1);
                background: linear-gradient(135deg, #7c3aed, #ec4899);
            }
            
            .countdown-expired {
                text-align: center;
                padding: 2rem;
                background: linear-gradient(135deg, #10b981, #34d399);
                border-radius: 20px;
                color: white;
                animation: celebrationPulse 2s ease-in-out infinite;
            }
            
            @keyframes celebrationPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            .rsvp-button.sending {
                background: linear-gradient(135deg, #f59e0b, #f97316);
                transform: scale(0.98);
            }
            
            .newly-confirmed {
                animation: confirmationCelebration 2s ease;
                border-color: #10b981 !important;
            }
            
            @keyframes confirmationCelebration {
                0%, 100% { transform: scale(1); }
                25% { transform: scale(1.05); }
                50% { transform: scale(1.1) rotate(2deg); }
                75% { transform: scale(1.05) rotate(-1deg); }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    static setupGlobalEvents() {
        // Manejar errores globales
        window.addEventListener('error', (e) => {
            console.error('Error global capturado:', e.error);
        });
        
        // Prevenir zoom en móviles
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });
        
        // Easter egg: Konami code
        let konamiCode = [];
        const konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
        
        document.addEventListener('keydown', (e) => {
            konamiCode.push(e.keyCode);
            if (konamiCode.length > 10) konamiCode.shift();
            
            if (konamiCode.join(',') === konami.join(',')) {
                this.activateEasterEgg();
                konamiCode = [];
            }
        });
    }
    
    static activateEasterEgg() {
        showNotification('🎉 ¡Código Disney activado! ¡Magia extra desbloqueada! ✨', 'success');
        
        // Crear lluvia de confeti
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                if (window.particleSystem) {
                    window.particleSystem.createBurst(
                        Math.random() * window.innerWidth,
                        -50,
                        3
                    );
                }
            }, i * 100);
        }
        
        // Activar efectos especiales temporalmente
        document.body.style.filter = 'hue-rotate(30deg) saturate(1.2)';
        setTimeout(() => {
            document.body.style.filter = '';
        }, 5000);
    }
}

// ===========================
// INICIALIZACIÓN
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar loading screen
    const loadingScreen = new LoadingScreen();
    loadingScreen.init();
});

// Inicializar app después del loading (llamado desde LoadingScreen)
// App.init() se llamará automáticamente

// Exportar para debugging en desarrollo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App, Utils, CONFIG };
}