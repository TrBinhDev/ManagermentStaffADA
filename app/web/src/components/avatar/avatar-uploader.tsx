"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, Pencil, X, ZoomIn } from "lucide-react";

interface AvatarUploaderProps {
  avatarUrl?: string | null;
  fallbackText: string; // Chữ hiển thị khi chưa có avatar (thường là initials)
  size?: number; // px, mặc định 96
  editable?: boolean; // false thì chỉ hiển thị, không cho upload (dùng cho card list readonly)
  onUpload: (file: File) => Promise<string>; // Trả về avatarUrl mới sau khi upload xong
  onUploaded?: (url: string) => void; // Callback báo lên component cha (vd: đồng bộ vào store)
}

// Avatar tròn: click mở menu 2 lựa chọn (đổi ảnh / xem cỡ lớn), preview tức thì
// trước khi upload xong, spinner lúc đang gọi API, badge check-mark 2s sau khi
// thành công, và modal phóng to xem ảnh full khi chọn "Xem ảnh cỡ lớn".
export function AvatarUploader({
  avatarUrl,
  fallbackText,
  size = 96,
  editable = true,
  onUpload,
  onUploaded,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const displayUrl = preview ?? avatarUrl;

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Đóng lightbox bằng phím Esc
  useEffect(() => {
    if (!lightboxOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

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

  function handleAvatarClick() {
    if (!editable) {
      // Không cho sửa (card readonly) - click vẫn cho xem cỡ lớn nếu có ảnh
      if (displayUrl) setLightboxOpen(true);
      return;
    }
    setMenuOpen((v) => !v);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={handleAvatarClick}
          disabled={uploading}
          className="group relative block shrink-0 overflow-hidden rounded-full border border-border bg-muted disabled:cursor-not-allowed"
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
            <div
              className="flex size-full items-center justify-center font-medium text-muted-foreground"
              style={{ fontSize: size / 3 }}
            >
              {fallbackText}
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
            {uploading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <Camera className="size-6" />
            )}
          </div>

          {showSuccess && (
            <div className="absolute -bottom-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
              <Check className="size-4" />
            </div>
          )}
        </button>

        {menuOpen && (
          <div
            ref={menuRef}
            className="absolute left-1/2 top-full z-20 mt-2 w-48 -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-md"
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                inputRef.current?.click();
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Pencil className="size-4 shrink-0 text-muted-foreground" />
              Đổi ảnh đại diện
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setLightboxOpen(true);
              }}
              disabled={!displayUrl}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
              Xem ảnh cỡ lớn
            </button>
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

      {lightboxOpen && displayUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Đóng"
            className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- avatar tu R2 (domain ngoai) */}
          <img
            src={displayUrl}
            alt="Avatar cỡ lớn"
            className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
