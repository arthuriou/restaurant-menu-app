"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useReviewStore } from "@/stores/reviews";
import type { OrderItem } from "@/types";
import { cn } from "@/lib/utils";
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
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] =useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRating = (itemId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [itemId]: rating }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Envoyer un avis pour chaque item noté
      for (const item of items) {
        const rating = ratings[item.menuId];
        if (rating) {
          await addReview({
            itemId: item.menuId,
            orderId,
            tableId,
            rating,
            comment: comments[item.menuId] || undefined,
            itemName: item.name
          });
        }
      }
      
      onOpenChange(false);
      setRatings({});
      setComments({});
    } catch (error) {
      console.error('Error submitting reviews:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRated = Object.keys(ratings).length;
  const canSubmit = totalRated > 0 && !isSubmitting;

  // Deduplicate items - show each dish only once
  const uniqueItems = items.reduce((acc, item) => {
    if (!acc.find(i => i.menuId === item.menuId)) {
      acc.push(item);
    }
    return acc;
  }, [] as OrderItem[]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden rounded-3xl flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Votre avis nous intéresse ! ⭐</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto custom-scrollbar px-1">
          <p className="text-sm text-muted-foreground">
            Notez les plats que vous avez appréciés (optionnel : ajoutez un commentaire)
          </p>

          {uniqueItems.map((item) => (
            <div key={item.menuId} className="space-y-2 p-4 rounded-xl bg-muted/30">
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
                    onClick={() => handleRating(item.menuId, star)}
                    className="transition-all hover:scale-110"
                  >
                    <Star 
                      className={cn(
                        "w-8 h-8 transition-colors",
                        star <= (ratings[item.menuId] || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-zinc-300"
                      )}
                    />
                  </button>
                ))}
              </div>

              {/* Comment (only if rated) */}
              {ratings[item.menuId] && (
                <Textarea
                  placeholder="Un commentaire ? (optionnel)"
                  value={comments[item.menuId] || ""}
                  onChange={(e) => setComments(prev => ({ ...prev, [item.menuId]: e.target.value }))}
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
