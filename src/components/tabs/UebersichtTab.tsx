import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Kurse, Anmeldungen } from '@/types/app';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { GraduationCap, Users, CheckCircle2, BookOpen, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function UebersichtTab() {
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      LivingAppsService.getKurse(),
      LivingAppsService.getAnmeldungen(),
    ]).then(([k, a]) => { setKurse(k); setAnmeldungen(a); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Lädt...</div>;

  const aktiveKurse = kurse.filter(k => k.fields.status === 'aktiv').length;
  const bezahlte = anmeldungen.filter(a => a.fields.bezahlt).length;
  const umsatz = kurse.reduce((sum, k) => {
    const kursAnmeldungen = anmeldungen.filter(a => a.fields.kurs?.includes(k.record_id));
    const bezahltCount = kursAnmeldungen.filter(a => a.fields.bezahlt).length;
    return sum + (k.fields.preis || 0) * bezahltCount;
  }, 0);

  // Status distribution for chart
  const statusData = [
    { name: 'Geplant', count: kurse.filter(k => k.fields.status === 'geplant').length, color: 'hsl(245 70% 50%)' },
    { name: 'Aktiv', count: kurse.filter(k => k.fields.status === 'aktiv').length, color: 'hsl(152 55% 45%)' },
    { name: 'Abgeschlossen', count: kurse.filter(k => k.fields.status === 'abgeschlossen').length, color: 'hsl(240 12% 55%)' },
    { name: 'Abgesagt', count: kurse.filter(k => k.fields.status === 'abgesagt').length, color: 'hsl(0 70% 50%)' },
  ].filter(d => d.count > 0);

  // Upcoming courses
  const today = new Date();
  const upcoming = kurse
    .filter(k => k.fields.startdatum && new Date(k.fields.startdatum) >= today)
    .sort((a, b) => (a.fields.startdatum || '').localeCompare(b.fields.startdatum || ''))
    .slice(0, 5);

  const formatDate = (d?: string) => {
    if (!d) return '—';
    try { return format(new Date(d), 'd. MMM yyyy', { locale: de }); } catch { return d; }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Übersicht</h2>
        <p className="text-sm text-muted-foreground">Alle wichtigen Kennzahlen auf einen Blick</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Kurse gesamt"
          value={kurse.length}
          icon={<BookOpen size={20} />}
          accent="hsl(245 70% 40%)"
        />
        <StatCard
          label="Aktive Kurse"
          value={aktiveKurse}
          icon={<GraduationCap size={20} />}
          accent="hsl(152 55% 38%)"
          sub="Gerade laufend"
        />
        <StatCard
          label="Anmeldungen"
          value={anmeldungen.length}
          icon={<Users size={20} />}
          accent="hsl(200 70% 40%)"
          sub={`${bezahlte} bezahlt`}
        />
        <StatCard
          label="Umsatz"
          value={`${umsatz.toLocaleString('de-DE', { minimumFractionDigits: 0 })} €`}
          icon={<TrendingUp size={20} />}
          accent="hsl(38 90% 42%)"
          sub="Aus Zahlungen"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming courses */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-primary" />
            <h3 className="font-semibold text-sm">Kommende Kurse</h3>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine kommenden Kurse</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map(k => (
                <div key={k.record_id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{k.fields.titel}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(k.fields.startdatum)}</p>
                  </div>
                  <StatusBadge status={k.fields.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status distribution */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={16} className="text-primary" />
            <h3 className="font-semibold text-sm">Kurs-Status Verteilung</h3>
          </div>
          {statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Kurse angelegt</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={statusData} barSize={36}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(240 12% 52%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(240 12% 52%)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(240 15% 90%)', borderRadius: '8px', fontSize: 12 }}
                  cursor={{ fill: 'hsl(245 60% 97%)' }}
                />
                <Bar dataKey="count" name="Kurse" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent registrations */}
      {anmeldungen.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-primary" />
            <h3 className="font-semibold text-sm">Letzte Anmeldungen</h3>
          </div>
          <div className="space-y-0">
            {anmeldungen.slice(-5).reverse().map((a, i) => (
              <div key={a.record_id} className={`flex items-center justify-between py-2.5 ${i !== Math.min(4, anmeldungen.length - 1) ? 'border-b border-border' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-primary" style={{ background: 'var(--accent)' }}>
                    {String(i + 1)}
                  </div>
                  <p className="text-sm">{formatDate(a.fields.anmeldedatum)}</p>
                </div>
                {a.fields.bezahlt ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                    <CheckCircle2 size={11} />Bezahlt
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ background: 'hsl(38 90% 95%)', color: 'var(--warning)' }}>
                    Ausstehend
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
