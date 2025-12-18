"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Review } from "@/types";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | number>('all');

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

  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(r => r.rating === filter);

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

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Chargement des avis...
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun avis {filter !== 'all' ? `avec ${filter} étoiles` : 'disponible'}</p>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{review.customerName || 'Client anonyme'}</p>
                      {review.customerPhone && (
                        <p className="text-xs text-muted-foreground">{review.customerPhone}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Calendar className="w-3 h-3" />
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
                          
                          return format(date, 'dd MMM yyyy à HH:mm', { locale: fr });
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {review.comment && (
                  <p className="text-sm text-muted-foreground mb-3 pl-13">
                    "{review.comment}"
                  </p>
                )}

                {review.itemName && (
                  <Badge variant="secondary" className="text-xs">
                    {review.itemName}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
