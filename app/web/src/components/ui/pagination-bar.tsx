import { Button } from "@/components/ui/button";

interface PaginationBarProps {
  page: number;
  total: number;
  limit: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}

export function PaginationBar({ page, total, limit, itemLabel, onPageChange }: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Trang {page} / {totalPages} — {total} {itemLabel}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}
