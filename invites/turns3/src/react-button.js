import React from 'react';
import { createRoot } from 'react-dom/client';

// Componente React para el botón RSVP
function RSVPButtonReact() {
  const handleClick = (e) => {
    e.preventDefault();
    
    // Crear un mensaje más bonito usando el sistema de notificaciones existente
    if (typeof showNotification === 'function') {
      showNotification('¡Funcionó con React! 🚀✨', 'success');
    } else {
      // Fallback si no existe la función
      alert('¡Funcionó con React! 🚀');
    }
  };

  return React.createElement(
    'button',
    {
      className: 'rsvp-button confirm',
      onClick: handleClick
    },
    React.createElement('i', { className: 'fas fa-check-circle' }),
    React.createElement('span', null, '¡Sí, me uno a la aventura!')
  );
}

// Cuando carga la página, reemplazar el botón original
document.addEventListener('DOMContentLoaded', () => {
  const originalButton = document.querySelector('.rsvp-button.confirm');
  
  if (originalButton) {
    // Crear contenedor React
    const reactContainer = document.createElement('div');
    reactContainer.style.display = 'contents'; // Para mantener el diseño
    
    // Insertar el contenedor antes del botón original
    originalButton.parentNode.insertBefore(reactContainer, originalButton);
    
    // Ocultar el botón original
    originalButton.style.display = 'none';
    
    // Montar el componente React con la nueva API
    const root = createRoot(reactContainer);
    root.render(React.createElement(RSVPButtonReact));
    
    console.log('✅ Botón RSVP reemplazado con React');
  } else {
    console.warn('⚠️ No se encontró el botón RSVP original');
  }
});