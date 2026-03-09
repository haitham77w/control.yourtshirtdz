import CryptoJS from 'crypto-js';

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dua3y4qmf';
const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || '879598999976495';
const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET || 'dguJQx1yhSXopaaaPWgfuduAZrY';

// ضغط الصورة وتحسينها قبل الرفع
function compressImage(file: File, maxWidth: number = 1000, quality: number = 0.7): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // حساب الأبعاد الجديدة مع الحفاظ على نسبة العرض إلى الارتفاع
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // رسم الصورة بالجودة المحددة
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // في حالة الفشل، نرجع الملف الأصلي
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => resolve(file); // في حالة خطأ في تحميل الصورة
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadImage(file: File): Promise<{ url: string; public_id: string }> {
  try {
    // ضغط الصورة قبل الرفع - 1000px عرض كافي وجودة 0.7 توفر مساحة كبيرة
    const compressedFile = await compressImage(file, 1000, 0.7);

    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = CryptoJS.SHA1(`timestamp=${timestamp}${apiSecret}`).toString();

    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    // إضافة تحسينات Cloudinary
    formData.append('quality', 'auto:good');
    formData.append('fetch_format', 'auto');
    formData.append('crop', 'limit');
    formData.append('width', '1000');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to upload image');
    }

    const data = await response.json();

    return {
      url: data.secure_url,
      public_id: data.public_id
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

// دالة للحصول على رابط الصورة المحسنة
export function getOptimizedImageUrl(url: string, width: number = 800, quality: number = 80): string {
  if (!url || !url.includes('cloudinary.com')) return url;

  // استخراج معرف الصورة من الرابط
  const urlParts = url.split('/');
  const imageId = urlParts[urlParts.length - 1].split('.')[0];
  const folderPath = urlParts.slice(-2, -1).join('/');

  return `https://res.cloudinary.com/${cloudName}/image/upload/q_${quality},w_${width},c_limit,f_auto/${folderPath}/${imageId}`;
}

export async function deleteImage(publicIdOrUrl: string): Promise<void> {
  if (!publicIdOrUrl) return;

  try {
    let publicId = publicIdOrUrl;

    // إذا كان المدخل رابط، نستخرج المعرف منه (للتوافق مع القديم)
    if (publicIdOrUrl.includes('cloudinary.com')) {
      const urlParts = publicIdOrUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      const imageId = lastPart.split('.')[0];

      const uploadIndex = urlParts.indexOf('upload');
      const folderParts = urlParts.slice(uploadIndex + 2, urlParts.length - 1);
      publicId = folderParts.length > 0
        ? `${folderParts.join('/')}/${imageId}`
        : imageId;
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = CryptoJS.SHA1(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).toString();

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Cloudinary delete error:', error);
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
}
