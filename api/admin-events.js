import { neon } from '@neondatabase/serverless';

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
    
    // Conectar usando Neon serverless driver
    const sql = neon(process.env.DATABASE_URL);
    
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
        // Manejar acciones especiales para invitaciones
        if (req.query.action === 'get_invitation') {
          return await getInvitationData(sql, res, req.query);
        }
        return await getEventData(sql, res, eventId);
      
      case 'PUT':
        return await updateEvent(sql, res, eventId, req.body);
      
      case 'POST':
        // Manejar generación de invitaciones
        if (req.body.action === 'generate_invitation') {
          return await generateInvitation(sql, res, req.body);
        }
        // Manejar confirmación de RSVP
        if (req.body.action === 'confirm_rsvp') {
          return await confirmRSVPFromInvitation(sql, res, req.body, eventId);
        }
        return await addGuest(sql, res, eventId, req.body);
      
      case 'DELETE':
        return await deleteGuest(sql, res, req.body);
        
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
  }
}

// GET: Obtener datos completos del evento
async function getEventData(sql, res, eventId) {
  try {
    console.log('📋 Getting event data for:', eventId);
    
    // Obtener información del evento
    const event = await sql`
      SELECT id, name, description, event_date, invitation_route, created_at 
      FROM events 
      WHERE name = ${eventId}
    `;
    
    if (event.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    // Obtener invitados del evento con información completa
    const guests = await sql`
      SELECT 
        g.id as guest_id,
        g.name,
        g.email,
        g.phone,
        i.status,
        i.responded_at,
        i.created_at as invited_at
      FROM guests g
      INNER JOIN invitations i ON g.id = i.guest_id
      INNER JOIN events e ON i.event_id = e.id
      WHERE e.name = ${eventId}
      ORDER BY g.name ASC
    `;

    // Calcular estadísticas
    const totalGuests = guests.length;
    const confirmedGuests = guests.filter(g => g.status === 1).length;
    const pendingGuests = guests.filter(g => g.status === 3).length;
    const declinedGuests = guests.filter(g => g.status === 2).length;

    console.log('✅ Event data retrieved successfully');

    res.status(200).json({
      success: true,
      event: event[0],
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
async function updateEvent(sql, res, eventId, data) {
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

    const result = await sql`
      UPDATE events 
      SET 
        name = ${name},
        description = ${description || null},
        event_date = ${eventDate}
      WHERE name = ${eventId}
      RETURNING id, name, description, event_date
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    console.log('✅ Event updated successfully');

    res.status(200).json({
      success: true,
      message: 'Evento actualizado exitosamente',
      event: result[0]
    });

  } catch (error) {
    console.error('❌ Error updating event:', error);
    throw error;
  }
}

// POST: Agregar nuevo invitado al evento
async function addGuest(sql, res, eventId, data) {
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
    const event = await sql`
      SELECT id FROM events WHERE name = ${eventId}
    `;
    
    if (event.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    const eventDbId = event[0].id;

    // Verificar si el invitado ya existe con este email o teléfono
    let existingGuest = null;
    if (email) {
      const guestByEmail = await sql`
        SELECT id FROM guests WHERE email = ${email}
      `;
      existingGuest = guestByEmail[0];
    }

    let guestId;
    
    if (existingGuest) {
      // Verificar si ya está invitado a este evento
      const existingInvitation = await sql`
        SELECT id FROM invitations 
        WHERE guest_id = ${existingGuest.id} AND event_id = ${eventDbId}
      `;
      
      if (existingInvitation.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Este invitado ya está registrado para el evento'
        });
      }
      
      guestId = existingGuest.id;
    } else {
      // Crear nuevo invitado
      const newGuest = await sql`
        INSERT INTO guests (name, email, phone)
        VALUES (${name.trim()}, ${email || null}, ${phone || null})
        RETURNING id
      `;
      guestId = newGuest[0].id;
    }

    // Crear la invitación
    await sql`
      INSERT INTO invitations (guest_id, event_id, status)
      VALUES (${guestId}, ${eventDbId}, 3)
    `;

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
async function deleteGuest(sql, res, data) {
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
    const event = await sql`
      SELECT id FROM events WHERE name = ${eventName}
    `;
    
    if (event.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    // Eliminar la invitación
    const result = await sql`
      DELETE FROM invitations 
      WHERE guest_id = ${guestId} AND event_id = ${event[0].id}
      RETURNING id
    `;

    if (result.length === 0) {
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
async function generateInvitation(sql, res, data) {
  try {
    const { eventName, guestName, guestEmail } = data;
    
    console.log('🔗 Generating invitation for guest:', guestName, 'in event:', eventName);
    
    // Buscar el evento
    const event = await sql`
      SELECT id FROM events WHERE name = ${eventName}
    `;
    
    if (event.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Evento no encontrado' 
      });
    }
    
    const eventId = event[0].id;
    
    // Buscar el invitado
    const guest = await sql`
      SELECT id FROM guests WHERE name = ${guestName}
    `;
    
    if (guest.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invitado no encontrado' 
      });
    }
    
    const guestId = guest[0].id;
    
    // Verificar si ya existe una invitación para este invitado en este evento
    const existingInvitations = await sql`
      SELECT id FROM invitations 
      WHERE guest_id = ${guestId} AND event_id = ${eventId}
    `;
    
    let invitationId;
    
    if (existingInvitations.length > 0) {
      // Ya existe una invitación, usar la existente
      invitationId = existingInvitations[0].id;
      console.log('✅ Using existing invitation:', invitationId);
    } else {
      // Esto no debería ocurrir si el invitado está en la lista, pero por seguridad
      const newInvitation = await sql`
        INSERT INTO invitations (guest_id, event_id, status, sent_at)
        VALUES (${guestId}, ${eventId}, 3, NOW())
        RETURNING id
      `;
      
      invitationId = newInvitation[0].id;
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

// Obtener datos de invitación personalizada
async function getInvitationData(sql, res, query) {
  try {
    const { invitationId, eventId } = query;
    
    console.log('🎯 Getting invitation data for ID:', invitationId, 'in event:', eventId);
    
    if (!invitationId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere invitationId'
      });
    }

    // Obtener datos del invitado y la invitación
    const invitation = await sql`
      SELECT 
        i.id as invitation_id,
        i.status,
        i.responded_at,
        g.id as guest_id,
        g.name,
        g.email,
        g.phone,
        e.name as event_name,
        e.description as event_description,
        e.event_date
      FROM invitations i
      INNER JOIN guests g ON i.guest_id = g.id
      INNER JOIN events e ON i.event_id = e.id
      WHERE i.id = ${invitationId} AND e.name = ${eventId}
    `;

    if (invitation.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invitación no encontrada'
      });
    }

    const invitationData = invitation[0];

    console.log('✅ Invitation data retrieved for:', invitationData.name);

    res.status(200).json({
      success: true,
      guest: {
        id: invitationData.guest_id,
        name: invitationData.name,
        email: invitationData.email,
        phone: invitationData.phone,
        status: invitationData.status,
        responded_at: invitationData.responded_at
      },
      event: {
        name: invitationData.event_name,
        description: invitationData.event_description,
        event_date: invitationData.event_date
      },
      invitation_id: invitationData.invitation_id
    });

  } catch (error) {
    console.error('❌ Error getting invitation data:', error);
    throw error;
  }
}

// Confirmar RSVP desde invitación personalizada
async function confirmRSVPFromInvitation(sql, res, data, eventId) {
  try {
    const { invitationId } = data;
    
    console.log('✅ Confirming RSVP for invitation ID:', invitationId);
    
    if (!invitationId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere invitationId'
      });
    }

    // Verificar que la invitación existe y pertenece al evento
    const invitation = await sql`
      SELECT i.id, i.guest_id, g.name as guest_name, e.name as event_name
      FROM invitations i
      INNER JOIN guests g ON i.guest_id = g.id
      INNER JOIN events e ON i.event_id = e.id
      WHERE i.id = ${invitationId} AND e.name = ${eventId}
    `;

    if (invitation.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invitación no encontrada'
      });
    }

    // Actualizar el estado a confirmado (1) y registrar fecha de respuesta
    const result = await sql`
      UPDATE invitations 
      SET status = 1, responded_at = NOW()
      WHERE id = ${invitationId}
      RETURNING id, status, responded_at
    `;

    if (result.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Error actualizando estado de invitación'
      });
    }

    const guestName = invitation[0].guest_name;
    
    console.log('✅ RSVP confirmed successfully for:', guestName);

    res.status(200).json({
      success: true,
      message: `RSVP confirmado exitosamente para ${guestName}`,
      invitation: {
        id: result[0].id,
        status: result[0].status,
        responded_at: result[0].responded_at
      }
    });

  } catch (error) {
    console.error('❌ Error confirming RSVP:', error);
    throw error;
  }
}
