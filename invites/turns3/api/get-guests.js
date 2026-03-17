const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = async (req, res) => {
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

        // Obtener invitados con datos completos de Guest e Invitation
        const invitations = await prisma.invitation.findMany({
            where: {
                eventId: eventId
            },
            include: {
                guest: true
            },
            orderBy: [
                // Primero por estado: 1=CONFIRMED, 2=PENDING, 3=DECLINED
                {
                    status: 'asc'
                },
                // Luego por nombre alfabético
                {
                    guest: {
                        name: 'asc'
                    }
                }
            ]
        });

        // Contar estados (1=CONFIRMED, 2=PENDING, 3=DECLINED)
        const statusCounts = {
            confirmed: invitations.filter(i => i.status === 1).length,
            pending: invitations.filter(i => i.status === 2).length,
            declined: invitations.filter(i => i.status === 3).length,
            total: invitations.length
        };

        console.log('Invitaciones encontradas:', invitations.length);
        console.log('Estados:', statusCounts);

        // Formatear respuesta con datos completos
        const formattedGuests = invitations.map(invitation => {
            // Mapear status numérico a texto
            let status = 'PENDING';
            if (invitation.status === 1) status = 'CONFIRMED';
            else if (invitation.status === 3) status = 'DECLINED';
            
            return {
                id: invitation.id,
                name: invitation.guest.name,
                email: invitation.guest.email,
                phone: invitation.guest.phone || '',
                status: status,
                avatar: '/src/default-avatar.png', // Por ahora usar default
                role: 'Aventurero Mágico', // Role por defecto
                createdAt: invitation.createdAt.toISOString()
            };
        });

        console.log('Invitados formateados:', formattedGuests);

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
            error: 'Error interno del servidor',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Error al cargar invitados'
        });
    } finally {
        await prisma.$disconnect();
    }
};