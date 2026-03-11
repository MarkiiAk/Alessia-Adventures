import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🎯 Getting events list...');

    // Conectar usando Neon serverless driver
    const sql = neon(process.env.DATABASE_URL);

    // Obtener todos los eventos - solo el nombre
    const events = await sql`
      SELECT name FROM events ORDER BY created_at DESC
    `;

    console.log('✅ Events retrieved:', events.length);

    res.status(200).json({
      success: true,
      events: events,
      count: events.length
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