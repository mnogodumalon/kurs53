import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Raeume } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Plus, Pencil, Trash2, DoorOpen } from 'lucide-react';

const EMPTY: Raeume['fields'] = { raumname: '', gebaeude: '', kapazitaet: undefined };

export function RaeumeTab() {
  const [items, setItems] = useState<Raeume[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Raeume | null>(null);
  const [form, setForm] = useState<Raeume['fields']>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    LivingAppsService.getRaeume().then(setItems).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (r: Raeume) => { setEditing(r); setForm({ ...r.fields }); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await LivingAppsService.updateRaeumeEntry(editing.record_id, form);
      else await LivingAppsService.createRaeumeEntry(form);
      load(); setDialogOpen(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await LivingAppsService.deleteRaeumeEntry(deleteId); load(); setDeleteId(null); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Räume</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} Einträge</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus size={16} />Raum hinzufügen</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Lädt...</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
          <DoorOpen size={32} className="opacity-30" />
          <span>Noch keine Räume angelegt</span>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Raumname</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Gebäude</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kapazität</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((r, i) => (
                <tr key={r.record_id} className={`data-row ${i !== items.length - 1 ? 'border-b border-border' : ''}`}>
                  <td className="px-4 py-3 font-medium">{r.fields.raumname}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.fields.gebaeude || '—'}</td>
                  <td className="px-4 py-3">
                    {r.fields.kapazitaet != null ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-accent text-accent-foreground">
                        {r.fields.kapazitaet} Plätze
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(r)}><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(r.record_id)}><Trash2 size={14} /></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'Raum bearbeiten' : 'Raum hinzufügen'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label>Raumname *</Label><Input value={form.raumname || ''} onChange={e => setForm(f => ({ ...f, raumname: e.target.value }))} placeholder="Hörsaal A1" /></div>
            <div><Label>Gebäude</Label><Input value={form.gebaeude || ''} onChange={e => setForm(f => ({ ...f, gebaeude: e.target.value }))} placeholder="Hauptgebäude" /></div>
            <div><Label>Kapazität</Label><Input type="number" value={form.kapazitaet ?? ''} onChange={e => setForm(f => ({ ...f, kapazitaet: e.target.value ? Number(e.target.value) : undefined }))} placeholder="30" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={saving || !form.raumname}>{saving ? 'Speichert...' : 'Speichern'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        title="Raum löschen"
        description="Soll dieser Raum wirklich gelöscht werden?"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
