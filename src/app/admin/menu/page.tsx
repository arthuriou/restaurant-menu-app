"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Search, Filter, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMenuStore } from "@/stores/menu";
import { toast } from "sonner";

export default function AdminMenuPage() {
  const { items, categories } = useMenuStore();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Mock data if store is empty
  const displayItems = items?.length > 0 ? items : [
    {
      id: "1",
      name: "Poulet Braisé",
      price: 4500,
      description: "Poulet mariné aux épices du chef",
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=2070&auto=format&fit=crop",
      available: true,
      categoryId: "cat_grill"
    },
    {
      id: "2",
      name: "Burger Classic",
      price: 3500,
      description: "Steak haché, cheddar, salade, tomate",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop",
      available: true,
      categoryId: "cat_burger"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Menu & Plats</h2>
          <p className="text-muted-foreground mt-1">Gérez votre carte, vos catégories et vos produits.</p>
        </div>
        <Button className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nouveau Plat
        </Button>
      </div>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
          <TabsTrigger value="items" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Plats</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Catégories</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un plat..." 
                className="pl-9 rounded-xl border-zinc-200 dark:border-zinc-800"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="rounded-xl border-zinc-200 dark:border-zinc-800">
              <Filter className="w-4 h-4 mr-2" /> Filtres
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayItems.map((item) => (
              <Card key={item.id} className="group overflow-hidden rounded-xl border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all">
                <div className="relative h-48 w-full bg-zinc-100">
                  {item.imageUrl ? (
                    <Image 
                      src={item.imageUrl} 
                      alt={item.name} 
                      fill 
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                  )}
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem>
                          <Pencil className="w-4 h-4 mr-2" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge variant={item.available ? "default" : "destructive"} className="rounded-md shadow-sm bg-white/90 text-black hover:bg-white backdrop-blur-sm">
                      {item.available ? "Disponible" : "Épuisé"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg truncate pr-2">{item.name}</h3>
                    <span className="font-bold text-primary whitespace-nowrap">{item.price.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 font-medium">
                      {categories.find(c => c.id === item.categoryId)?.name || "Grillades"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="rounded-xl border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Catégories</CardTitle>
                <CardDescription>Gérez l'ordre et l'affichage des catégories du menu.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                // Logic to add category would go here
                toast.info("Fonctionnalité d'ajout de catégorie à venir avec Firebase");
              }}>
                <Plus className="w-4 h-4 mr-2" /> Nouvelle Catégorie
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories?.length > 0 ? categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold">
                        {cat.order || 0}
                      </div>
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 text-muted-foreground">
                    Aucune catégorie définie.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Item Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un plat</DialogTitle>
            <DialogDescription>Créez un nouveau plat pour votre menu.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom du plat</Label>
              <Input id="name" placeholder="Ex: Burger Classic" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Description</Label>
              <Input id="desc" placeholder="Ingrédients, préparation..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Prix (FCFA)</Label>
                <Input id="price" type="number" placeholder="5000" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cat">Catégorie</Label>
                <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option>Grillades</option>
                  <option>Entrées</option>
                  <option>Boissons</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Plus className="w-8 h-8" />
                  <span className="text-sm">Cliquez pour ajouter une photo</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Options & Suppléments</Label>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                  <Input placeholder="Nom (ex: Supplément Fromage)" className="h-8 text-sm bg-white dark:bg-black" />
                  <Input placeholder="Prix" type="number" className="w-24 h-8 text-sm bg-white dark:bg-black" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Annuler</Button>
            <Button onClick={() => {
              toast.success("Plat ajouté avec succès");
              setIsAddOpen(false);
            }}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
