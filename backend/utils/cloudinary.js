const path = require('path');
const { v2: cloudinary } = require('cloudinary');

const cloudinaryUrl = String(process.env.CLOUDINARY_URL || '').trim();
const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const apiKey = String(process.env.CLOUDINARY_API_KEY || '').trim();
const apiSecret = String(process.env.CLOUDINARY_API_SECRET || '').trim();

function isMaskedValue(value) {
  return /\*{3,}/.test(String(value || ''));
}

const hasCloudinaryConfig = Boolean(
  (cloudinaryUrl && !isMaskedValue(cloudinaryUrl)) || (cloudName && apiKey && apiSecret && !isMaskedValue(apiSecret))
);

if (hasCloudinaryConfig) {
  if (cloudinaryUrl && !isMaskedValue(cloudinaryUrl)) {
    cloudinary.config({
      secure: true,
    });
  } else {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }
}

function isCloudinaryEnabled() {
  return hasCloudinaryConfig;
}

function uploadImageBuffer(buffer, originalName = 'image') {
  if (!hasCloudinaryConfig) {
    throw new Error('Cloudinary is not configured');
  }
  if (!buffer) {
    throw new Error('File buffer is missing');
  }

  const ext = path.extname(originalName || '').replace('.', '') || 'jpg';
  const folder = process.env.CLOUDINARY_FOLDER || 'fms';

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        format: ext.toLowerCase(),
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function deleteCloudinaryAssetByUrl(url) {
  if (!hasCloudinaryConfig || !url || typeof url !== 'string') return;
  if (!/^https?:\/\//i.test(url)) return;
  if (!url.includes('res.cloudinary.com')) return;

  const publicId = extractPublicId(url);
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    // Best-effort cleanup; ignore delete failures.
  }
}

function extractPublicId(url) {
  // Matches: /upload/v123/folder/file.ext and /upload/folder/file.ext
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+(?:\?.*)?$/);
  if (!match || !match[1]) return '';
  return decodeURIComponent(match[1]);
}

module.exports = {
  isCloudinaryEnabled,
  uploadImageBuffer,
  deleteCloudinaryAssetByUrl,
};
