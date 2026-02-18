import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Teilnehmer } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Plus, Pencil, Trash2, Mail, Phone, Users } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const EMPTY: Teilnehmer['fields'] = { name: '', email: '', telefon: '', geburtsdatum: '' };

export function TeilnehmerTab() {
  const [items, setItems] = useState<Teilnehmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Teilnehmer | null>(null);
  const [form, setForm] = useState<Teilnehmer['fields']>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    LivingAppsService.getTeilnehmer().then(setItems).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (t: Teilnehmer) => { setEditing(t); setForm({ ...t.fields }); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fields = { ...form };
      if (!fields.geburtsdatum) delete fields.geburtsdatum;
      if (editing) await LivingAppsService.updateTeilnehmerEntry(editing.record_id, fields);
      else await LivingAppsService.createTeilnehmerEntry(fields);
      load(); setDialogOpen(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await LivingAppsService.deleteTeilnehmerEntry(deleteId); load(); setDeleteId(null); }
    finally { setDeleting(false); }
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    try { return format(new Date(d), 'd. MMM yyyy', { locale: de }); } catch { return d; }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Teilnehmer</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} Einträge</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus size={16} />Teilnehmer hinzufügen</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Lädt...</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
          <Users size={32} className="opacity-30" />
          <span>Noch keine Teilnehmer angelegt</span>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">E-Mail</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Telefon</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Geburtsdatum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((t, i) => (
                <tr key={t.record_id} className={`data-row ${i !== items.length - 1 ? 'border-b border-border' : ''}`}>
                  <td className="px-4 py-3 font-medium">{t.fields.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.fields.email ? <span className="flex items-center gap-1.5"><Mail size={13} />{t.fields.email}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.fields.telefon ? <span className="flex items-center gap-1.5"><Phone size={13} />{t.fields.telefon}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(t.fields.geburtsdatum)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(t.record_id)}><Trash2 size={14} /></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'Teilnehmer bearbeiten' : 'Teilnehmer hinzufügen'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label>Name *</Label><Input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Anna Musterfrau" /></div>
            <div><Label>E-Mail</Label><Input value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="anna@beispiel.de" /></div>
            <div><Label>Telefon</Label><Input value={form.telefon || ''} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))} placeholder="+49 123 456789" /></div>
            <div><Label>Geburtsdatum</Label><Input type="date" value={form.geburtsdatum || ''} onChange={e => setForm(f => ({ ...f, geburtsdatum: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>{saving ? 'Speichert...' : 'Speichern'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        title="Teilnehmer löschen"
        description="Soll dieser Teilnehmer wirklich gelöscht werden?"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
