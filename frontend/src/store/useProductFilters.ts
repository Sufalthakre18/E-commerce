// store/useProductFilters.ts
import { create } from 'zustand';

interface FilterState {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: string;
  search?: string;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
}

export const useProductFilters = create<FilterState>((set) => ({
  category: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  inStock: undefined,
  sort: undefined,
  search: '',
  setFilters: (filters) => set((state) => ({ ...state, ...filters })),
  clearFilters: () => set(() => ({
    category: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    inStock: undefined,
    sort: undefined,
    search: '',
  })),
}));
