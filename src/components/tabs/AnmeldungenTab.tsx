import { useEffect, useState } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Anmeldungen, Teilnehmer, Kurse } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Plus, Pencil, Trash2, ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const EMPTY: Anmeldungen['fields'] = { teilnehmer: '', kurs: '', anmeldedatum: '', bezahlt: false };

export function AnmeldungenTab() {
  const [items, setItems] = useState<Anmeldungen[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Anmeldungen | null>(null);
  const [form, setForm] = useState<Anmeldungen['fields']>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      LivingAppsService.getAnmeldungen(),
      LivingAppsService.getTeilnehmer(),
      LivingAppsService.getKurse(),
    ]).then(([a, t, k]) => { setItems(a); setTeilnehmer(t); setKurse(k); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, anmeldedatum: format(new Date(), 'yyyy-MM-dd') });
    setDialogOpen(true);
  };
  const openEdit = (a: Anmeldungen) => {
    setEditing(a);
    const tId = extractRecordId(a.fields.teilnehmer);
    const kId = extractRecordId(a.fields.kurs);
    setForm({ ...a.fields, teilnehmer: tId || '', kurs: kId || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fields: Anmeldungen['fields'] = {
        ...form,
        teilnehmer: createRecordUrl(APP_IDS.TEILNEHMER, form.teilnehmer!),
        kurs: createRecordUrl(APP_IDS.KURSE, form.kurs!),
      };
      if (editing) await LivingAppsService.updateAnmeldungenEntry(editing.record_id, fields);
      else await LivingAppsService.createAnmeldungenEntry(fields);
      load(); setDialogOpen(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await LivingAppsService.deleteAnmeldungenEntry(deleteId); load(); setDeleteId(null); }
    finally { setDeleting(false); }
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    try { return format(new Date(d), 'd. MMM yyyy', { locale: de }); } catch { return d; }
  };

  const getTeilnehmerName = (url?: string) => {
    const id = extractRecordId(url);
    return teilnehmer.find(t => t.record_id === id)?.fields.name || '—';
  };
  const getKursTitel = (url?: string) => {
    const id = extractRecordId(url);
    return kurse.find(k => k.record_id === id)?.fields.titel || '—';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Anmeldungen</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} Einträge</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus size={16} />Anmeldung hinzufügen</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Lädt...</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
          <ClipboardList size={32} className="opacity-30" />
          <span>Noch keine Anmeldungen vorhanden</span>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Teilnehmer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kurs</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Anmeldedatum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bezahlt</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((a, i) => (
                <tr key={a.record_id} className={`data-row ${i !== items.length - 1 ? 'border-b border-border' : ''}`}>
                  <td className="px-4 py-3 font-medium">{getTeilnehmerName(a.fields.teilnehmer)}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{getKursTitel(a.fields.kurs)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(a.fields.anmeldedatum)}</td>
                  <td className="px-4 py-3">
                    {a.fields.bezahlt ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                        <CheckCircle2 size={12} />Ja
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ background: 'hsl(0 70% 95%)', color: 'hsl(0 70% 40%)' }}>
                        <XCircle size={12} />Nein
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(a)}><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(a.record_id)}><Trash2 size={14} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Anmeldung bearbeiten' : 'Anmeldung hinzufügen'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Teilnehmer *</Label>
              <Select value={form.teilnehmer || 'none'} onValueChange={v => setForm(f => ({ ...f, teilnehmer: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Teilnehmer wählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Bitte wählen</SelectItem>
                  {teilnehmer.map(t => <SelectItem key={t.record_id} value={t.record_id}>{t.fields.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kurs *</Label>
              <Select value={form.kurs || 'none'} onValueChange={v => setForm(f => ({ ...f, kurs: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Kurs wählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Bitte wählen</SelectItem>
                  {kurse.map(k => <SelectItem key={k.record_id} value={k.record_id}>{k.fields.titel}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Anmeldedatum *</Label><Input type="date" value={form.anmeldedatum || ''} onChange={e => setForm(f => ({ ...f, anmeldedatum: e.target.value }))} /></div>
            <div>
              <Label>Bezahlt</Label>
              <Select value={form.bezahlt ? 'ja' : 'nein'} onValueChange={v => setForm(f => ({ ...f, bezahlt: v === 'ja' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nein">Nein</SelectItem>
                  <SelectItem value="ja">Ja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={saving || !form.teilnehmer || !form.kurs || !form.anmeldedatum}>
              {saving ? 'Speichert...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        title="Anmeldung löschen"
        description="Soll diese Anmeldung wirklich gelöscht werden?"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
