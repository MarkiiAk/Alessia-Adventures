const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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

  const client = await pool.connect();
  
  try {
    const { guestName, email, phone, status = 1 } = req.body;

    if (!guestName) {
      return res.status(400).json({ error: 'Guest name is required' });
    }

    console.log('🎯 RSVP attempt:', { guestName, email, phone, status });

    // Comenzar transacción
    await client.query('BEGIN');

    // Buscar o crear evento de Alessia
    let eventResult = await client.query(
      `SELECT id, name FROM events WHERE LOWER(name) LIKE LOWER($1) LIMIT 1`,
      ['%alessia%']
    );

    let eventId;
    if (eventResult.rows.length === 0) {
      // Crear evento si no existe
      const newEventResult = await client.query(
        `INSERT INTO events (name, description, event_date, created_at) 
         VALUES ($1, $2, $3, NOW()) RETURNING id, name`,
        [
          'Cumpleaños #3 de Alessia - Aventura Disney',
          'Celebración del tercer cumpleaños de Alessia en Disneyland',
          '2026-08-31T07:25:00'
        ]
      );
      eventId = newEventResult.rows[0].id;
      console.log('✅ Event created:', eventId);
    } else {
      eventId = eventResult.rows[0].id;
    }

    // Buscar o crear invitado
    let guestResult = await client.query(
      `SELECT id, name FROM guests WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [guestName]
    );

    let guestId;
    if (guestResult.rows.length === 0) {
      const newGuestResult = await client.query(
        `INSERT INTO guests (name, email, phone, created_at) 
         VALUES ($1, $2, $3, NOW()) RETURNING id, name`,
        [guestName, email || null, phone || null]
      );
      guestId = newGuestResult.rows[0].id;
      console.log('✅ Guest created:', guestId);
    } else {
      guestId = guestResult.rows[0].id;
    }

    // Crear o actualizar invitación
    const invitationResult = await client.query(
      `INSERT INTO invitations (guest_id, event_id, status, responded_at, created_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (guest_id, event_id) 
       DO UPDATE SET status = EXCLUDED.status, responded_at = NOW()
       RETURNING id, status, responded_at`,
      [guestId, eventId, status]
    );

    // Confirmar transacción
    await client.query('COMMIT');

    const invitation = invitationResult.rows[0];
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
    await client.query('ROLLBACK');
    console.error('❌ Database error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error conectando a la base de datos',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    client.release();
  }
};