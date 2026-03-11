import React from 'react';
import { createRoot } from 'react-dom/client';

// Componente React para el botón RSVP
function RSVPButtonReact() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasResponded, setHasResponded] = React.useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    
    if (isLoading || hasResponded) return;
    
    setIsLoading(true);
    
    // Mostrar estado de carga
    if (typeof showNotification === 'function') {
      showNotification('🔄 Conectando con base de datos...', 'info');
    }
    
    try {
      // Datos para enviar a la API
      const rsvpData = {
        guestName: 'Test User', // Por ahora un usuario de prueba
        email: 'test@adventures.com',
        phone: null,
        status: 1 // 1 = confirmado
      };

      console.log('🎯 Enviando RSVP a la BD:', rsvpData);
      
      // Llamada a la API
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rsvpData)
      });
      
      const result = await response.json();
      console.log('📊 Respuesta de la BD:', result);
      
      if (response.ok && result.success) {
        // Éxito - RSVP guardado en BD
        setHasResponded(true);
        if (typeof showNotification === 'function') {
          showNotification(
            `✅ ${result.message}`, 
            'success'
          );
        } else {
          alert(`✅ ${result.message}`);
        }
      } else {
        // Error del servidor
        throw new Error(result.error || 'Error desconocido');
      }
      
    } catch (error) {
      console.error('❌ Error conectando a BD:', error);
      
      if (typeof showNotification === 'function') {
        showNotification(
          `❌ Error de conexión: ${error.message}`, 
          'error'
        );
      } else {
        alert(`❌ Error de conexión: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
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