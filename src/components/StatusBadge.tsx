const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  geplant:       { label: 'Geplant',        cls: 'badge-geplant' },
  aktiv:         { label: 'Aktiv',           cls: 'badge-aktiv' },
  abgeschlossen: { label: 'Abgeschlossen',   cls: 'badge-abgeschlossen' },
  abgesagt:      { label: 'Abgesagt',        cls: 'badge-abgesagt' },
};

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>;
  const s = STATUS_MAP[status] ?? { label: status, cls: 'badge-geplant' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
