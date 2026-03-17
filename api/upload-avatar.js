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
    const accessToken = 'sl.u.AGUxYRYD2O7SSkIcCfat8uaqThx6ouWx2qlfhTzpuw0GxP9GasJapWGTEfHvkzghdyirBrzNlpoeNrNaNlsTxo4C0It9kLzVQoy2_9ahbuVcM8Mu0i5J9kPukp_shw3eUFitvT4Wa3XrmTm46N5HHp0Lx8_Ql9A-fxp8G2zpZQYqUXcuV3GuPbg2u8AdVeikH8WwgXek1WLuLfRcv0g7dmZkgHbcQQ-N7P5ue9TSoJQ6tsIEJ4M1o-FV2vkjCm3VZb2T6LiOoD9GWyoyxWAEplsEXWC0ga33QsiFlMYfTI3sFaO8in4qMHsvwcFS4FBiU1-IE-DwBNJ5_LDVrU5sfEsdnWJyE0YChyaHlZgVMLjW7GLwMRuTyzhBsJ6u6UwGCv3uHIMfkF5EftxHZJBEusc-oAPkbCqQAJD8uZGYa5KabZRHfJxN2jU6vW9rgOVLVL5B0suPH0zjhA9JYajlI2pCv7IxiVoyLeGaxFTqrUgQTKmfeZ5Zh6BeRDKzJMkHu5ULQMave9MIXoyHhYP_PQvFEa-mpXS0XFqTyBlKZY7u3hjX3jXySz57UU4uQxIq8uHBusPZ7VniRNCExVVMIx-4ZLdKjETfUnRA3Qe25LdLNh99POQAG_8XXkwgxilI5OEJPOpFTZBBo7VAv_pEvs7L4o-qXpteYWW8OGxLBLsdziVAeohEPo0q6ZJBX13mloWVn94wvXk01Q5GPuqaZLhAsX4b5BLIMu6aVgytG0g5xeDQXD-HCIJL31-NCECqw43FlCZCQT5EIJEXztgtYnCJDYSD9SWXnom2yng3Ewb5GN8uU-duP-IPR4NrP-Y0h_0c9QjECjqhZ3FJTnbcj0_pmhOL7BB68rRnGq1rYc-O-E8xnpz5HtyGEinfVwJQqGJgRf3wdlc6qvE3_C8IWa0TmwmRCOcyacAouDJvO-yqruFnDWMOxs7DZ2_1CqASJM8HbLdxJg3n6Pu63SRPs917LkDrlBaINvlR8UPbZCW85yNqA3lL6VfZUWbHPGW8_7_Xtq9GYVOGPGjjLM8x-WKn1OMtHdXMVc1EYJXRzlz9jAknzvOiJuRwowyAnnXzJGzNIEh2TJPiHrmkOXlsLNHcgYlFlW5wa32f9BBwXoI_l9ceL7xPnsjDmAqvRVHtDsv_T5Ckk5RBzeFu3u0nqIVH7hb1bYAQLvbhirUDOPUqEIAwWakIk6AKqJB-1hHk-l-DUCr8NeaWRea2cyOWdMoX7tpZY1Mj7_VruTfncOc2vXh4eDwuQpUmkqLipNAhydQRqAwEpFyUFzUVdfwKEszU3z-TMh2FNDye5w-3ZV-FaAd5vV5GXw1A42z6HNAl9Rc';
    
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

      // Crear o obtener enlace compartido con manejo robusto de errores
      let directUrl;
      try {
        console.log('🔗 Intentando crear enlace compartido...');
        
        let shareLinkResponse;
        try {
          // Intentar crear enlace compartido directamente
          shareLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
            path: uploadResponse.result.path_display,
            settings: {
              requested_visibility: 'public',
              audience: 'public', 
              access: 'viewer'
            }
          });
          console.log('✅ Enlace compartido creado:', shareLinkResponse.result.url);
          
        } catch (createError) {
          console.log('🔗 Error creando enlace:', createError.message);
          
          // Si el error es porque ya existe un enlace, buscar el existente
          if (createError.error && 
              (createError.error.error_summary?.includes('shared_link_already_exists') ||
               createError.error['.tag'] === 'shared_link_already_exists')) {
            console.log('🔗 Enlace ya existe, buscando existente...');
            
            const existingLinks = await dbx.sharingListSharedLinks({
              path: uploadResponse.result.path_display
            });
            
            if (existingLinks.result.links && existingLinks.result.links.length > 0) {
              console.log('✅ Encontrado enlace existente:', existingLinks.result.links[0].url);
              shareLinkResponse = { result: { url: existingLinks.result.links[0].url } };
            } else {
              throw new Error('No se pudo encontrar enlace existente');
            }
          } else {
            // Si es cualquier otro error, fallar
            throw createError;
          }
        }

        // Convertir el enlace de Dropbox a URL directa
        directUrl = shareLinkResponse.result.url;
        console.log('🔗 URL original:', directUrl);
        
        // Convertir para formato /scl/fi/ (nuevo formato de Dropbox)
        if (directUrl.includes('/scl/fi/')) {
          // Cambiar www.dropbox.com por dl.dropboxusercontent.com
          directUrl = directUrl.replace('www.dropbox.com/scl/fi/', 'dl.dropboxusercontent.com/scl/fi/');
          // Cambiar dl=0 por dl=1 para descarga directa
          directUrl = directUrl.replace('&dl=0', '&dl=1');
          if (directUrl.includes('?dl=0')) {
            directUrl = directUrl.replace('?dl=0', '?dl=1');
          }
          console.log('✅ URL convertida (nuevo formato):', directUrl);
        } 
        // Convertir para formato antiguo
        else if (directUrl.includes('dropbox.com')) {
          directUrl = directUrl.replace('dropbox.com', 'dl.dropboxusercontent.com');
          directUrl = directUrl.replace('?dl=0', '');
          console.log('✅ URL convertida (formato antiguo):', directUrl);
        }

      } catch (shareError) {
        console.error('🚨 FALLÓ CREAR/OBTENER ENLACE COMPARTIDO:', shareError.message);
        console.error('🚨 Share error details:', JSON.stringify(shareError, null, 2));
        
        // Si falla todo, devolver error detallado
        throw new Error(`No se pudo crear enlace compartido de Dropbox: ${shareError.message}`);
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