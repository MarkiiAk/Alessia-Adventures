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
    
    // Token de acceso actualizado - si este expira, necesitamos uno nuevo
    const accessToken = 'sl.u.AGUoSIDwscJ3q0LOX9nniIafPTpLgEbcL3VfKx1zLWX3-8XIJWktVG6EvNc8T588VZlHCMvowK0tykdL5IdGj-Hot1LPAFWBMKXq5YOfnIV2R5LHS2vEQsx8NVvfbICcH6Yc2c2UOdIW4s2MeAAp88RdbRiMXANVmwRoUs3M9RXuJMsQZJKKk6iUnqlhLaXC2pf6pYn0k4zcfjNm5IyWPG_Af0fPHS_homZM7b65DyUZi7au7isxC2Ubk35uj5LyvjfPTNZh5sUidLVl1ylLAMzBH0r--oo3Oc3lNnfon-rUuqWE0zxXeN1KOTb58z72CR6EZP9etB-XTIpkp_iEarV5rtuCNg6RBRvhayWhnSo69Mi364Xh8CrAq2QF6voZphtc9kd3XFnCb8jCr_FqNC4SQYT8pjIVg4sOpahRHZFVbwX-JSR4Ih4jRl3vs7TWBYXhu20HOlKxOCLzjuFF7EwZcFe-qivc85-9XI2UTz9tDXLJHjvf0-w2QmIKDVY-rDVY17gUYKcvQsQDeXVPFjzt2IxIG_ZJKO7EH2lDeKiZYTr16RvwKj4SOSLtRNZ0_muFuSSI3rla1E5A_QtFlrTsdRi6wst2mh7FGvu8nrKeIqPui6VaOmE6tXA6qcrEwhM4WxHrb2tnJiF8ZTaAFcKOW17AX-HChy58HQz_MZ0gXwu54atPsNuGCTz614PNjKgCoNiyT1h14aMDT4I3mIl48m2lF9woA_JrSt5akSpwmFNvnucMnAYAtMmr-fq__QDdvgwN7F8mKBiNlHmrw4KS84OmMYiOOwqVk3l2ycr3gSWlN9d7rjSk6aHPN50Yn3QccS7MjUV3yauA7xOLLegWxsj68ViDg6AUyROcziL8UD0RbPNlY-8KJTRqDyjN6eKwFAS-wR4orKRMMhXhcSvGh64HG8y5PsRIIHZaU7IZ24QI4ZrVmnw05gu3yez4AJ_wRU_nRZYejC2gZTAYFyPlrllPgUGta_4MWe63icTnpNr1D49dskqBJ6iS3FI0UDSElYq5OYBISmgYEBt4MLdaFPDh_ouPFTL8JGqz4L2_2y0lBdCpD062Dlq7EEmJmYnkbYLyuhcI1ppyFy06ycEo240QjVeJn2NGjJdcGk8hNJWQu6gpZkSebbkqYdkdPubOcVlcgaqu9bOwMQdC1EIKLhSUa59fN7sjP0FOBnd3lHw-gYSuYFSNUehbaYYS7F4cynP7-QNewewTaLWsNQhT_q4A10_Bq7hOypJS_xRSQ5gxZqnfWg83eh5cMTKeHKkkuk5N0UvVmg9OE9HQrKBDPS2E8Wv7OumrVavnLeYd0cbRrq4Ps1wCszyVQGnfx34';
    
    console.log('🔑 Usando OAuth2 token de Dropbox');
    console.log('🔍 Token length:', accessToken.length);

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
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = avatarFile.originalFilename ? 
      avatarFile.originalFilename.split('.').pop() : 'jpg';
    const safeName = nickname ? 
      nickname.replace(/[^a-zA-Z0-9]/g, '_') : 'avatar';
    const fileName = `${safeName}_${timestamp}_${randomId}.${extension}`;

    // Leer el archivo
    const fileBuffer = fs.readFileSync(avatarFile.filepath);
    console.log('📁 Archivo leído:', fileName, 'Size:', fileBuffer.length, 'bytes');

    // Subir a Dropbox
    try {
      console.log('📤 INICIANDO SUBIDA A DROPBOX...');
      console.log('📁 Nombre archivo:', fileName);
      console.log('📊 Tamaño buffer:', fileBuffer.length, 'bytes');
      console.log('🎯 Ruta destino:', `/AlessiaEvents/${fileName}`);
      
      const uploadResponse = await dbx.filesUpload({
        path: `/AlessiaEvents/${fileName}`,
        contents: fileBuffer,
        mode: 'add',
        autorename: true
      });
      
      console.log('✅ UPLOAD EXITOSO! File uploaded to Dropbox:', uploadResponse.result.path_display);

      // Intentar crear enlace compartido, pero si falla, usar una URL alternativa
      let directUrl;
      try {
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
        // Los nuevos enlaces tienen formato: https://www.dropbox.com/scl/fi/...?rlkey=...&st=...&dl=0
        directUrl = shareLinkResponse.result.url;
        
        // Si es el nuevo formato con /scl/fi/, convertir correctamente
        if (directUrl.includes('/scl/fi/')) {
          // Cambiar dropbox.com por dl.dropboxusercontent.com y mantener parámetros
          directUrl = directUrl.replace('www.dropbox.com/scl/fi/', 'dl.dropboxusercontent.com/scl/fi/');
          // Cambiar dl=0 por dl=1 para descarga directa
          directUrl = directUrl.replace('&dl=0', '&dl=1');
          if (directUrl.includes('?dl=0')) {
            directUrl = directUrl.replace('?dl=0', '?dl=1');
          }
        } else {
          // Formato antiguo
          directUrl = directUrl.replace('dropbox.com', 'dl.dropboxusercontent.com');
          directUrl = directUrl.replace('?dl=0', '');
        }

      } catch (shareError) {
        console.warn('⚠️ No se pudo crear enlace compartido:', shareError.message);
        
        // Si falla crear el enlace, intentar usar un enlace temporal basado en el path
        directUrl = `https://api.dropbox.com/2/sharing/create_shared_link_with_settings`;
        console.error('🚨 Share link failed, will need manual intervention');
      }

      console.log('✅ Direct URL:', directUrl);

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
      
      // Log específico para errores de API
      if (dropboxError.error) {
        console.error('🚨 Dropbox API Error:', JSON.stringify(dropboxError.error, null, 2));
        if (dropboxError.error.error_summary) {
          console.error('🚨 Error Summary:', dropboxError.error.error_summary);
        }
      }
      
      // Limpiar archivo temporal
      if (fs.existsSync(avatarFile.filepath)) {
        fs.unlinkSync(avatarFile.filepath);
      }

      throw new Error(`Error subiendo a Dropbox: ${dropboxError.message || 'Error desconocido'}`);
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