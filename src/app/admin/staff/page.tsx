"use client";

import { useState } from "react";
import { Plus, Search, MoreHorizontal, Shield, Trash2, Pencil, KeyRound, Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useStaffStore, StaffMember } from "@/stores/staff";
import { toast } from "sonner";

export default function AdminStaffPage() {
  const { staff, addStaff, updateStaff, deleteStaff } = useStaffStore();
  const [search, setSearch] = useState("");
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState<Partial<StaffMember>>({
    name: "",
    role: "server",
    pin: "",
    active: true,
    email: "",
    phone: ""
  });

  // UI State
  const [showPin, setShowPin] = useState<Record<string, boolean>>({});

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      name: "",
      role: "server",
      pin: Math.floor(1000 + Math.random() * 9000).toString(), // Auto-generate PIN
      active: true,
      email: "",
      phone: ""
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (member: StaffMember) => {
    setEditingMember(member);
    setFormData({ ...member });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.pin) {
      toast.error("Le nom et le code PIN sont obligatoires");
      return;
    }

    if (formData.pin.length !== 4) {
      toast.error("Le code PIN doit faire 4 chiffres");
      return;
    }

    if (editingMember) {
      updateStaff(editingMember.id, formData);
      toast.success("Membre modifié");
    } else {
      addStaff({
        name: formData.name!,
        role: formData.role as any,
        pin: formData.pin!,
        active: formData.active || true,
        email: formData.email,
        phone: formData.phone,
        avatar: formData.name!.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      });
      toast.success("Nouveau membre ajouté");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) {
      deleteStaff(id);
      toast.success("Membre supprimé");
    }
  };

  const togglePinVisibility = (id: string) => {
    setShowPin(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Équipe</h2>
          <p className="text-muted-foreground mt-1">Gérez les accès serveurs et leurs codes PIN.</p>
        </div>
        <Button onClick={handleOpenAdd} className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Ajouter un membre
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un employé..." 
            className="pl-9 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <Card key={member.id} className={`rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group ${!member.active ? 'opacity-60' : ''}`}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-white dark:border-zinc-800 shadow-sm">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} />
                  <AvatarFallback>{member.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base font-bold">{member.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    {member.role === 'manager' ? <Shield className="w-3 h-3 text-primary" /> : <User className="w-3 h-3" />}
                    <span className="capitalize">{member.role === 'server' ? 'Serveur' : member.role}</span>
                  </CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -mr-2 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={() => handleOpenEdit(member)}>
                    <Pencil className="w-4 h-4 mr-2" /> Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(member.id)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-2">
                {/* PIN Display */}
                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 shadow-sm">
                      <KeyRound className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Code PIN</span>
                      <span className="font-mono font-bold text-lg tracking-widest">
                        {showPin[member.id] ? member.pin : "••••"}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full hover:bg-white dark:hover:bg-zinc-800"
                    onClick={() => togglePinVisibility(member.id)}
                  >
                    {showPin[member.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Badge variant={member.active ? "default" : "secondary"} className="rounded-md capitalize">
                    {member.active ? "Actif" : "Inactif"}
                  </Badge>
                  {member.phone && (
                    <span className="text-xs text-muted-foreground">{member.phone}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingMember ? "Modifier le membre" : "Nouveau membre"}</DialogTitle>
            <DialogDescription>
              Configurez l'accès et le code PIN du membre de l'équipe.
            </DialogDescription>
          </DialogHeader>
          
            <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input 
                id="name" 
                placeholder="Ex: Jean Dupont" 
                className="rounded-xl"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pin">Code PIN (4 chiffres)</Label>
              <div className="relative">
                <Input 
                  id="pin" 
                  maxLength={4}
                  className="rounded-xl font-mono text-center tracking-widest"
                  value={formData.pin}
                  onChange={(e) => setFormData({...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => setFormData({...formData, pin: Math.floor(1000 + Math.random() * 9000).toString()})}
                  title="Générer un PIN"
                >
                  <KeyRound className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Téléphone (Optionnel)</Label>
              <Input 
                id="phone" 
                placeholder="+225..." 
                className="rounded-xl"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
              <div className="space-y-0.5">
                <Label className="text-base">Compte Actif</Label>
                <p className="text-xs text-muted-foreground">Autoriser l'accès à l'application</p>
              </div>
              <Switch 
                checked={formData.active}
                onCheckedChange={(c) => setFormData({...formData, active: c})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button onClick={handleSave} className="rounded-xl bg-primary hover:bg-primary/90">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
