import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MediaItem } from '@/types';

type MediaStore = {
  media: MediaItem[];
  isLoading: boolean;
  error: string | null;
  
  loadMedia: () => Promise<void>;
  addMedia: (media: Omit<MediaItem, 'id' | 'createdAt'>) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
};

export const useMediaStore = create<MediaStore>((set, get) => ({
  media: [],
  isLoading: false,
  error: null,

  loadMedia: async () => {
    set({ isLoading: true, error: null });
    try {
      const q = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const media = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MediaItem));
      set({ media, isLoading: false });
    } catch (error) {
      console.error('Error loading media:', error);
      set({ error: 'Failed to load media', isLoading: false });
    }
  },

  addMedia: async (mediaData) => {
    try {
      const newMedia = {
        ...mediaData,
        createdAt: Date.now()
      };
      
      const docRef = await addDoc(collection(db, 'media'), newMedia);
      
      const item: MediaItem = { ...newMedia, id: docRef.id };
      
      set(state => ({ 
        media: [item, ...state.media] 
      }));
    } catch (error) {
      console.error('Error adding media:', error);
      throw error;
    }
  },

  deleteMedia: async (id) => {
    try {
      // Note: This only deletes from Firestore. 
      // Ideally we should also delete from Cloudinary via an Edge Function / Server Action
      // but for now we focus on the registry.
      await deleteDoc(doc(db, 'media', id));
      set(state => ({
        media: state.media.filter(item => item.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  }
}));
