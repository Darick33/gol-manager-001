import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  shape?: 'circle' | 'square';
  size?: number;
  placeholder?: string;
  folder?: string;
  uploadLabel?: string;
  onUpload?: (file: File) => Promise<string>;
}

export function ImageUpload({ value, onChange, shape = 'square', size = 72, placeholder, folder = 'general', uploadLabel, onUpload }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const radius = shape === 'circle' ? '50%' : 12;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB');
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const url = onUpload ? await onUpload(file) : await uploadToCloudinary(file, folder);
      onChange(url);
    } catch (e) {
      setError((e as Error).message ?? 'Error al subir');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          style={{
            width: size, height: size,
            borderRadius: radius,
            border: `2px dashed ${value ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.12)'}`,
            background: value ? 'transparent' : 'rgba(255,255,255,0.03)',
            cursor: uploading ? 'wait' : 'pointer',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <Loader2 size={20} color="#10b981" style={{ animation: 'spin 1s linear infinite' }} />
              {uploadLabel && (
                <span style={{ fontSize: 9, color: '#64748b', textAlign: 'center', lineHeight: 1.2, padding: '0 4px' }}>
                  {uploadLabel}
                </span>
              )}
            </div>
          ) : value ? (
            <img src={value} alt={placeholder ?? 'imagen'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <Camera size={20} color="#334155" />
              {placeholder && <span style={{ fontSize: 10, color: '#334155', textAlign: 'center', lineHeight: 1.2, padding: '0 6px' }}>{placeholder}</span>}
            </div>
          )}
        </button>

        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{
              position: 'absolute', top: -6, right: -6,
              width: 20, height: 20, borderRadius: '50%',
              background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0,
            }}
          >
            <X size={11} color="#94a3b8" />
          </button>
        )}
      </div>

      {error && (
        <span style={{ fontSize: 11, color: '#f87171' }}>{error}</span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
