import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Obtener el eventId del query
        let { eventId } = req.query;
        
        // Si viene 'turns3', convertir al eventId real
        if (eventId === 'turns3') {
            eventId = "Cumpleaños #3 de Alessia - Aventura Disney";
        }
        
        if (!eventId) {
            return res.status(400).json({ error: 'eventId es requerido' });
        }

        console.log('Obteniendo invitados para evento:', eventId);

        // Conectar usando Neon serverless driver
        const sql = neon(process.env.DATABASE_URL);

        // Obtener invitados con datos completos usando JOIN, incluyendo avatares y prioridad
        const invitations = await sql`
            SELECT 
                i.id as invitation_id,
                i.status,
                i.created_at as invitation_created,
                g.id as guest_id,
                g.name as guest_name,
                g.email,
                g.phone,
                g.avatar,
                COALESCE(g.priority_order, 999) as priority_order
            FROM invitations i
            JOIN guests g ON i.guest_id = g.id
            WHERE i.event_id = (
                SELECT id FROM events WHERE name = ${eventId} LIMIT 1
            )
            ORDER BY 
                COALESCE(g.priority_order, 999) ASC,
                i.status ASC, 
                g.name ASC
        `;

        console.log('Invitaciones encontradas:', invitations.length);

        // Contar estados (1=CONFIRMED, 2=PENDING, 3=DECLINED)
        const statusCounts = {
            confirmed: invitations.filter(i => i.status === 1).length,
            pending: invitations.filter(i => i.status === 2).length,
            declined: invitations.filter(i => i.status === 3).length,
            total: invitations.length
        };

        console.log('Estados:', statusCounts);

        // Formatear respuesta con datos completos
        const formattedGuests = invitations.map(invitation => {
            // Mapear status numérico a texto correctamente
            let status = 'PENDING';
            if (invitation.status === 1) status = 'CONFIRMED';
            else if (invitation.status === 2) status = 'DECLINED';
            // status === 3 es PENDING (default)
            
            // Log para debugging de avatares
            console.log(`Avatar para ${invitation.guest_name}:`, invitation.avatar);
            
            // Procesar avatar igual que el admin
            const avatarSrc = invitation.avatar && invitation.avatar.startsWith('http') ? 
                invitation.avatar : 
                (invitation.avatar ? invitation.avatar : '/src/default-avatar.png');
            
            return {
                id: invitation.invitation_id,
                name: invitation.guest_name,
                email: invitation.email,
                phone: invitation.phone || '',
                status: status,
                avatar: avatarSrc,
                role: 'Aventurero Mágico',
                priority: invitation.priority_order || 999,
                createdAt: invitation.invitation_created
            };
        });

        console.log('Invitados formateados:', formattedGuests.length);
        console.log('Sample guest data:', formattedGuests[0]);

        return res.status(200).json({
            success: true,
            data: {
                guests: formattedGuests,
                counts: statusCounts,
                eventId: eventId
            }
        });

    } catch (error) {
        console.error('Error al obtener invitados:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Error al cargar invitados'
        });
    }
}