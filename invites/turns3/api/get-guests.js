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

        // Obtener invitados ordenados: confirmados primero, luego pendientes, después declinados
        const guests = await prisma.invitation.findMany({
            where: {
                eventId: eventId
            },
            select: {
                id: true,
                guestName: true,
                email: true,
                phone: true,
                rsvpStatus: true,
                avatarUrl: true,
                role: true,
                createdAt: true
            },
            orderBy: [
                // Primero por estado: CONFIRMED, PENDING, DECLINED
                {
                    rsvpStatus: 'asc'
                },
                // Luego por nombre alfabético
                {
                    guestName: 'asc'
                }
            ]
        });

        // Contar estados
        const statusCounts = {
            confirmed: guests.filter(g => g.rsvpStatus === 'CONFIRMED').length,
            pending: guests.filter(g => g.rsvpStatus === 'PENDING').length,
            declined: guests.filter(g => g.rsvpStatus === 'DECLINED').length,
            total: guests.length
        };

        console.log('Invitados encontrados:', guests.length);
        console.log('Estados:', statusCounts);

        // Formatear respuesta con datos completos
        const formattedGuests = guests.map(guest => ({
            id: guest.id,
            name: guest.guestName,
            email: guest.email,
            phone: guest.phone || '',
            status: guest.rsvpStatus,
            avatar: guest.avatarUrl || '/src/default-avatar.png',
            role: guest.role || 'Aventurero Mágico',
            createdAt: guest.createdAt.toISOString()
        }));

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