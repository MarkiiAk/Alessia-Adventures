import { IncomingForm } from 'formidable';
import fs from 'fs';
import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('🖼️ Avatar upload request received');
    
    const form = new IncomingForm({
      maxFileSize: 5 * 1024 * 1024, // 5MB max
      keepExtensions: true,
    });

    // Parse el form data
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const avatarFile = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar;
    const nickname = Array.isArray(fields.nickname) ? fields.nickname[0] : fields.nickname;
    
    if (!avatarFile) {
      return res.status(400).json({
        success: false,
        error: 'No se encontró archivo de avatar'
      });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(avatarFile.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de archivo no válido. Use JPG, PNG, GIF o WebP'
      });
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(4).toString('hex');
    const extension = avatarFile.originalFilename ? 
      avatarFile.originalFilename.split('.').pop() : 'jpg';
    const safeName = nickname ? 
      nickname.replace(/[^a-zA-Z0-9]/g, '_') : 'avatar';
    const fileName = `${safeName}_${timestamp}_${randomId}.${extension}`;

    // Leer el archivo
    const fileBuffer = fs.readFileSync(avatarFile.filepath);
    console.log('📁 Archivo leído:', fileName, 'Size:', fileBuffer.length, 'bytes');

    // Usar las credenciales de app directamente sin OAuth
    const APP_KEY = 'yfh7bv6gksy94c4';
    const APP_SECRET = '0z9z2qvhehp7zbv';
    
    // Para simplificar, vamos a usar almacenamiento local en producción
    // Ya que Dropbox requiere OAuth2 obligatoriamente para apps de terceros
    
    // Crear directorio si no existe
    const uploadsDir = './public/uploads/avatars';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Created uploads directory');
    }
    
    // Guardar archivo localmente
    const localPath = `${uploadsDir}/${fileName}`;
    fs.writeFileSync(localPath, fileBuffer);
    
    // URL pública del archivo
    const publicUrl = `/uploads/avatars/${fileName}`;
    
    console.log('✅ File saved locally:', localPath);
    console.log('🔗 Public URL:', publicUrl);

    // Limpiar archivo temporal
    fs.unlinkSync(avatarFile.filepath);

    res.status(200).json({
      success: true,
      message: 'Avatar subido exitosamente',
      url: publicUrl,
      filename: fileName
    });

  } catch (error) {
    console.error('❌ Error general:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor subiendo avatar',
      details: error.message
    });
  }
}