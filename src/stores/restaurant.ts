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
  
  // Invoice settings
  invoiceSettings: {
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyEmail: string;
    taxId: string;
    logoUrl?: string;
    taxRate: number;
    footerMessage: string;
    showLogo: boolean;
    showTaxId: boolean;
  };
  
  addSpecialOffer: (offer: Omit<SpecialOffer, 'id'>) => void;
  removeSpecialOffer: (id: string) => void;
  updateSpecialOffer: (id: string, data: Partial<SpecialOffer>) => void;
  updateChefSpecial: (data: Partial<ChefSpecial>) => void;
  setPrimaryColor: (color: string) => void;
  updateOpeningHours: (day: string, hours: { open: string; close: string; closed: boolean }) => void;
  addSpecialHour: (date: string, hours: { open: string; close: string; closed: boolean; label: string }) => void;
  removeSpecialHour: (index: number) => void;
  updateInvoiceSettings: (settings: Partial<RestaurantStore['invoiceSettings']>) => void;
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
          title: "AFRICAN PLEASURE",
          subtitle: "NOUVEAU",
          discount: "TRY IT",
          imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?q=80&w=2070&auto=format&fit=crop",
        },
      ],
      chefSpecial: {
        enabled: true,
        title: "Spécialité du chef",
        itemId: "chicken_01",
      },
      primaryColor: "hsl(142.1 76.2% 36.3%)",
      openingHours: {
        monday: { open: "09:00", close: "22:00", closed: false },
        tuesday: { open: "09:00", close: "22:00", closed: false },
        wednesday: { open: "09:00", close: "22:00", closed: false },
        thursday: { open: "09:00", close: "22:00", closed: false },
        friday: { open: "09:00", close: "23:00", closed: false },
        saturday: { open: "10:00", close: "23:00", closed: false },
        sunday: { open: "10:00", close: "21:00", closed: false },
      },
      specialHours: [],
      
      // Default invoice settings
      invoiceSettings: {
        companyName: "Restaurant Le Gourmet",
        companyAddress: "123 Avenue des Saveurs, Abidjan, Côte d'Ivoire",
        companyPhone: "+225 27 XX XX XX XX",
        companyEmail: "contact@legourmet.ci",
        taxId: "CI-123456789",
        logoUrl: undefined,
        taxRate: 20,
        footerMessage: "Merci de votre visite ! À bientôt.",
        showLogo: true,
        showTaxId: true,
      },
      
      addSpecialOffer: (offer) => set((state) => ({
        specialOffers: [...state.specialOffers, { ...offer, id: Date.now().toString() }],
      })),
      removeSpecialOffer: (id) => set((state) => ({
        specialOffers: state.specialOffers.filter((o) => o.id !== id),
      })),
      updateSpecialOffer: (id, data) => set((state) => ({
        specialOffers: state.specialOffers.map((o) => 
          o.id === id ? { ...o, ...data } : o
        ),
      })),
      updateChefSpecial: (data) => set((state) => ({
        chefSpecial: { ...state.chefSpecial, ...data },
      })),
      setPrimaryColor: (color) => set({ primaryColor: color }),
      updateOpeningHours: (day, hours) => set((state) => ({
        openingHours: {
          ...state.openingHours,
          [day]: hours,
        },
      })),
      addSpecialHour: (date, hours) => set((state) => ({
        specialHours: [...state.specialHours, { date, ...hours }],
      })),
      removeSpecialHour: (index) => set((state) => ({
        specialHours: state.specialHours.filter((_, i) => i !== index),
      })),
      updateInvoiceSettings: (settings) => set((state) => ({
        invoiceSettings: { ...state.invoiceSettings, ...settings },
      })),
    }),
    {
      name: 'restaurant-storage',
    }
  )
);
