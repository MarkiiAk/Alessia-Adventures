import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

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
    console.log('🖼️ Avatar upload request received (local storage)');

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
    const extension = avatarFile.originalFilename ? 
      avatarFile.originalFilename.split('.').pop() : 'jpg';
    const safeName = nickname ? 
      nickname.replace(/[^a-zA-Z0-9]/g, '_') : 'avatar';
    const fileName = `${safeName}_${timestamp}.${extension}`;

    // Crear directorio uploads si no existe
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Created uploads directory:', uploadsDir);
    }

    // Ruta final del archivo
    const finalPath = path.join(uploadsDir, fileName);
    
    // Copiar archivo del temporal al destino final
    fs.copyFileSync(avatarFile.filepath, finalPath);
    
    // Limpiar archivo temporal
    fs.unlinkSync(avatarFile.filepath);
    
    // URL relativa para el frontend
    const relativePath = `/uploads/avatars/${fileName}`;
    
    console.log('✅ Avatar guardado localmente:', relativePath);

    res.status(200).json({
      success: true,
      message: 'Avatar subido exitosamente (almacenamiento local)',
      filename: fileName,
      url: relativePath,
      localPath: finalPath
    });

  } catch (error) {
    console.error('❌ Error uploading avatar locally:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor subiendo avatar',
      details: error.message
    });
  }
}