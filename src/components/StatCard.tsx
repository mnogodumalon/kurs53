interface Props {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
  sub?: string;
}

export function StatCard({ label, value, icon, accent, sub }: Props) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
          <p className="text-3xl font-bold tracking-tight" style={{ color: accent || 'var(--foreground)' }}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div
          className="flex items-center justify-center w-11 h-11 rounded-xl"
          style={{ background: accent ? `${accent}18` : 'var(--accent)', color: accent || 'var(--accent-foreground)' }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
