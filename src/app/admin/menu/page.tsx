"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Search, Filter, MoreHorizontal, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMenuStore } from "@/stores/menu";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminMenuPage() {
  const { 
    items, categories, 
    addCategory, updateCategory, deleteCategory,
    addItem, updateItem, deleteItem 
  } = useMenuStore();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Category Management State
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleSaveCategory = () => {
    if (!newCategoryName.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, { name: newCategoryName });
      toast.success("Catégorie mise à jour");
    } else {
      addCategory({ 
        name: newCategoryName, 
        order: categories.length + 1 
      });
      toast.success("Catégorie ajoutée");
    }
    setIsCategoryDialogOpen(false);
    setNewCategoryName("");
    setEditingCategory(null);
  };

  // Item Management State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState<any>({
    name: "",
    description: "",
    price: 0,
    categoryId: "",
    available: true,
    options: []
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setNewItem({
      name: "",
      description: "",
      price: 0,
      categoryId: categories[0]?.id || "",
      available: true,
      options: []
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setNewItem({ ...item });
    setIsAddOpen(true);
  };

  const handleSaveItem = () => {
    if (!newItem.name || !newItem.price || !newItem.categoryId) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    if (editingItem) {
      updateItem(editingItem.id, newItem);
      toast.success("Plat mis à jour");
    } else {
      addItem(newItem);
      toast.success("Plat ajouté");
    }
    setIsAddOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce plat ?")) {
      deleteItem(id);
      toast.success("Plat supprimé");
    }
  };

  // Mock data if store is empty
  const displayItems = items?.length > 0 ? items : [
    {
      id: "1",
      name: "Poulet Braisé",
      price: 4500,
      description: "Poulet mariné aux épices du chef, grillé lentement à la braise pour un goût fumé unique.",
      imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=2070&auto=format&fit=crop",
      available: true,
      categoryId: "cat_grill"
    },
    {
      id: "2",
      name: "Burger Classic",
      price: 3500,
      description: "Steak haché, cheddar, salade, tomate, oignons rouges dans un pain brioché.",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop",
      available: true,
      categoryId: "cat_burger"
    },
    {
      id: "3",
      name: "Steak Frites",
      price: 6500,
      description: "Bœuf tendre de première qualité, servi avec nos frites maison croustillantes.",
      imageUrl: "https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=2070&auto=format&fit=crop",
      available: false,
      categoryId: "cat_grill"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Menu & Plats
        </h2>
        <p className="text-muted-foreground mt-1">Gérez votre carte, vos catégories et vos produits.</p>
      </div>

      <Tabs defaultValue="items" className="space-y-8">
        <TabsList className="bg-transparent p-0 h-auto gap-6 border-b border-zinc-200 dark:border-zinc-800 w-full justify-start rounded-none">
          <TabsTrigger 
            value="items" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-zinc-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent px-4 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
          >
            Plats
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-zinc-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent px-4 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
          >
            Catégories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un plat..." 
                className="pl-9 rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <Filter className="w-4 h-4 mr-2" /> Filtres
            </Button>
            <Button 
              className="rounded-xl shadow-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all" 
              onClick={handleOpenAdd}
            >
              <Plus className="w-4 h-4 mr-2" /> Nouveau Plat
            </Button>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayItems.map((item) => (
              <div key={item.id} className="group relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                {/* Image Container */}
                <div className="relative h-64 w-full shrink-0">
                  <div className="absolute inset-0 rounded-t-3xl overflow-hidden z-0">
                    {item.imageUrl ? (
                      <Image 
                        src={item.imageUrl} 
                        alt={item.name} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-muted-foreground">No Image</div>
                    )}
                  </div>
                  
                  {/* Actions Menu - Always visible, cleaner style */}
                  <div className="absolute top-3 right-3 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          size="icon" 
                          className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border-0 shadow-sm transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => handleOpenEdit(item)}>
                          <Pencil className="w-4 h-4 mr-2" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Availability Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <Badge 
                      variant="secondary"
                      className={`rounded-full px-3 py-1 shadow-sm backdrop-blur-md border-0 ${
                        item.available 
                          ? 'bg-green-500/90 text-white hover:bg-green-600/90' 
                          : 'bg-black/60 text-white hover:bg-black/70'
                      }`}
                    >
                      {item.available ? (
                        <><Eye className="w-3 h-3 mr-1.5" /> Disponible</>
                      ) : (
                        <><EyeOff className="w-3 h-3 mr-1.5" /> Épuisé</>
                      )}
                    </Badge>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 leading-tight">{item.name}</h3>
                    <span className="font-bold text-primary text-lg whitespace-nowrap ml-2">
                      {item.price.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">FCFA</span>
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-auto">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {categories.find(c => c.id === item.categoryId)?.name || "Grillades"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Modifié il y a 2j
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Catégories</CardTitle>
                <CardDescription>Gérez l'ordre et l'affichage des catégories du menu.</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setEditingCategory(null);
                  setNewCategoryName("");
                  setIsCategoryDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Nouvelle Catégorie
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories?.length > 0 ? categories.sort((a, b) => a.order - b.order).map((cat) => (
                  <div 
                    key={cat.id} 
                    className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold shadow-md">
                        {cat.order || 0}
                      </div>
                      <span className="font-semibold">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-full"
                        onClick={() => {
                          setEditingCategory(cat);
                          setNewCategoryName(cat.name);
                          setIsCategoryDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => {
                          if (confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
                            deleteCategory(cat.id);
                            toast.success("Catégorie supprimée");
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-muted-foreground">
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
        <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingItem ? "Modifier le plat" : "Ajouter un plat"}</DialogTitle>
            <DialogDescription className="text-zinc-400">Configurez les détails de votre plat et ses options.</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1 grid gap-2">
                <Label htmlFor="name" className="text-zinc-300">Nom du plat</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Burger Classic" 
                  className="rounded-xl bg-zinc-900 border-zinc-800 focus:ring-primary"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                />
              </div>
              <div className="col-span-2 sm:col-span-1 grid gap-2">
                <Label htmlFor="price" className="text-zinc-300">Prix (FCFA)</Label>
                <Input 
                  id="price" 
                  type="number" 
                  placeholder="5000" 
                  className="rounded-xl bg-zinc-900 border-zinc-800 focus:ring-primary"
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="desc" className="text-zinc-300">Description</Label>
              <Input 
                id="desc" 
                placeholder="Ingrédients, préparation..." 
                className="rounded-xl bg-zinc-900 border-zinc-800 focus:ring-primary"
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cat" className="text-zinc-300">Catégorie</Label>
              <Select 
                value={newItem.categoryId} 
                onValueChange={(v) => setNewItem({...newItem, categoryId: v})}
              >
                <SelectTrigger className="w-full rounded-xl bg-zinc-900 border-zinc-800 focus:ring-primary">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Extras / Options Section */}
            <div className="space-y-3 border-t border-zinc-800 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300 text-base">Options & Suppléments</Label>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-lg border-zinc-700 text-xs h-7"
                  onClick={() => {
                    const currentOptions = newItem.options || [];
                    setNewItem({
                      ...newItem, 
                      options: [...currentOptions, { name: "", price: 0, type: "addon" }]
                    });
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Ajouter option
                </Button>
              </div>
              
              <div className="space-y-2">
                {(newItem.options || []).map((opt: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
                    <Input 
                      placeholder="Nom (ex: Sauce Blanche)" 
                      className="h-8 text-sm bg-zinc-900 border-zinc-700"
                      value={opt.name}
                      onChange={(e) => {
                        const newOpts = [...(newItem.options || [])];
                        newOpts[idx].name = e.target.value;
                        setNewItem({...newItem, options: newOpts});
                      }}
                    />
                    <Input 
                      type="number" 
                      placeholder="Prix" 
                      className="h-8 w-24 text-sm bg-zinc-900 border-zinc-700"
                      value={opt.price}
                      onChange={(e) => {
                        const newOpts = [...(newItem.options || [])];
                        newOpts[idx].price = parseInt(e.target.value) || 0;
                        setNewItem({...newItem, options: newOpts});
                      }}
                    />
                    <Select 
                      value={opt.type}
                      onValueChange={(v: any) => {
                        const newOpts = [...(newItem.options || [])];
                        newOpts[idx].type = v;
                        setNewItem({...newItem, options: newOpts});
                      }}
                    >
                      <SelectTrigger className="h-8 w-28 text-xs bg-zinc-900 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="addon">Supplément</SelectItem>
                        <SelectItem value="variant">Variante</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-red-500 hover:bg-red-950/30"
                      onClick={() => {
                        const newOpts = (newItem.options || []).filter((_: any, i: number) => i !== idx);
                        setNewItem({...newItem, options: newOpts});
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {(!newItem.options || newItem.options.length === 0) && (
                  <p className="text-xs text-zinc-500 italic text-center py-2">Aucune option configurée</p>
                )}
              </div>
            </div>

            {/* Image Upload Placeholder */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Image</Label>
              <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-6 text-center hover:bg-zinc-900 transition-colors cursor-pointer group">
                <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-white transition-colors">
                  <Plus className="w-8 h-8" />
                  <span className="text-sm">Cliquez pour ajouter une photo</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div>
                <Label htmlFor="available" className="text-base text-white">Disponibilité</Label>
                <p className="text-sm text-zinc-400">Le plat est-il disponible ?</p>
              </div>
              <Switch 
                id="available" 
                checked={newItem.available}
                onCheckedChange={(c) => setNewItem({...newItem, available: c})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl border-zinc-700 text-white hover:bg-zinc-800 hover:text-white">
              Annuler
            </Button>
            <Button onClick={handleSaveItem} className="rounded-xl bg-primary hover:bg-primary/90 text-white">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Modifiez le nom de la catégorie." : "Créez une nouvelle catégorie pour organiser votre menu."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cat-name">Nom de la catégorie</Label>
              <Input 
                id="cat-name" 
                placeholder="Ex: Entrées" 
                className="rounded-xl"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button onClick={handleSaveCategory} className="rounded-xl bg-primary hover:bg-primary/90">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
