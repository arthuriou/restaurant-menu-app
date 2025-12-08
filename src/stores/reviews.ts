import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Review } from '@/types';
import { toast } from 'sonner';

interface ReviewState {
  reviews: Review[];
  isLoading: boolean;
  
  // Actions
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => Promise<void>;
  getReviewsForItem: (itemId: string) => Promise<Review[]>;
  hasReviewedOrder: (orderId: string) => Promise<boolean>;
  loadReviewsForItem: (itemId: string) => Promise<void>;
}

export const useReviewStore = create<ReviewState>()((set, get) => ({
  reviews: [],
  isLoading: false,

  addReview: async (reviewData) => {
    if (!db) throw new Error('Firebase non initialisé');
    
    try {
      const review: Omit<Review, 'id'> = {
        ...reviewData,
        createdAt: Date.now()
      };

      const docRef = await addDoc(collection(db, 'reviews'), review);
      
      toast.success('Merci pour votre avis !');
      
      // Ajouter au store local
      set(state => ({
        reviews: [...state.reviews, { ...review, id: docRef.id }]
      }));
    } catch (error) {
      console.error('Error adding review:', error);
      toast.error('Impossible d\'enregistrer votre avis');
      throw error;
    }
  },

  getReviewsForItem: async (itemId) => {
    if (!db) return [];
    
    try {
      const q = query(
        collection(db, 'reviews'),
        where('itemId', '==', itemId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  },

  hasReviewedOrder: async (orderId) => {
    if (!db) return false;
    
    try {
      const q = query(
        collection(db, 'reviews'),
        where('orderId', '==', orderId)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking reviews:', error);
      return false;
    }
  },

  loadReviewsForItem: async (itemId) => {
    set({ isLoading: true });
    try {
      const reviews = await get().getReviewsForItem(itemId);
      set({ reviews, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  }
}));
