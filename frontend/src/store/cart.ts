import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sizeId: string | null;     
  sizeLabel: string;
  // Add variant support
  variantId?: string | null;
  color?: string;
};

type CartStore = {
  items: CartItem[];

  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, sizeId: string | null, variantId?: string | null) => void;
  clearCart: () => void;
  updateQuantity: (id: string, sizeId: string | null, quantity: number, variantId?: string | null) => void;

  totalItems: () => number;
  totalPrice: () => number;

  getCartSnapshot: () => {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
  };
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (item) => {
        const exists = get().items.find(
          (i) => i.id === item.id && 
                 i.sizeId === item.sizeId && 
                 i.variantId === item.variantId
        );

        if (exists) {
          set({
            items: get().items.map((i) =>
              i.id === item.id && 
              i.sizeId === item.sizeId && 
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },

      removeFromCart: (id, sizeId, variantId) => {
        set({
          items: get().items.filter(
            (i) => !(i.id === id && 
                    i.sizeId === sizeId && 
                    i.variantId === variantId)
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      updateQuantity: (id, sizeId, quantity, variantId) => {
        if (quantity < 1) return;
        set({
          items: get().items.map((i) =>
            i.id === id && 
            i.sizeId === sizeId && 
            i.variantId === variantId 
              ? { ...i, quantity } 
              : i
          ),
        });
      },

      totalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      totalPrice: () =>
        get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),

      getCartSnapshot: () => {
        const items = get().items;
        return {
          items,
          totalItems: get().totalItems(),
          totalPrice: get().totalPrice(),
        };
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);