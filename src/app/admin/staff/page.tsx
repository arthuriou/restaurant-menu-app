"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Power, Shield, User, UtensilsCrossed, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";
import { StaffMember, Role } from "@/types";

export default function AdminStaffPage() {
  const { staff, loadStaff, addStaff, updateStaff, deleteStaff, isLoading } = useAuthStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  // Form states
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("server");
  const [pin, setPin] = useState("");

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleAdd = async () => {
    if (!name || !pin) {
      toast.error("Nom et PIN requis");
      return;
    }
    if (pin.length < 4) {
      toast.error("Le PIN doit faire au moins 4 caractères");
      return;
    }

    try {
      await addStaff({
        name,
        role,
        pin,
        active: true
      });
      toast.success("Membre ajouté");
      setIsAddOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleEdit = async () => {
    if (!selectedStaff) return;
    try {
      await updateStaff(selectedStaff.id, {
        name,
        role,
        pin: pin || selectedStaff.pin // Keep old pin if empty
      });
      toast.success("Membre mis à jour");
      setIsEditOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const toggleStatus = async (member: StaffMember) => {
    try {
      await updateStaff(member.id, { active: !member.active });
      toast.success(`Membre ${member.active ? 'désactivé' : 'activé'}`);
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const openEdit = (member: StaffMember) => {
    setSelectedStaff(member);
    setName(member.name);
    setRole(member.role);
    setPin(""); // Don't show PIN for security, only allow reset
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setName("");
    setRole("server");
    setPin("");
    setSelectedStaff(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Équipe</h2>
          <p className="text-muted-foreground mt-1">Gérez les accès de vos serveurs et cuisiniers.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="rounded-xl bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Ajouter un membre
        </Button>
      </div>

      <Card className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-200 dark:border-zinc-800">
                <TableHead className="font-semibold">Membre</TableHead>
                <TableHead className="font-semibold">Code PIN</TableHead>
                <TableHead className="font-semibold">Statut</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`}
                          alt={member.name}
                          className="w-full h-full"
                        />
                      </div>
                      <div>
                        <div className="font-semibold">{member.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {member.role === 'server' ? 'Serveur' : member.role === 'kitchen' ? 'Cuisine' : 'Admin'}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm">
                        {showPins[member.id] ? member.pin : '••••'}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowPins(prev => ({ ...prev, [member.id]: !prev[member.id] }))}
                      >
                        {showPins[member.id] ? 
                          <EyeOff className="w-4 h-4 text-muted-foreground" /> : 
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        }
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.active ? "default" : "secondary"} className={member.active ? "bg-green-500 hover:bg-green-600" : ""}>
                      {member.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => toggleStatus(member)} title={member.active ? "Désactiver" : "Activer"}>
                        <Power className={`w-4 h-4 ${member.active ? "text-green-500" : "text-muted-foreground"}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(member)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {staff.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Aucun membre dans l'équipe. Ajoutez-en un !
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Ajouter un membre</DialogTitle>
            <DialogDescription>Créez un profil pour un employé.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nom</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Michel" />
            </div>
            <div className="grid gap-2">
              <Label>Rôle</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="server">Serveur</SelectItem>
                  <SelectItem value="kitchen">Cuisine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Code PIN</Label>
              <Input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4 chiffres min" type="number" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Annuler</Button>
            <Button onClick={handleAdd}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Modifier le membre</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nom</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Rôle</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="server">Serveur</SelectItem>
                  <SelectItem value="kitchen">Cuisine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Nouveau Code PIN (Laisser vide pour garder l'actuel)</Label>
              <Input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" type="number" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Annuler</Button>
            <Button onClick={handleEdit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
