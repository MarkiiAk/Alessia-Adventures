import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
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

    // Conectar usando Neon serverless driver
    const sql = neon(process.env.DATABASE_URL);

    // Buscar o crear evento de Alessia
    let eventResult = await sql`
      SELECT id, name FROM events WHERE LOWER(name) LIKE LOWER(${'%alessia%'}) LIMIT 1
    `;

    let eventId;
    if (eventResult.length === 0) {
      // Crear evento si no existe
      const newEventResult = await sql`
        INSERT INTO events (name, description, event_date, created_at) 
        VALUES (${`Cumpleaños #3 de Alessia - Aventura Disney`}, ${`Celebración del tercer cumpleaños de Alessia en Disneyland`}, ${'2026-08-31T07:25:00'}, NOW()) 
        RETURNING id, name
      `;
      eventId = newEventResult[0].id;
      console.log('✅ Event created:', eventId);
    } else {
      eventId = eventResult[0].id;
    }

    // Buscar o crear invitado
    let guestResult = await sql`
      SELECT id, name FROM guests WHERE LOWER(name) = LOWER(${guestName}) LIMIT 1
    `;

    let guestId;
    if (guestResult.length === 0) {
      const newGuestResult = await sql`
        INSERT INTO guests (name, email, phone, created_at) 
        VALUES (${guestName}, ${email || null}, ${phone || null}, NOW()) 
        RETURNING id, name
      `;
      guestId = newGuestResult[0].id;
      console.log('✅ Guest created:', guestId);
    } else {
      guestId = guestResult[0].id;
    }

    // Crear o actualizar invitación
    const invitationResult = await sql`
      INSERT INTO invitations (guest_id, event_id, status, responded_at, created_at)
      VALUES (${guestId}, ${eventId}, ${status}, NOW(), NOW())
      ON CONFLICT (guest_id, event_id) 
      DO UPDATE SET status = EXCLUDED.status, responded_at = NOW()
      RETURNING id, status, responded_at
    `;

    const invitation = invitationResult[0];
    console.log('✅ RSVP successful:', invitation.id);

    const statusText = status === 1 ? 'confirmado' : status === 2 ? 'declinado' : 'pendiente';

    res.status(200).json({
      success: true,
      message: `¡RSVP ${statusText} exitosamente en la base de datos!`,
      data: {
        guest: guestName,
        event: 'Cumpleaños #3 de Alessia - Aventura Disney',
        status: statusText,
        invitationId: invitation.id,
        timestamp: invitation.responded_at
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
  }
}