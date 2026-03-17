import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log(`🎯 Admin API - ${req.method} request:`, req.url);
    
    // Extraer eventId de la query string
    const { eventId } = req.query;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere eventId en la query string'
      });
    }

    switch (req.method) {
      case 'GET':
        return await getEventData(res, eventId);
      
      case 'PUT':
        return await updateEvent(res, eventId, req.body);
      
      case 'POST':
        // Manejar generación de invitaciones
        if (req.body.action === 'generate_invitation') {
          return await generateInvitation(res, req.body);
        }
        return await addGuest(res, eventId, req.body);
      
      case 'DELETE':
        return await deleteGuest(res, req.body);
        
      default:
        return res.status(405).json({ 
          success: false, 
          error: 'Method not allowed' 
        });
    }

  } catch (error) {
    console.error('❌ Admin API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    await prisma.$disconnect();
  }
}

// GET: Obtener datos completos del evento
async function getEventData(res, eventId) {
  try {
    console.log('📋 Getting event data for:', eventId);
    
    // Obtener información del evento
    const event = await prisma.events.findFirst({
      where: { name: eventId }
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    // Obtener invitados del evento con información completa
    const invitations = await prisma.invitations.findMany({
      where: { event_id: event.id },
      include: {
        guests: true
      },
      orderBy: {
        guests: {
          name: 'asc'
        }
      }
    });

    // Formatear datos para la respuesta
    const guests = invitations.map(inv => ({
      guest_id: inv.guests.id,
      name: inv.guests.name,
      email: inv.guests.email,
      phone: inv.guests.phone,
      status: inv.status,
      responded_at: inv.responded_at,
      invited_at: inv.created_at
    }));

    // Calcular estadísticas
    const totalGuests = guests.length;
    const confirmedGuests = guests.filter(g => g.status === 1).length;
    const pendingGuests = guests.filter(g => g.status === 3).length;
    const declinedGuests = guests.filter(g => g.status === 2).length;

    console.log('✅ Event data retrieved successfully');

    res.status(200).json({
      success: true,
      event: event,
      guests: guests,
      stats: {
        total: totalGuests,
        confirmed: confirmedGuests,
        pending: pendingGuests,
        declined: declinedGuests
      }
    });

  } catch (error) {
    console.error('❌ Error getting event data:', error);
    throw error;
  }
}

// PUT: Actualizar información general del evento
async function updateEvent(res, eventId, data) {
  try {
    console.log('💾 Updating event:', eventId, data);
    
    const { name, description, event_date } = data;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del evento es requerido'
      });
    }

    // Convertir fecha si existe
    let eventDate = null;
    if (event_date) {
      eventDate = new Date(event_date);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Fecha del evento inválida'
        });
      }
    }

    const result = await prisma.events.update({
      where: { name: eventId },
      data: {
        name: name,
        description: description || null,
        event_date: eventDate
      }
    });

    console.log('✅ Event updated successfully');

    res.status(200).json({
      success: true,
      message: 'Evento actualizado exitosamente',
      event: result
    });

  } catch (error) {
    console.error('❌ Error updating event:', error);
    throw error;
  }
}

// POST: Agregar nuevo invitado al evento
async function addGuest(res, eventId, data) {
  try {
    console.log('👤 Adding guest to event:', eventId, data);
    
    const { name, email, phone } = data;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El nombre del invitado es requerido'
      });
    }

    // Obtener el ID del evento
    const event = await prisma.events.findFirst({
      where: { name: eventId }
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    // Verificar si el invitado ya existe con este email
    let existingGuest = null;
    if (email) {
      existingGuest = await prisma.guests.findFirst({
        where: { email: email }
      });
    }

    let guestId;
    
    if (existingGuest) {
      // Verificar si ya está invitado a este evento
      const existingInvitation = await prisma.invitations.findFirst({
        where: { 
          guest_id: existingGuest.id,
          event_id: event.id
        }
      });
      
      if (existingInvitation) {
        return res.status(400).json({
          success: false,
          error: 'Este invitado ya está registrado para el evento'
        });
      }
      
      guestId = existingGuest.id;
    } else {
      // Crear nuevo invitado
      const newGuest = await prisma.guests.create({
        data: {
          name: name.trim(),
          email: email || null,
          phone: phone || null
        }
      });
      guestId = newGuest.id;
    }

    // Crear la invitación
    await prisma.invitations.create({
      data: {
        guest_id: guestId,
        event_id: event.id,
        status: 3
      }
    });

    console.log('✅ Guest added successfully');

    res.status(201).json({
      success: true,
      message: 'Invitado agregado exitosamente',
      guest_id: guestId
    });

  } catch (error) {
    console.error('❌ Error adding guest:', error);
    throw error;
  }
}

// DELETE: Eliminar invitado del evento
async function deleteGuest(res, data) {
  try {
    console.log('🗑️ Deleting guest:', data);
    
    const { guestId, eventName } = data;
    
    if (!guestId || !eventName) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren guestId y eventName'
      });
    }

    // Obtener el ID del evento
    const event = await prisma.events.findFirst({
      where: { name: eventName }
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    // Eliminar la invitación
    const result = await prisma.invitations.deleteMany({
      where: { 
        guest_id: parseInt(guestId),
        event_id: event.id
      }
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invitación no encontrada'
      });
    }

    console.log('✅ Guest removed successfully');

    res.status(200).json({
      success: true,
      message: 'Invitado eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error deleting guest:', error);
    throw error;
  }
}

// Generar invitación personalizada
async function generateInvitation(res, data) {
  try {
    const { eventName, guestName, guestEmail } = data;
    
    console.log('🔗 Generating invitation for guest:', guestName, 'in event:', eventName);
    
    // Buscar el evento
    const event = await prisma.events.findFirst({
      where: { name: eventName }
    });
    
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: 'Evento no encontrado' 
      });
    }
    
    // Buscar el invitado
    const guest = await prisma.guests.findFirst({
      where: { name: guestName }
    });
    
    if (!guest) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invitado no encontrado' 
      });
    }
    
    // Verificar si ya existe una invitación para este invitado en este evento
    const existingInvitation = await prisma.invitations.findFirst({
      where: { 
        guest_id: guest.id,
        event_id: event.id
      }
    });
    
    let invitationId;
    
    if (existingInvitation) {
      invitationId = existingInvitation.id;
      console.log('✅ Using existing invitation:', invitationId);
    } else {
      // Crear nueva invitación
      const newInvitation = await prisma.invitations.create({
        data: {
          guest_id: guest.id,
          event_id: event.id,
          status: 3,
          sent_at: new Date()
        }
      });
      
      invitationId = newInvitation.id;
      console.log('✅ Created new invitation:', invitationId);
    }
    
    return res.json({ 
      success: true, 
      invitationId: invitationId,
      message: 'Invitación generada exitosamente' 
    });
    
  } catch (error) {
    console.error('❌ Error generating invitation:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor generando invitación' 
    });
  }
}
