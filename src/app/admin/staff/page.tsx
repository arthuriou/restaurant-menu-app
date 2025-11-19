"use client";

import { useState } from "react";
import { Plus, Search, MoreHorizontal, Mail, Phone, Shield, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock Data
const initialStaff = [
  { id: 1, name: "Jean Dupont", role: "Manager", email: "jean@restaurant.com", phone: "+225 07 07 07 07", status: "active", avatar: "JD" },
  { id: 2, name: "Marie Koné", role: "Serveur", email: "marie@restaurant.com", phone: "+225 05 05 05 05", status: "active", avatar: "MK" },
  { id: 3, name: "Paul Kouassi", role: "Cuisinier", email: "paul@restaurant.com", phone: "+225 01 01 01 01", status: "break", avatar: "PK" },
];

export default function AdminStaffPage() {
  const [staff] = useState(initialStaff);
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Équipe</h2>
          <p className="text-muted-foreground mt-1">Gérez les accès et les rôles de vos employés.</p>
        </div>
        <Button className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> Ajouter un membre
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un employé..." 
            className="pl-9 rounded-xl border-zinc-200 dark:border-zinc-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <Card key={member.id} className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} />
                  <AvatarFallback>{member.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base font-bold">{member.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Shield className="w-3 h-3 text-primary" />
                    {member.role}
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
                  <DropdownMenuItem>
                    <Pencil className="w-4 h-4 mr-2" /> Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm mt-2">
                <div className="flex items-center text-muted-foreground bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg">
                  <Mail className="w-4 h-4 mr-3 text-zinc-400" />
                  {member.email}
                </div>
                <div className="flex items-center text-muted-foreground bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg">
                  <Phone className="w-4 h-4 mr-3 text-zinc-400" />
                  {member.phone}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant={member.status === "active" ? "default" : "secondary"} className="rounded-md capitalize">
                  {member.status}
                </Badge>
                <span className="text-xs text-muted-foreground">Ajouté le 12 Nov</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
