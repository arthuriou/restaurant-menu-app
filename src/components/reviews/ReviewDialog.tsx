"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useReviewStore } from "@/stores/reviews";
import type { OrderItem } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import "./scrollbar.css";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  tableId: string;
  items: OrderItem[];
}

export function ReviewDialog({ open, onOpenChange, orderId, tableId, items }: ReviewDialogProps) {
  const { addReview } = useReviewStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  
  // Ratings state keyed by uniqueKey (menuId + options)
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  // Deduplicate items based on menuId AND options
  const displayItems = useMemo(() => {
    const uniqueMap = new Map<string, OrderItem & { uniqueKey: string }>();
    
    items.forEach(item => {
      // Create a deterministic key for options to distinguish "Burger" from "Burger + Fries"
      const optionsKey = item.selectedOptions 
        ? JSON.stringify([...item.selectedOptions].sort((a, b) => a.name.localeCompare(b.name))) 
        : '';
      
      // Use menuId + options as unique key
      const uniqueKey = `${item.menuId}|${optionsKey}`;
      
      if (!uniqueMap.has(uniqueKey)) {
        uniqueMap.set(uniqueKey, { ...item, uniqueKey });
      }
    });
    
    return Array.from(uniqueMap.values());
  }, [items]);

  const handleRating = (uniqueKey: string, rating: number) => {
    setRatings(prev => ({ ...prev, [uniqueKey]: rating }));
  };

  const handleSubmit = async () => {
    if (Object.keys(ratings).length === 0) return;

    setIsSubmitting(true);
    try {
      const promises = Object.entries(ratings).map(([uniqueKey, rating]) => {
        const item = displayItems.find(i => i.uniqueKey === uniqueKey);
        if (!item) return null;

        // Append options to comment for context
        let finalComment = comments[uniqueKey] || '';
        if (item.selectedOptions && item.selectedOptions.length > 0) {
          const optionsStr = item.selectedOptions.map(o => o.name).join(', ');
          const optionNote = `(Options: ${optionsStr})`;
          finalComment = finalComment ? `${finalComment} ${optionNote}` : optionNote;
        }

        return addReview({
          itemId: item.menuId, // Link to the menu item
          orderId,
          tableId,
          rating,
          comment: finalComment,
          itemName: item.name,
          customerName: customerName || 'Anonyme',
          customerPhone: customerPhone || ''
        });
      });

      await Promise.all(promises);
      
      toast.success("Merci pour votre avis ! ⭐");
      onOpenChange(false);
      
      // Reset form
      setRatings({});
      setComments({});
      setCustomerName("");
      setCustomerPhone("");
      
    } catch (error) {
      console.error('Error submitting reviews:', error);
      toast.error("Erreur lors de l'envoi de l'avis");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRated = Object.keys(ratings).length;
  const canSubmit = totalRated > 0 && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden rounded-3xl flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Votre avis nous intéresse ! ⭐</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto custom-scrollbar px-1">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Vos coordonnées (optionnel - restez anonyme si vous préférez)
            </p>
            <div className="space-y-2">
              <div>
                <Label htmlFor="name" className="text-xs">Nom</Label>
                <Input
                  id="name"
                  placeholder="Votre nom (optionnel)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Votre numéro (optionnel)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Notez les plats que vous avez appréciés (optionnel : ajoutez un commentaire)
          </p>

          {displayItems.map((item) => (
            <div key={item.uniqueKey} className="space-y-2 p-4 rounded-xl bg-muted/30">
              <div>
                <h4 className="font-bold">{item.name}</h4>
                {item.selectedOptions && item.selectedOptions.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.selectedOptions.map(opt => opt.name).join(', ')}
                  </p>
                )}
              </div>
              
              {/* Stars Rating */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(item.uniqueKey, star)}
                    className="transition-all"
                  >
                    <Star 
                      className={cn(
                        "w-8 h-8 transition-colors",
                        star <= (ratings[item.uniqueKey] || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-zinc-300"
                      )}
                    />
                  </button>
                ))}
              </div>

              {/* Comment (only if rated) */}
              {ratings[item.uniqueKey] && (
                <Textarea
                  placeholder="Un commentaire ? (optionnel)"
                  value={comments[item.uniqueKey] || ""}
                  onChange={(e) => setComments(prev => ({ ...prev, [item.uniqueKey]: e.target.value }))}
                  className="resize-none h-20 text-sm"
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Plus tard
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-xl bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? "Envoi..." : `Envoyer ${totalRated > 0 ? `(${totalRated})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
