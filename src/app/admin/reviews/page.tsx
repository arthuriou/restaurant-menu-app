"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User, Calendar, MessageSquare, ChevronDown, ChevronUp, Utensils } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Review } from "@/types";
import { cn } from "@/lib/utils";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | number>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!db) return;

    const q = query(
      collection(db, 'reviews'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      
      setReviews(reviewsData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching reviews:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredReviews = useMemo(() => {
    return filter === 'all' 
      ? reviews 
      : reviews.filter(r => r.rating === filter);
  }, [reviews, filter]);

  const groupedReviews = useMemo(() => {
    const groups: Record<string, { name: string, reviews: Review[] }> = {};
    
    filteredReviews.forEach(review => {
      const itemId = review.itemId || 'unknown';
      if (!groups[itemId]) {
        groups[itemId] = {
          name: review.itemName || 'Plat inconnu',
          reviews: []
        };
      }
      groups[itemId].reviews.push(review);
    });
    
    return Object.entries(groups)
      .map(([id, data]) => ({
        id,
        name: data.name,
        reviews: data.reviews,
        average: data.reviews.reduce((acc, r) => acc + r.rating, 0) / data.reviews.length,
        count: data.reviews.length
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredReviews]);

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingCounts = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Avis Clients
          </h2>
          <p className="text-muted-foreground mt-1">
            {reviews.length} avis • Moyenne : {averageRating} ⭐
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${filter === 'all' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setFilter('all')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tous
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
          </CardContent>
        </Card>
        
        {[5, 4, 3, 2, 1].map(rating => (
          <Card 
            key={rating}
            className={`cursor-pointer transition-all hover:shadow-md ${filter === rating ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter(rating)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                {rating} <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ratingCounts[rating as keyof typeof ratingCounts]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grouped Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Chargement des avis...
          </div>
        ) : groupedReviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun avis {filter !== 'all' ? `avec ${filter} étoiles` : 'disponible'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {groupedReviews.map((group) => (
              <Card key={group.id} className="overflow-hidden transition-all duration-200 hover:shadow-md border-zinc-200 dark:border-zinc-800">
                <div 
                  className={cn(
                    "p-4 flex items-center justify-between cursor-pointer transition-colors",
                    expandedItems.has(group.id) ? "bg-zinc-50 dark:bg-zinc-800/50" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}
                  onClick={() => toggleItem(group.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                      group.average >= 4.5 ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" :
                      group.average >= 3 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" :
                      "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                    )}>
                      <span className="font-bold text-lg">{group.average.toFixed(1)}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{group.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{group.count} avis</span>
                        <span>•</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-3 h-3",
                                i < Math.round(group.average) 
                                  ? "fill-yellow-400 text-yellow-400" 
                                  : "fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200",
                      expandedItems.has(group.id) ? "bg-zinc-200 dark:bg-zinc-700 rotate-180" : "bg-transparent"
                    )}>
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                    </div>
                  </div>
                </div>

                {expandedItems.has(group.id) && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    {group.reviews.map((review) => (
                      <div key={review.id} className="p-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                              <User className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                  {review.customerName || 'Client anonyme'}
                                </p>
                                <span className="text-xs text-zinc-400">•</span>
                                <span className="text-xs text-zinc-400">
                                  {(() => {
                                    let date;
                                    if (!review.createdAt) {
                                      date = new Date();
                                    } else if (typeof review.createdAt === 'number') {
                                      date = new Date(review.createdAt);
                                    } else if ((review.createdAt as any).toDate) {
                                      date = (review.createdAt as any).toDate();
                                    } else if ((review.createdAt as any).seconds) {
                                      date = new Date((review.createdAt as any).seconds * 1000);
                                    } else {
                                      date = new Date();
                                    }
                                    return format(date, 'dd MMM', { locale: fr });
                                  })()}
                                </span>
                              </div>
                              <div className="flex items-center gap-0.5 mt-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      "w-3 h-3",
                                      i < review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700"
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-300 pl-11 leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
