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
    
    // Usar token hardcoded para debug
    const accessToken = 'sl.u.AGWZ1dTZ7QXDmK7bxtTMUficXdniAitUph5jHY61OkeUrONgFbBFR5RaU4UjDhStvo0Lz2m_8ffFhEAxxne6b_gBW2Ob5NyWQRDiHKXqZIgAZ1L_ZXdzMg-kLuoHP3mpgT6cdwblYtr0u8P7KYMbgWUgd0-Kol8ZLUcE5x3J_F6p6pZh1u37A0Ff62QiS0uxlhxoLdu98abcryWP9cgZLpIUoPmjdinjDf692C1zfZeiZrkpgDWXqJwr6eehYLVNLRkWyd3-wHOkxseEwkNT6omjOMgPKydo1P0sI9dKrfrpsRLlKE7onUfiuuyHfmo3KPFZlidn6OR1cti8u80-Je0GJJHUsuNmPN4b0vrYlDiBXrncgsSSeCS_xO_jRujqZ6rPze37PJ8SZXvk9utYlWevB8M6VJ5ELeSoa_8O5gDjh5AId7f-jpXXgOR8afWN0jJL4NnC3SyEGPyag4JA3TLOOiH1ndS6fCk52vt1TgEJ4Z-oqjkwidhOcs9fEt6n7I7o_JcNtV5TZIpduTbCTxZ3YGhJqwvlpUtaRjAlxwzOgVScjPf9bi-H3k5ACQSnb9Fmkfw97nvlH-WFRzkmrXgofaoxvIVQG34lLJHZrUuKjwqKNhKtjpiI9x-BMzqfZjcPE15USweUp2KkiPpWWPhyWh48zZdWk43DQeH-p9-9cOo18d0o1bUYxQjX9oAPkB29imEW1HlqvUUrGCsJQ7Q9cEAbZBEwJoGd5UdfFezYDk4VyWdRhJzESJVpYUT1Y13wt5Ea7UXObaCwSRHrzh3WwUzX4IaLx5mjjYqynRvlzpHd0SNARkq8uzYWX0Se-P5NrFmvCQKPa8EdtTUmGMpmLtW3DWqmWLfVB6qQNtdDdj0nbRne-2BUEd6miwz0Qlm6BK8F76Tv7SLjKaPu0avTDTZTCOtbgKZsDAYC5Zt6KmkgU8m5fj5L755rXTvOzew0iDKJUq1UJH6NbtA3UILa41HFCaAF3NqVtwVmT941NSKS0htFgv52-0OWVpt9h880PuyZLKnhx0KGo-gxKLt1G70qqAWsCPw8lTDP4nWrENM5HXxwb4Tyse1IfEnpcp4S4Bs0Tn066JTYiF2uXMPIkN6mQV2LYU-CdevndvRH2snRh1WP1QWFJ6Z6k9kNPpUFfjGVERp2dA3dUtLZQvcJwasOHiZDdm96mBFLy7DoZPBRn6HphhehM0ij6f3W30L7vrfzqnmGfr00124G-zuA0g9eZqoyxABzDEhsDUFmkSO3fRDeetfaYJlm5zc-KqfldDlc2sUY4nfs9B2nEy9UVsc6HVmjjykTWniJ1Hkp4g';
    
    console.log('🔑 TOKEN DEBUG:');
    console.log('🔑 Token exists:', !!accessToken);
    console.log('🔑 Token length:', accessToken?.length);
    console.log('🔑 Token starts with:', accessToken?.substring(0, 15));
    
    console.log('🔑 Using access token:', accessToken ? `${accessToken.substring(0, 10)}...` : 'NO TOKEN');
    console.log('🔑 Token length:', accessToken?.length || 0);

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