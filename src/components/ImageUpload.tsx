import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Zap, Plus } from 'lucide-react';
import { uploadImage } from '../lib/cloudinary';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  urls: string[];
  publicIds: string[];
  onChange: (urls: string[], publicIds: string[]) => void;
  label?: string;
}

export default function ImageUpload({ urls, publicIds, onChange, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const newUrls = [...urls];
      const newPublicIds = [...publicIds];

      for (let i = 0; i < files.length; i++) {
        const { url, public_id } = await uploadImage(files[i]);
        newUrls.push(url);
        newPublicIds.push(public_id);
      }

      onChange(newUrls, newPublicIds);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('فشل رفع بعض الصور. يرجى المحاولة مرة أخرى.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index);
    const newPublicIds = publicIds.filter((_, i) => i !== index);
    onChange(newUrls, newPublicIds);
  };

  return (
    <div className="space-y-4">
      {label && <label className="text-sm font-bold">{label}</label>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* عرض الصور المرفوعة */}
        {urls.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-brand-border group">
            <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-brand-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="p-2 bg-rose-500 text-brand-white rounded-full hover:bg-rose-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}

        {/* زر الإضافة */}
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={cn(
            "relative aspect-square border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-brand-black group bg-brand-gray/30",
            uploading && "cursor-wait opacity-70"
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-brand-black/40">
              <Loader2 size={24} className="animate-spin" />
              <p className="text-[10px] font-bold">جاري الرفع...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-brand-black/40 group-hover:text-brand-black transition-colors">
              <Plus size={24} />
              <p className="text-[10px] font-bold">إضافة صور</p>
            </div>
          )}

          {uploading && (
            <div className="absolute bottom-2 flex items-center gap-1 text-[8px] text-brand-black/50">
              <Zap size={8} />
              <span>يتم الضغط تلقائياً</span>
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />

      <p className="text-xs text-brand-black/40">
        يمكنك رفع عدة صور للمنتج. يتم ضغط الصور تلقائياً للحفاظ على سرعة المتجر.
      </p>
    </div>
  );
}
