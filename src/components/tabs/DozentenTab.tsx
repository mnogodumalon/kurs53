import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Dozenten } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Plus, Pencil, Trash2, Mail, Phone, BookOpen } from 'lucide-react';

const EMPTY: Dozenten['fields'] = { name: '', email: '', telefon: '', fachgebiet: '' };

export function DozentenTab() {
  const [items, setItems] = useState<Dozenten[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Dozenten | null>(null);
  const [form, setForm] = useState<Dozenten['fields']>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    LivingAppsService.getDozenten().then(setItems).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (d: Dozenten) => { setEditing(d); setForm({ ...d.fields }); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await LivingAppsService.updateDozentenEntry(editing.record_id, form);
      else await LivingAppsService.createDozentenEntry(form);
      load();
      setDialogOpen(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await LivingAppsService.deleteDozentenEntry(deleteId); load(); setDeleteId(null); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Dozenten</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} Einträge</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={16} />Dozent hinzufügen
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Lädt...</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
          <BookOpen size={32} className="opacity-30" />
          <span>Noch keine Dozenten angelegt</span>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">E-Mail</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Telefon</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fachgebiet</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((d, i) => (
                <tr key={d.record_id} className={`data-row ${i !== items.length - 1 ? 'border-b border-border' : ''}`}>
                  <td className="px-4 py-3 font-medium">{d.fields.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {d.fields.email ? <span className="flex items-center gap-1.5"><Mail size={13} />{d.fields.email}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {d.fields.telefon ? <span className="flex items-center gap-1.5"><Phone size={13} />{d.fields.telefon}</span> : '—'}
                  </td>
                  <td className="px-4 py-3">{d.fields.fachgebiet || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(d)}><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(d.record_id)}><Trash2 size={14} /></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'Dozent bearbeiten' : 'Dozent hinzufügen'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label>Name *</Label><Input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dr. Max Mustermann" /></div>
            <div><Label>E-Mail</Label><Input value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="max@beispiel.de" /></div>
            <div><Label>Telefon</Label><Input value={form.telefon || ''} onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))} placeholder="+49 123 456789" /></div>
            <div><Label>Fachgebiet</Label><Input value={form.fachgebiet || ''} onChange={e => setForm(f => ({ ...f, fachgebiet: e.target.value }))} placeholder="Informatik" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>{saving ? 'Speichert...' : 'Speichern'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        title="Dozent löschen"
        description="Soll dieser Dozent wirklich gelöscht werden?"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
