import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SpecialOffer {
  id: string;
  enabled: boolean;
  title: string;
  subtitle: string;
  discount: string;
  imageUrl: string;
}

interface ChefSpecial {
  enabled: boolean;
  title: string;
  itemId: string;
}

interface RestaurantStore {
  specialOffers: SpecialOffer[];
  chefSpecial: ChefSpecial;
  primaryColor: string;
  openingHours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  specialHours: { date: string; open: string; close: string; closed: boolean; label: string }[];
  
  addSpecialOffer: (offer: Omit<SpecialOffer, 'id'>) => void;
  removeSpecialOffer: (id: string) => void;
  updateSpecialOffer: (id: string, data: Partial<SpecialOffer>) => void;
  updateChefSpecial: (data: Partial<ChefSpecial>) => void;
  setPrimaryColor: (color: string) => void;
  updateOpeningHours: (day: string, hours: { open: string; close: string; closed: boolean }) => void;
  addSpecialHour: (date: string, hours: { open: string; close: string; closed: boolean; label: string }) => void;
  removeSpecialHour: (index: number) => void;
}

export const useRestaurantStore = create<RestaurantStore>()(
  persist(
    (set) => ({
      specialOffers: [
        {
          id: '1',
          enabled: true,
          title: "KEEP CALM & DRINK BEER",
          subtitle: "OFFRE SPÉCIALE",
          discount: "-20% OFF",
          imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=2070&auto=format&fit=crop",
        },
        {
          id: '2',
          enabled: true,
          title: "BURGER\nSUPREME",
          subtitle: "Nouveauté",
          discount: "HOT",
          imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop",
        }
      ],
      chefSpecial: {
        enabled: true,
        title: "Spécial du Chef",
        itemId: "chicken_01",
      },
      primaryColor: "hsl(0 72.2% 50.6%)",
      openingHours: {
        monday: { open: '11:00', close: '23:00', closed: false },
        tuesday: { open: '11:00', close: '23:00', closed: false },
        wednesday: { open: '11:00', close: '23:00', closed: false },
        thursday: { open: '11:00', close: '23:00', closed: false },
        friday: { open: '11:00', close: '00:00', closed: false },
        saturday: { open: '10:00', close: '00:00', closed: false },
        sunday: { open: '10:00', close: '23:00', closed: false },
      },
      specialHours: [],

      addSpecialOffer: (offer) =>
        set((state) => ({
          specialOffers: [
            ...state.specialOffers,
            { ...offer, id: Math.random().toString(36).substring(7) }
          ],
        })),
      removeSpecialOffer: (id) =>
        set((state) => ({
          specialOffers: state.specialOffers.filter((o) => o.id !== id),
        })),
      updateSpecialOffer: (id, data) =>
        set((state) => ({
          specialOffers: state.specialOffers.map((o) =>
            o.id === id ? { ...o, ...data } : o
          ),
        })),
      updateChefSpecial: (data) =>
        set((state) => ({
          chefSpecial: { ...state.chefSpecial, ...data },
        })),
      setPrimaryColor: (color) => set({ primaryColor: color }),
      updateOpeningHours: (day, hours) => set((state) => ({
        openingHours: { ...state.openingHours, [day]: hours }
      })),
      addSpecialHour: (date, hours) => set((state) => ({
        specialHours: [...state.specialHours, { ...hours, date }]
      })),
      removeSpecialHour: (index) => set((state) => ({
        specialHours: state.specialHours.filter((_, i) => i !== index)
      })),
    }),
    {
      name: 'restaurant-storage',
    }
  )
);
