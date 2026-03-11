const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { guestName, email, phone, status = 1 } = req.body;

    if (!guestName) {
      return res.status(400).json({ error: 'Guest name is required' });
    }

    console.log('🎯 RSVP attempt:', { guestName, email, phone, status });

    // Buscar o crear evento de Alessia
    let event = await prisma.event.findFirst({
      where: {
        name: {
          contains: 'Alessia',
          mode: 'insensitive'
        }
      }
    });

    if (!event) {
      // Crear evento si no existe
      event = await prisma.event.create({
        data: {
          name: 'Cumpleaños #3 de Alessia - Aventura Disney',
          description: 'Celebración del tercer cumpleaños de Alessia en Disneyland',
          eventDate: new Date('2026-08-31T07:25:00'),
        }
      });
      console.log('✅ Event created:', event.id);
    }

    // Buscar o crear invitado
    let guest = await prisma.guest.findFirst({
      where: {
        name: {
          equals: guestName,
          mode: 'insensitive'
        }
      }
    });

    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          name: guestName,
          email: email || null,
          phone: phone || null,
        }
      });
      console.log('✅ Guest created:', guest.id);
    }

    // Crear o actualizar invitación
    const invitation = await prisma.invitation.upsert({
      where: {
        guestId_eventId: {
          guestId: guest.id,
          eventId: event.id,
        }
      },
      update: {
        status: status,
        respondedAt: new Date(),
      },
      create: {
        guestId: guest.id,
        eventId: event.id,
        status: status,
        respondedAt: new Date(),
      }
    });

    console.log('✅ RSVP successful:', invitation.id);

    const statusText = status === 1 ? 'confirmado' : status === 2 ? 'declinado' : 'pendiente';

    res.status(200).json({
      success: true,
      message: `¡RSVP ${statusText} exitosamente en la base de datos!`,
      data: {
        guest: guest.name,
        event: event.name,
        status: statusText,
        invitationId: invitation.id,
        timestamp: invitation.respondedAt
      }
    });

  } catch (error) {
    console.error('❌ Database error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error conectando a la base de datos',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    await prisma.$disconnect();
  }
};