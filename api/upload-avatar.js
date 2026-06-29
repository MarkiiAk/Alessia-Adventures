import { put } from '@vercel/blob';
import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm({
      maxFileSize: 4 * 1024 * 1024, // 4MB — Vercel serverless limit is 4.5MB
      keepExtensions: true,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const avatarFile = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar;
    const nickname   = Array.isArray(fields.nickname) ? fields.nickname[0] : fields.nickname;

    if (!avatarFile) {
      return res.status(400).json({ success: false, error: 'No se encontró archivo de avatar' });
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(avatarFile.mimetype)) {
      return res.status(400).json({ success: false, error: 'Tipo de archivo no válido. Use JPG, PNG, GIF o WebP' });
    }

    const timestamp = Date.now();
    const randId    = Math.random().toString(36).substring(2, 8);
    const ext       = (avatarFile.originalFilename || 'avatar.jpg').split('.').pop();
    const safeName  = (nickname || 'avatar').replace(/[^a-zA-Z0-9]/g, '_');
    const filename  = `avatars/${safeName}_${timestamp}_${randId}.${ext}`;

    const fileBuffer = fs.readFileSync(avatarFile.filepath);

    const blob = await put(filename, fileBuffer, {
      access: 'public',
      contentType: avatarFile.mimetype,
    });

    fs.unlinkSync(avatarFile.filepath);

    console.log('✅ Avatar subido a Vercel Blob:', blob.url);

    return res.status(200).json({
      success: true,
      url: blob.url,
      filename,
    });

  } catch (error) {
    console.error('❌ Error uploading avatar:', error);
    return res.status(500).json({
      success: false,
      error: 'Error subiendo avatar',
      details: error.message,
    });
  }
}
