import { useEffect, useState } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Kurse, Dozenten, Raeume } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { StatusBadge } from '@/components/StatusBadge';
import { Plus, Pencil, Trash2, GraduationCap, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const EMPTY: Kurse['fields'] = { titel: '', beschreibung: '', startdatum: '', enddatum: '', max_teilnehmer: undefined, preis: undefined, dozent: undefined, raum: undefined, status: 'geplant' };

export function KurseTab() {
  const [items, setItems] = useState<Kurse[]>([]);
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Kurse | null>(null);
  const [form, setForm] = useState<Kurse['fields']>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      LivingAppsService.getKurse(),
      LivingAppsService.getDozenten(),
      LivingAppsService.getRaeume(),
    ]).then(([k, d, r]) => { setItems(k); setDozenten(d); setRaeume(r); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (k: Kurse) => {
    setEditing(k);
    const dozentId = extractRecordId(k.fields.dozent);
    const raumId = extractRecordId(k.fields.raum);
    setForm({
      ...k.fields,
      dozent: dozentId || undefined,
      raum: raumId || undefined,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fields: Kurse['fields'] = { ...form };
      if (fields.dozent) fields.dozent = createRecordUrl(APP_IDS.DOZENTEN, fields.dozent);
      else delete fields.dozent;
      if (fields.raum) fields.raum = createRecordUrl(APP_IDS.RAEUME, fields.raum);
      else delete fields.raum;
      if (!fields.enddatum) delete fields.enddatum;
      if (!fields.beschreibung) delete fields.beschreibung;

      if (editing) await LivingAppsService.updateKurseEntry(editing.record_id, fields);
      else await LivingAppsService.createKurseEntry(fields);
      load(); setDialogOpen(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await LivingAppsService.deleteKurseEntry(deleteId); load(); setDeleteId(null); }
    finally { setDeleting(false); }
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    try { return format(new Date(d), 'd. MMM yyyy', { locale: de }); } catch { return d; }
  };

  const getDozentName = (url?: string) => {
    const id = extractRecordId(url);
    return dozenten.find(d => d.record_id === id)?.fields.name || '—';
  };
  const getRaumName = (url?: string) => {
    const id = extractRecordId(url);
    return raeume.find(r => r.record_id === id)?.fields.raumname || '—';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Kurse</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} Einträge</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus size={16} />Kurs hinzufügen</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Lädt...</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
          <GraduationCap size={32} className="opacity-30" />
          <span>Noch keine Kurse angelegt</span>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Titel</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Zeitraum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dozent</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Raum</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Preis</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((k, i) => (
                <tr key={k.record_id} className={`data-row ${i !== items.length - 1 ? 'border-b border-border' : ''}`}>
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{k.fields.titel}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(k.fields.startdatum)}</span>
                    {k.fields.enddatum && <span className="text-xs mt-0.5 block">bis {formatDate(k.fields.enddatum)}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{getDozentName(k.fields.dozent)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{getRaumName(k.fields.raum)}</td>
                  <td className="px-4 py-3 font-medium">
                    {k.fields.preis != null ? `${k.fields.preis.toFixed(2)} €` : '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={k.fields.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(k)}><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(k.record_id)}><Trash2 size={14} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Kurs bearbeiten' : 'Kurs hinzufügen'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div><Label>Titel *</Label><Input value={form.titel || ''} onChange={e => setForm(f => ({ ...f, titel: e.target.value }))} placeholder="Python Grundlagen" /></div>
            <div><Label>Beschreibung</Label><Textarea value={form.beschreibung || ''} onChange={e => setForm(f => ({ ...f, beschreibung: e.target.value }))} placeholder="Kurzbeschreibung des Kurses..." rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Startdatum *</Label><Input type="date" value={form.startdatum || ''} onChange={e => setForm(f => ({ ...f, startdatum: e.target.value }))} /></div>
              <div><Label>Enddatum</Label><Input type="date" value={form.enddatum || ''} onChange={e => setForm(f => ({ ...f, enddatum: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Max. Teilnehmer</Label><Input type="number" value={form.max_teilnehmer ?? ''} onChange={e => setForm(f => ({ ...f, max_teilnehmer: e.target.value ? Number(e.target.value) : undefined }))} placeholder="20" /></div>
              <div><Label>Preis (€)</Label><Input type="number" step="0.01" value={form.preis ?? ''} onChange={e => setForm(f => ({ ...f, preis: e.target.value ? Number(e.target.value) : undefined }))} placeholder="299.00" /></div>
            </div>
            <div>
              <Label>Dozent</Label>
              <Select value={form.dozent || 'none'} onValueChange={v => setForm(f => ({ ...f, dozent: v === 'none' ? undefined : v }))}>
                <SelectTrigger><SelectValue placeholder="Dozent wählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Dozent</SelectItem>
                  {dozenten.map(d => <SelectItem key={d.record_id} value={d.record_id}>{d.fields.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Raum</Label>
              <Select value={form.raum || 'none'} onValueChange={v => setForm(f => ({ ...f, raum: v === 'none' ? undefined : v }))}>
                <SelectTrigger><SelectValue placeholder="Raum wählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Raum</SelectItem>
                  {raeume.map(r => <SelectItem key={r.record_id} value={r.record_id}>{r.fields.raumname}{r.fields.gebaeude ? ` (${r.fields.gebaeude})` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status || 'geplant'} onValueChange={v => setForm(f => ({ ...f, status: v as Kurse['fields']['status'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="geplant">Geplant</SelectItem>
                  <SelectItem value="aktiv">Aktiv</SelectItem>
                  <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
                  <SelectItem value="abgesagt">Abgesagt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={saving || !form.titel || !form.startdatum}>{saving ? 'Speichert...' : 'Speichern'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        title="Kurs löschen"
        description="Soll dieser Kurs wirklich gelöscht werden?"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
