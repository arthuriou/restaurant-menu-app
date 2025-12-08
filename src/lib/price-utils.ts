import type { MenuItem } from '@/types';

/**
 * Calcule le prix effectif d'un item en tenant compte des promotions actives
 */
export function getEffectivePrice(item: MenuItem): {
  currentPrice: number;
  originalPrice?: number;
  isOnPromo: boolean;
  discountPercent?: number;
} {
  if (!item.promotion) {
    return { currentPrice: item.price, isOnPromo: false };
  }

  const now = Date.now();
  const { price: promoPrice, startDate, endDate } = item.promotion;

  // Vérifier si la promo est active
  if (now >= startDate && now <= endDate) {
    const discountPercent = Math.round((1 - promoPrice / item.price) * 100);
    return {
      currentPrice: promoPrice,
      originalPrice: item.price,
      isOnPromo: true,
      discountPercent
    };
  }

  // Promo expirée ou pas encore commencée
  return { currentPrice: item.price, isOnPromo: false };
}
