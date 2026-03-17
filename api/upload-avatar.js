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

    // Configurar cliente de Dropbox
    const dbx = new Dropbox({
      accessToken: 'sl.u.AGUMcVpt_tUOz1RBD8CiWRDZWKHM7ZCRobFML3U6kK7318b-OPWpjxu7_2d0Tyoxjl7pEVblnIuwopwyEyeDyWwOeBwbrjG-WISp8YR-iTAP39U4QWPHuV44jZ8CEtqeMBi42R7y1PHwGtNiJZFyH4jerNafI_PnlU4oFo7jP2spT4HWhmVRHsEShbm9-W5TaKiaC2M1kDQ-uht0Tt9q_wAUhpRt5jzAfsg6J_yl1ZZpmQv00p1WjZSdeZpIlY8coIbJHhDPi9_brL5T6l2AedCaE-vqCD1DrtSHy0Kw8JmiaJDdw6SNCxDqUgGrgw9xt2dLkarWQxZVkV30PjdQjF7Cjm0WrWYICNATsZK4Ox1FnH0CKDZFoVN6FQAiQVPHgAcyWwNG7slBlreV-8e_417iQKhYPc54oauwR7PzIP10APxJ_T6yySpt1T40I31laDNzLy6Jk5bZs9wVeNa-6IqKqYMlt7s1tgLGOrolECj_yIiL5KUbqkT8aoZht2GKbrV7ELfzEpSbC-wSw7i-G1bdqxZ3lJgnvlil_9LT0S-psKUPUTyJF-WWy5KLb0jrqR2RRgDt9s7ddy_iatzV3XwKkxe3Ya3A1JFWpgXlxBznN3Cmyu-9lAdetf55_-ShjnMuS9lpHzi1p_8EGKF4I_DJtY1aSucEerx9KouVZvOGSap5w63Gi2_pWHhINoytgj5xSra13FNAmzawkDnfU5ZZujQbetPwLNsrwIyDZbmOyYj0fyr7o9cFQKLPI4b6mgfb6Sl8-BEHpLm_XByla_WxLdOEKeLI35MxcbAWqOsjiFU9ja0d6gThKl4tN_MhzeUgoyKWmU0zil87XqEk3b74OBDa-aZ0tqpvIzeCanu9CHEF7AQcoUKRCQuzRmgT_lxlS3dGZOtTAl-Hez15PV1Nf0QHEXiApGCNot997W8CKs97ydRdVrxJs-38oYinCWQNRIgrPz_00P2o4YK7d9NNRg6mwiVjst1BhhGuxVaLKFPWUO_MDk915B6L1J4Bl5-JohPupaQ2ebCAQByN-joqxcA2hBwTZL_jGrZc5e_sqXP3lwsqfCrqhNwQ6JSNUONUNammULFeHcvYrLJ8XmchmQ6aupIocaiippiMz9043Pzz6swDy3FUbTl3UkKadWuAOMna3ZUwYkqTIbiiuXQQUPLYVYoPx8CVexQVerSkwl9MPPnv7KdKqTLAAXA7KR_MhKRGTSznUVQmb46u2ZWl6wy8YOPkeXGNH3DlsgQUFRki-e4TlFrQnY0Rzg8MCpWhUSFwsnLnFeO9UW3_oiicdaNAyQgdBuyAkEyCTnRs1Q'
    });

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
      const uploadResponse = await dbx.filesUpload({
        path: `/${fileName}`,
        contents: fileBuffer,
        mode: 'add',
        autorename: true
      });

      console.log('✅ File uploaded to Dropbox:', uploadResponse.result.path_display);

      // Crear enlace compartido público
      const shareLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
        path: uploadResponse.result.path_display,
        settings: {
          requested_visibility: 'public',
          audience: 'public',
          access: 'viewer'
        }
      });

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
      console.error('❌ Dropbox error:', dropboxError);
      
      // Limpiar archivo temporal
      if (fs.existsSync(avatarFile.filepath)) {
        fs.unlinkSync(avatarFile.filepath);
      }

      throw new Error(`Error subiendo a Dropbox: ${dropboxError.message}`);
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