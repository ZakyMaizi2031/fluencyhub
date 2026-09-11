"use client";

export function AdminFormDialog({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="admin-dialog-bg" onClick={onClose} role="presentation">
      <div className="admin-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <h2 className="mb-4 text-lg font-extrabold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
