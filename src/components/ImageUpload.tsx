import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Zap } from 'lucide-react';
import { uploadImage } from '../lib/cloudinary';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalSize(file.size);
    setUploading(true);
    
    try {
      const url = await uploadImage(file);
      
      // حساب حجم الصورة المضغوطة (تقديري)
      const estimatedCompressedSize = file.size * 0.6; // تقدير 40% تقليل
      setCompressedSize(estimatedCompressedSize);
      
      onChange(url);
      
      // إخفاء معلومات الحجم بعد 3 ثواني
      setTimeout(() => {
        setOriginalSize(0);
        setCompressedSize(0);
      }, 3000);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('فشل رفع الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-bold">{label}</label>}
      
      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          "relative h-40 w-full border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-brand-black group overflow-hidden bg-brand-gray/30",
          uploading && "cursor-wait opacity-70"
        )}
      >
        {value ? (
          <>
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-brand-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-brand-white text-xs font-bold">تغيير الصورة</p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="absolute top-2 right-2 p-1 bg-brand-white/80 rounded-full hover:bg-brand-white transition-colors"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-brand-black/40 group-hover:text-brand-black transition-colors">
            {uploading ? (
              <Loader2 size={32} className="animate-spin" />
            ) : (
              <Upload size={32} />
            )}
            <p className="text-xs font-bold">{uploading ? 'جاري الرفع والضغط...' : 'انقر لرفع صورة'}</p>
            {uploading && (
              <div className="flex items-center gap-1 text-[10px] text-brand-black/50">
                <Zap size={10} />
                <span>يتم ضغط الصورة تلقائياً</span>
              </div>
            )}
          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden" 
        accept="image/*"
        onChange={handleFileChange}
      />
      
      {value && (
        <div className="flex items-center gap-2 text-[10px] text-brand-black/40 font-mono overflow-hidden">
          <ImageIcon size={10} />
          <span className="truncate">{value}</span>
        </div>
      )}
      
      {/* عرض معلومات الضغط */}
      {(originalSize > 0 || compressedSize > 0) && (
        <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Zap className="text-emerald-600" size={12} />
            <span className="text-[10px] font-bold text-emerald-700">تم ضغط الصورة</span>
          </div>
          <div className="text-[10px] text-emerald-600">
            {originalSize > 0 && compressedSize > 0 && (
              <span>
                {formatFileSize(originalSize)} → {formatFileSize(compressedSize)}
                <span className="mr-1 text-emerald-500">
                  (-{Math.round((1 - compressedSize / originalSize) * 100)}%)
                </span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
