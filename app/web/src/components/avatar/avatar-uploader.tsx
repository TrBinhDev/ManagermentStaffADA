"use client";

import { useRef, useState } from "react";
import { Camera, Check, Loader2 } from "lucide-react";

interface AvatarUploaderProps {
  avatarUrl?: string | null;
  fallbackText: string; // Chữ hiển thị khi chưa có avatar (thường là initials)
  size?: number; // px, mặc định 96
  editable?: boolean; // false thì chỉ hiển thị, không cho upload (dùng cho card list readonly)
  onUpload: (file: File) => Promise<string>; // Trả về avatarUrl mới sau khi upload xong
  onUploaded?: (url: string) => void; // Callback báo lên component cha (vd: đồng bộ vào store)
}

// Avatar tròn: click/hover để đổi ảnh, preview tức thì trước khi upload xong,
// hiện spinner lúc đang gọi API, và badge check-mark trong 2s sau khi thành công.
export function AvatarUploader({
  avatarUrl,
  fallbackText,
  size = 96,
  editable = true,
  onUpload,
  onUploaded,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    // Preview cục bộ ngay lập tức (chưa cần đợi upload xong) cho cảm giác mượt
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    try {
      const newUrl = await onUpload(file);
      onUploaded?.(newUrl);
      // Upload xong -> bỏ preview cục bộ để chuyển sang dùng avatarUrl thật
      // (prop mới truyền xuống từ store). Nếu không reset, preview blob cũ
      // sẽ mãi mãi che mất avatarUrl thật, khiến các nơi khác (Sidebar) tưởng
      // như không đồng bộ dù store đã update đúng.
      setPreview(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại");
      setPreview(null); // Rollback preview nếu upload lỗi, quay về avatar cũ
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const displayUrl = preview ?? avatarUrl;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="group relative shrink-0 overflow-hidden rounded-full border border-border bg-muted"
        style={{ width: size, height: size }}
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar tu R2 (domain ngoai), khong phai static asset noi bo
          <img
            src={displayUrl}
            alt="Avatar"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-lg font-medium text-muted-foreground">
            {fallbackText}
          </div>
        )}

        {editable && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            aria-label="Đổi ảnh đại diện"
            className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Camera className="size-5" />
            )}
          </button>
        )}

        {showSuccess && (
          <div className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
            <Check className="size-3.5" />
          </div>
        )}
      </div>

      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
