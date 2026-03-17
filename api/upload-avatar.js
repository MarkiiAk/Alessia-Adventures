import { IncomingForm } from 'formidable';
import fs from 'fs';
import { Dropbox } from 'dropbox';

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
    
    // Usar el refresh token para obtener un access token válido
    const refreshToken = 'aB_rrZdU7xwAAAAAAAAAAZBe4R4qVXdlvSBv-kzJh_yKJKnkKNgUj1WojAMHuNOZ';
    const appKey = 'l4ixtgvyqqzlq3n';
    const appSecret = '1e8g5kbecjvfhwu';
    
    console.log('🔄 Obteniendo access token con refresh token...');
    
    // Generar nuevo access token usando refresh token
    const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${appKey}:${appSecret}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Error obteniendo token:', errorText);
      throw new Error('No se pudo obtener access token de Dropbox');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    console.log('✅ Access token obtenido correctamente');
    console.log('🔑 Token starts with:', accessToken?.substring(0, 15));

    // Configurar cliente de Dropbox
    const dbx = new Dropbox({
      accessToken: accessToken
    });
    
    console.log('✅ Dropbox client configured');

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

    // Leer el archivo
    const fileBuffer = fs.readFileSync(avatarFile.filepath);

    // Subir a Dropbox
    try {
      console.log('📤 INICIANDO SUBIDA A DROPBOX...');
      console.log('📁 Nombre archivo:', fileName);
      console.log('📊 Tamaño buffer:', fileBuffer.length, 'bytes');
      console.log('🎯 Ruta destino:', `/AlessiaEvents/${fileName}`);
      
      console.log('🔧 Preparando filesUpload request...');
      console.log('🔧 Dropbox client configurado con token válido');
      
      const uploadResponse = await dbx.filesUpload({
        path: `/AlessiaEvents/${fileName}`,
        contents: fileBuffer,
        mode: 'add',
        autorename: true
      });
      
      console.log('✅ UPLOAD EXITOSO! Response recibida');

      console.log('✅ File uploaded to Dropbox:', uploadResponse.result.path_display);
      console.log('📋 Upload response:', JSON.stringify(uploadResponse.result, null, 2));

      // Crear enlace compartido público
      console.log('🔗 Creando enlace compartido...');
      const shareLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
        path: uploadResponse.result.path_display,
        settings: {
          requested_visibility: 'public',
          audience: 'public',
          access: 'viewer'
        }
      });

      console.log('🔗 Enlace compartido creado:', shareLinkResponse.result.url);

      // Convertir el enlace de Dropbox a URL directa
      let directUrl = shareLinkResponse.result.url.replace('dropbox.com', 'dl.dropboxusercontent.com');
      directUrl = directUrl.replace('?dl=0', '');

      console.log('✅ Direct URL created:', directUrl);

      // Limpiar archivo temporal
      fs.unlinkSync(avatarFile.filepath);

      res.status(200).json({
        success: true,
        message: 'Avatar subido exitosamente a Dropbox',
        filename: fileName,
        url: directUrl,
        dropboxPath: uploadResponse.result.path_display
      });

    } catch (dropboxError) {
      console.error('🚨🚨🚨 DROPBOX ERROR CAPTURADO 🚨🚨🚨');
      console.error('❌ Error message:', dropboxError.message);
      console.error('❌ Error status:', dropboxError.status);
      console.error('❌ Error code:', dropboxError.code);
      console.error('❌ Full error object:', JSON.stringify(dropboxError, null, 2));
      
      // Log específico para errores de API
      if (dropboxError.error) {
        console.error('🚨 Dropbox API Error:', JSON.stringify(dropboxError.error, null, 2));
        if (dropboxError.error.error_summary) {
          console.error('🚨 Error Summary:', dropboxError.error.error_summary);
        }
        if (dropboxError.error['.tag']) {
          console.error('🚨 Error Tag:', dropboxError.error['.tag']);
        }
      }
      
      // Log response details if available
      if (dropboxError.response) {
        console.error('🚨 Response status:', dropboxError.response.status);
        console.error('🚨 Response headers:', dropboxError.response.headers);
        console.error('🚨 Response data:', dropboxError.response.data);
      }
      
      // Limpiar archivo temporal
      if (fs.existsSync(avatarFile.filepath)) {
        fs.unlinkSync(avatarFile.filepath);
      }

      throw new Error(`Error subiendo a Dropbox: Response failed with a ${dropboxError.status || 'unknown'} code`);
    }

  } catch (error) {
    console.error('❌ Error uploading avatar:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor subiendo avatar',
      details: error.message
    });
  }
}