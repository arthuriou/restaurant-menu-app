"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Plus, Search, Filter, MoreHorizontal, Pencil, Trash2, Eye, EyeOff, Image as ImageIcon } from "lucide-react";
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
import { CldUploadWidget } from 'next-cloudinary';
import { FeaturedItemsManager } from "@/components/admin/FeaturedItemsManager";
import { MediaPickerDialog } from "@/components/admin/media/MediaPickerDialog";

export default function AdminMenuPage() {
  const { 
    items, categories, 
    addCategory, updateCategory, deleteCategory,
    addItem, updateItem, deleteItem 
  } = useMenuStore();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  
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
    options: [],
    recommendations: []
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setNewItem({
      name: "",
      description: "",
      price: 0,
      categoryId: categories[0]?.id || "",
      available: true,
      options: [],
      recommendations: []
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setNewItem({
      name: item.name || "",
      price: item.price || 0,
      description: item.description || "",
      categoryId: item.categoryId || "",
      imageUrl: item.imageUrl || "",
      available: item.available ?? true,
      featured: item.featured ?? false,
      featuredOrder: item.featuredOrder,
      options: item.options || [],
      recommendations: item.recommendations || [],
      // Ensure specific fields are carried over
      id: item.id
    });
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

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'restaurant_menu');

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();
      
      if (data.secure_url) {
        setNewItem({ ...newItem, imageUrl: data.secure_url });
        toast.success("Image téléversée avec succès !");
      } else {
        console.error("Cloudinary error:", data);
        toast.error("Erreur d'upload. Vérifiez le preset 'restaurant_menu'.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'envoi de l'image.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Option Image Upload Logic
  const [uploadingOptionIndex, setUploadingOptionIndex] = useState<number | null>(null);
  const optionFileInputRef = useRef<HTMLInputElement>(null);

  const handleOptionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingOptionIndex === null) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'restaurant_menu');

    // Debug file
    console.log("File to upload:", file.name, file.type, file.size);

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      
      if (!cloudName) {
        toast.error("Config: Cloud Name manquant");
        return;
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();

      if (!response.ok) {
        console.error("Cloudinary Error:", data);
        const errorMsg = data.error?.message || "Erreur inconnue";
        toast.error(`Erreur Upload: ${errorMsg}`);
        return;
      }

      if (data.secure_url) {
        const newOpts = [...(newItem.options || [])];
        newOpts[uploadingOptionIndex].imageUrl = data.secure_url;
        setNewItem({...newItem, options: newOpts});
        toast.success("Image d'option ajoutée !");
      } else {
        toast.error("Erreur: Pas d'URL reçue");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur réseau lors de l'upload");
    } finally {
      setIsUploading(false);
      setUploadingOptionIndex(null);
      if (optionFileInputRef.current) optionFileInputRef.current.value = '';
    }
  };

  // Display Items
  const displayItems = items || [];

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
        <TabsList className="bg-transparent p-0 h-auto gap-6 border-b border-border w-full justify-start rounded-none">
          <TabsTrigger 
            value="items" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
          >
            Plats
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
          >
            Catégories
          </TabsTrigger>
          <TabsTrigger 
            value="featured" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-4 py-3 text-muted-foreground data-[state=active]:text-foreground shadow-none transition-none"
          >
            Items Vedettes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un plat..." 
                className="pl-9 rounded-xl bg-card border-border shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button 
              className="rounded-xl shadow-lg" 
              onClick={handleOpenAdd}
            >
              <Plus className="w-4 h-4 mr-2" /> Nouveau Plat
            </Button>
          </div>

          {/* Menu Items Grid - Horizontal Style */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayItems.map((item) => (
              <div key={item.id} className="group relative bg-card rounded-[2rem] p-3 border border-border shadow-sm hover:shadow-md transition-all duration-300 flex gap-4 items-center">
                
                {/* Image Container - Left Side */}
                <div className="relative h-24 w-24 shrink-0">
                  <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden bg-secondary">
                    {item.imageUrl ? (
                      <Image 
                        src={item.imageUrl} 
                        alt={item.name} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  
                  {/* Availability Indicator (Small dot) */}
                  <div className={`absolute top-2 left-2 w-3 h-3 rounded-full border-2 border-card ${item.available ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                
                {/* Content - Middle */}
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-base text-foreground truncate pr-2">{item.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">
                        {item.description || "Aucune description"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 bg-secondary text-secondary-foreground border-0">
                      {categories.find(c => c.id === item.categoryId)?.name || "Autre"}
                    </Badge>
                    <span className="font-bold text-sm">
                      {item.price.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">FCFA</span>
                    </span>
                  </div>
                </div>

                {/* Actions - Right Side */}
                <div className="flex flex-col gap-2 pr-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => handleOpenEdit(item)}>
                        <Pencil className="w-4 h-4 mr-2" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        // Toggle availability
                        updateItem(item.id, { available: !item.available });
                        toast.success(item.available ? "Plat marqué comme épuisé" : "Plat marqué comme disponible");
                      }}>
                        {item.available ? (
                          <><EyeOff className="w-4 h-4 mr-2" /> Marquer épuisé</>
                        ) : (
                          <><Eye className="w-4 h-4 mr-2" /> Marquer disponible</>
                        )}
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
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="rounded-2xl border-border bg-card shadow-lg">
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
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border hover:shadow-md transition-shadow"
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

        <TabsContent value="featured" className="space-y-6">
          <Card className="rounded-xl border-border shadow-sm">
            <CardHeader>
              <CardTitle>Items Vedettes (Spécialités du Chef)</CardTitle>
              <CardDescription>
                Sélectionnez et organisez les plats mis en avant sur la page d'accueil.
                Activez "Item Vedette" dans l'onglet Plats pour ajouter des items ici.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeaturedItemsManager
                items={items.filter(item => item.featured === true).sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0))}
                onReorder={(reorderedItems) => {
                  // Update featuredOrder for each item
                  reorderedItems.forEach((item, index) => {
                    updateItem(item.id, { featuredOrder: index });
                  });
                  toast.success("Ordre mis à jour");
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Item Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingItem ? "Modifier le plat" : "Ajouter un plat"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Configurez les détails de votre plat et ses options.</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1 grid gap-2">
                <Label htmlFor="name">Nom du plat</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Burger Classic" 
                  className="rounded-xl bg-input border-border"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                />
              </div>
              <div className="col-span-2 sm:col-span-1 grid gap-2">
                <Label htmlFor="price">Prix (FCFA)</Label>
                <Input 
                  id="price" 
                  type="number" 
                  placeholder="5000" 
                  className="rounded-xl bg-input border-border"
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="desc">Description</Label>
              <Input 
                id="desc" 
                placeholder="Ingrédients, préparation..." 
                className="rounded-xl bg-input border-border"
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cat">Catégorie</Label>
              <Select 
                value={newItem.categoryId} 
                onValueChange={(v) => setNewItem({...newItem, categoryId: v})}
              >
                <SelectTrigger className="w-full rounded-xl bg-input border-border">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-xl">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Extras / Options Section */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Options & Suppléments</Label>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-lg text-xs h-7"
                  onClick={() => {
                    const currentOptions = newItem.options || [];
                    setNewItem({
                      ...newItem, 
                      options: [...currentOptions, { name: "", price: 0, type: "addon", imageUrl: "", description: "" }]
                    });
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Ajouter option
                </Button>
              </div>
              
              <div className="space-y-3">
                {/* Hidden Input for Options Upload */}
                <input 
                  type="file" 
                  ref={optionFileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleOptionImageUpload}
                />

                {(newItem.options || []).map((opt: any, idx: number) => (
                  <div key={idx} className="bg-secondary/50 p-3 rounded-lg border border-border space-y-2">
                    {/* Row 1: Name, Price, Type*/}
                    <div className="flex items-center gap-2">
                      <Input 
                        placeholder="Nom (ex: Sauce Blanche)" 
                        className="h-8 text-sm bg-input border-border flex-1"
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
                        className="h-8 w-24 text-sm bg-input border-border"
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
                        <SelectTrigger className="h-8 w-28 text-xs bg-input border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="addon">Supplément</SelectItem>
                          <SelectItem value="variant">Variante</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 hover:text-red-600 shrink-0"
                        onClick={() => {
                          const newOpts = (newItem.options || []).filter((_: any, i: number) => i !== idx);
                          setNewItem({...newItem, options: newOpts});
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Row 2: Image Upload & Preview */}
                    <div className="flex items-center gap-2">
                      <div className="relative w-16 h-16 rounded-lg border border-border bg-secondary overflow-hidden shrink-0">
                        {opt.imageUrl ? (
                          <Image 
                            src={opt.imageUrl} 
                            alt={opt.name || "Option"} 
                            fill 
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            {isUploading && uploadingOptionIndex === idx ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground"></div>
                            ) : (
                              <ImageIcon className="w-6 h-6" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-8 text-xs shrink-0"
                          disabled={isUploading}
                          onClick={() => {
                            setUploadingOptionIndex(idx);
                            // Petit timeout pour s'assurer que le state est mis à jour avant le click (bien que React batch, c'est plus sûr avec le ref)
                            setTimeout(() => optionFileInputRef.current?.click(), 0);
                          }}
                        >
                          <ImageIcon className="w-3 h-3 mr-1" />
                          {opt.imageUrl ? 'Changer image' : 'Ajouter image'}
                        </Button>
                        {opt.imageUrl && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-red-500 hover:bg-red-950/30"
                            onClick={() => {
                              const newOpts = [...(newItem.options || [])];
                              newOpts[idx].imageUrl = '';
                              setNewItem({...newItem, options: newOpts});
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Row 3: Description */}
                    <Input 
                      placeholder="Description (optionnel)" 
                      className="h-8 text-xs bg-input border-border w-full"
                      value={opt.description || ''}
                      onChange={(e) => {
                        const newOpts = [...(newItem.options || [])];
                        newOpts[idx].description = e.target.value;
                        setNewItem({...newItem, options: newOpts});
                      }}
                    />
                  </div>
                ))}
                {(!newItem.options || newItem.options.length === 0) && (
                  <p className="text-xs text-muted-foreground italic text-center py-2">Aucune option configurée</p>
                )}
              </div>
            </div>

            {/* Recommendations Section */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Suggestions d'accompagnement</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setNewItem({
                      ...newItem, 
                      recommendations: [...(newItem.recommendations || []), '']
                    });
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Ajouter
                </Button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {newItem.recommendations?.map((recId: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border">
                    <Select
                      value={recId}
                      onValueChange={(value) => {
                        const newRecs = [...(newItem.recommendations || [])];
                        newRecs[idx] = value;
                        setNewItem({...newItem, recommendations: newRecs});
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-input border-border flex-1">
                        <SelectValue placeholder="Sélectionner un produit" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {items.map(menuItem => (
                          <SelectItem key={menuItem.id} value={menuItem.id} className="text-xs">
                            {menuItem.name} - {menuItem.price} FCFA
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-950/30 shrink-0"
                      onClick={() => {
                        const newRecs = newItem.recommendations.filter((_: any, i: number) => i !== idx);
                        setNewItem({...newItem, recommendations: newRecs});
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {(!newItem.recommendations || newItem.recommendations.length === 0) && (
                  <p className="text-xs text-muted-foreground italic text-center py-2">Aucune recommandation configurée</p>
                )}
              </div>
            </div>



            {/* Image Upload Native */}
            <div className="space-y-3 border-t border-border pt-4">
              <Label>Image du plat</Label>
              
              <div className="flex gap-4 items-start">
                {/* Preview Box */}
                <div className="relative w-32 h-32 rounded-xl border border-border bg-secondary overflow-hidden shrink-0">
                  {newItem.imageUrl ? (
                    <Image 
                      src={newItem.imageUrl} 
                      alt="Preview" 
                      fill 
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground"></div>
                      ) : (
                        <ImageIcon className="w-8 h-8 opacity-50" />
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-1 space-y-3">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full"
                    >
                        {isUploading ? (
                        <>Envoi...</>
                        ) : (
                        <><Plus className="w-4 h-4 mr-2" /> Upload</>
                        )}
                    </Button>

                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsMediaPickerOpen(true)}
                        className="w-full"
                    >
                        <ImageIcon className="w-4 h-4 mr-2" /> Galerie
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">ou URL</span>
                    </div>
                  </div>

                  <Input 
                    placeholder="https://..." 
                    className="bg-input border-border text-sm"
                    value={newItem.imageUrl || ''}
                    onChange={(e) => setNewItem({...newItem, imageUrl: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Promotion Section */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Promotion</Label>
                {!newItem.promotion && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const now = Date.now();
                      setNewItem({
                        ...newItem, 
                        promotion: {
                          price: Math.round(newItem.price * 0.85),
                          startDate: now,
                          endDate: now + (7 * 24 * 60 * 60 * 1000) // 1 semaine
                        }
                      });
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Ajouter promo
                  </Button>
                )}
              </div>

              {newItem.promotion && (
                <div className="p-3 rounded-lg bg-green-500/10 dark:bg-green-950/30 border border-green-500/30 dark:border-green-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-green-600 dark:text-green-400 text-sm font-medium">Promotion active</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-red-500 hover:bg-red-500/10 dark:hover:bg-red-950/30"
                      onClick={() => setNewItem({...newItem, promotion: undefined})}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Prix original</Label>
                      <div className="text-sm text-muted-foreground line-through">{newItem.price} FCFA</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Prix promo</Label>
                      <Input 
                        type="number"
                        className="h-8 text-sm bg-input border-border text-green-500 dark:text-green-400 font-bold"
                        value={newItem.promotion.price}
                        onChange={(e) => setNewItem({
                          ...newItem, 
                          promotion: {...newItem.promotion!, price: parseInt(e.target.value) || 0}
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Réduction</Label>
                      <div className="text-sm text-green-500 dark:text-green-400 font-bold">
                        -{Math.round((1 - newItem.promotion.price / newItem.price) * 100)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Date début</Label>
                      <Input 
                        type="datetime-local"
                        className="h-8 text-xs bg-input border-border"
                        value={new Date(newItem.promotion.startDate).toISOString().slice(0, 16)}
                        onChange={(e) => setNewItem({
                          ...newItem, 
                          promotion: {...newItem.promotion!, startDate: new Date(e.target.value).getTime()}
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Date fin</Label>
                      <Input 
                        type="datetime-local"
                        className="h-8 text-xs bg-input border-border"
                        value={new Date(newItem.promotion.endDate).toISOString().slice(0, 16)}
                        onChange={(e) => setNewItem({
                          ...newItem, 
                          promotion: {...newItem.promotion!, endDate: new Date(e.target.value).getTime()}
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div>
                <Label htmlFor="featured" className="text-base">Item Vedette</Label>
                <p className="text-sm text-muted-foreground">Afficher dans "Spécialités du Chef"</p>
              </div>
              <Switch 
                id="featured" 
                checked={newItem.featured || false}
                onCheckedChange={(c) => setNewItem({...newItem, featured: c})}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div>
                <Label htmlFor="available" className="text-base">Disponibilité</Label>
                <p className="text-sm text-muted-foreground">Le plat est-il disponible ?</p>
              </div>
              <Switch 
                id="available" 
                checked={newItem.available}
                onCheckedChange={(c) => setNewItem({...newItem, available: c})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl">
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

      <MediaPickerDialog 
        open={isMediaPickerOpen} 
        onOpenChange={setIsMediaPickerOpen}
        onSelect={(url) => {
            setNewItem({...newItem, imageUrl: url});
            toast.success("Image sélectionnée depuis la galerie");
        }} 
      />
    </div>
  );
}
