import CryptoJS from 'crypto-js';

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dua3y4qmf';
const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || '879598999976495';
const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET || 'dguJQx1yhSXopaaaPWgfuduAZrY';

// ضغط الصورة وتحسينها قبل الرفع
function compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
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

export async function uploadImage(file: File): Promise<string> {
  try {
    // ضغط الصورة قبل الرفع
    const compressedFile = await compressImage(file, 1200, 0.8);
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = CryptoJS.SHA1(`timestamp=${timestamp}${apiSecret}`).toString();

    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', apiKey);
    formData.append('signature', signature);
    
    // إضافة تحسينات Cloudinary
    formData.append('quality', 'auto:good'); // جودة تلقائية جيدة
    formData.append('fetch_format', 'auto'); // تنسيق تلقائي (webp عند الإمكان)
    formData.append('crop', 'limit'); // اقتصاص تلقائي
    formData.append('width', '1200'); // أقصى عرض

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to upload image');
    }

    const data = await response.json();
    
    // إرجاع رابط الصورة المحسنة مباشرة
    return data.secure_url;
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
