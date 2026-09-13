import { create } from 'zustand';
import { apiClient } from '../services/api';

export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  displayOrder: number;
}

export interface MenuItemData {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  code: string;
  description?: string;
}

const DEFAULT_CATEGORIES: MenuCategory[] = [
  { id: 'cat-shakes', name: 'Thick Shakes & Cold Coffee', icon: '🥤', description: 'Signature Thick Shakes & Brewed Cold Coffee', displayOrder: 1 },
  { id: 'cat-sandwiches', name: 'Sandwiches & Toasties', icon: '🥪', description: 'Grilled & Jumbo Stuffed Sandwiches', displayOrder: 2 },
  { id: 'cat-wraps', name: 'Wraps & Rolls', icon: '🌯', description: 'Crispy Paneer & Veggies wrapped in Tortilla', displayOrder: 3 },
  { id: 'cat-burgers', name: 'Burgers & Sliders', icon: '🍔', description: 'Crunchy Veg & Cheese Burst Burgers', displayOrder: 4 },
  { id: 'cat-munchies', name: 'Fries & Quick Bites', icon: '🍟', description: 'Peri Peri Fries, Nuggets & Munchies', displayOrder: 5 },
  { id: 'cat-pizzas', name: 'Pizzas & Garlic Breads', icon: '🍕', description: 'Cheesy Artisan Thin Crust Pizzas', displayOrder: 6 },
  { id: 'cat-combos', name: 'Power Meal Combos', icon: '🍱', description: 'Value Super Combos with Beverages', displayOrder: 7 },
  { id: 'cat-hotbrews', name: 'Hot Brews & Chai', icon: '☕', description: 'Fresh Espresso, Latte & Special Chai', displayOrder: 8 },
  { id: 'cat-chinese', name: 'Chinese Bowls & Noodles', icon: '🍜', description: 'Wok tossed Hakka Noodles & Rice', displayOrder: 9 },
  { id: 'cat-desserts', name: 'Desserts & Ice Creams', icon: '🍨', description: 'Sizzling Brownies & Sundaes', displayOrder: 10 },
];

const DEFAULT_ITEMS: MenuItemData[] = [
  // Thick Shakes & Cold Coffee
  { id: 'm1', name: 'Alphonso Mango Shake', categoryId: 'cat-shakes', price: 180, isVeg: true, isAvailable: true, code: 'AMS', description: 'Pure Ratnagiri Alphonso mango pulp churned with rich milk and ice cream' },
  { id: 'm2', name: 'Choco Belgian Shake', categoryId: 'cat-shakes', price: 190, isVeg: true, isAvailable: true, code: 'CBS', description: 'Dark Belgian chocolate blended thick with chocolate chunks' },
  { id: 'm3', name: 'Cold Coffee Classic', categoryId: 'cat-shakes', price: 140, isVeg: true, isAvailable: true, code: 'CCC', description: 'Smooth, strong iced brewed espresso blend' },
  { id: 'm4', name: 'Cold Coffee Ice Cream Float', categoryId: 'cat-shakes', price: 160, isVeg: true, isAvailable: true, code: 'CCF', description: 'Cold coffee crowned with a scoop of vanilla ice cream' },
  { id: 'm5', name: 'Irish Style Cold Coffee', categoryId: 'cat-shakes', price: 170, isVeg: true, isAvailable: true, code: 'ICC', description: 'Rich espresso with Irish cream flavor notes' },
  { id: 'm6', name: 'Kesar Badam Pista Shake', categoryId: 'cat-shakes', price: 210, isVeg: true, isAvailable: true, code: 'KBP', description: 'Royal saffron with roasted almonds & pistachios' },
  { id: 'm7', name: 'Kitkat Crunchy Shake', categoryId: 'cat-shakes', price: 190, isVeg: true, isAvailable: true, code: 'KKS', description: 'Crisp KitKat wafers blended with velvety chocolate cream' },
  { id: 'm8', name: 'Oreo Thick Shake (Most Loved)', categoryId: 'cat-shakes', price: 190, isVeg: true, isAvailable: true, code: 'OTS', description: 'Crunchy Oreo cookies crushed into a creamy thick shake' },
  { id: 'm9', name: 'Strawberry Fresh Shake', categoryId: 'cat-shakes', price: 160, isVeg: true, isAvailable: true, code: 'SBS', description: 'Fresh Mahabaleshwar strawberries blended creamy and sweet' },
  { id: 'm10', name: 'Vanilla Classic Shake', categoryId: 'cat-shakes', price: 130, isVeg: true, isAvailable: true, code: 'VCS', description: 'Classic Madagascar vanilla bean extract with thick milk' },

  // Sandwiches & Toasties
  { id: 'm11', name: 'Paneer Tikka Grilled Sandwich', categoryId: 'cat-sandwiches', price: 160, isVeg: true, isAvailable: true, code: 'PTS', description: 'Smoky spiced paneer with mint chutney & melted mozzarella' },
  { id: 'm12', name: 'Cheese Corn Burst Sandwich', categoryId: 'cat-sandwiches', price: 150, isVeg: true, isAvailable: true, code: 'CCS', description: 'Sweet corn kernel with double blend cheese' },
  { id: 'm13', name: 'Bombay Masala Club Sandwich', categoryId: 'cat-sandwiches', price: 130, isVeg: true, isAvailable: true, code: 'BMC', description: 'Layered veggies, spiced potato mash and tangy chutneys' },
  { id: 'm14', name: 'Peri Peri Paneer Cheese Grill', categoryId: 'cat-sandwiches', price: 170, isVeg: true, isAvailable: true, code: 'PPG', description: 'Fiery peri-peri marinated paneer with creamy cheese' },
  { id: 'm15', name: 'Chocolate Cheese Toast', categoryId: 'cat-sandwiches', price: 140, isVeg: true, isAvailable: true, code: 'CCT', description: 'Rich melted dark chocolate with mozzarella on toasted bread' },

  // Wraps & Rolls
  { id: 'm16', name: 'Crispy Veggie Loaded Wrap', categoryId: 'cat-wraps', price: 140, isVeg: true, isAvailable: true, code: 'CVW', description: 'Crispy vegetable patty wrapped with garlic mayo and lettuce' },
  { id: 'm17', name: 'Peri Peri Paneer Wrap', categoryId: 'cat-wraps', price: 170, isVeg: true, isAvailable: true, code: 'PPW', description: 'Grilled paneer with spicy peri-peri seasoning and chipotle sauce' },
  { id: 'm18', name: 'Mexican Cheesy Corn Wrap', categoryId: 'cat-wraps', price: 150, isVeg: true, isAvailable: true, code: 'MCW', description: 'Sweet corn, bell peppers, salsa and melted cheese blend' },
  { id: 'm19', name: 'Tandoori Paneer Kathi Roll', categoryId: 'cat-wraps', price: 160, isVeg: true, isAvailable: true, code: 'TPK', description: 'Tandoori spiced paneer rolled in flaky paratha' },

  // Burgers & Sliders
  { id: 'm20', name: 'Crispy Veg Patty Burger', categoryId: 'cat-burgers', price: 110, isVeg: true, isAvailable: true, code: 'CVB', description: 'Golden crispy vegetable patty with creamy mayo and crunchy lettuce' },
  { id: 'm21', name: 'Double Cheese Burst Burger', categoryId: 'cat-burgers', price: 150, isVeg: true, isAvailable: true, code: 'DCB', description: 'Double layer cheese with seasoned herb patty' },
  { id: 'm22', name: 'Spicy Paneer Supreme Burger', categoryId: 'cat-burgers', price: 170, isVeg: true, isAvailable: true, code: 'SSB', description: 'Crispy crumbed paneer steak with fiery sriracha mayo' },
  { id: 'm23', name: 'Schezwan Veggie Crunch Burger', categoryId: 'cat-burgers', price: 130, isVeg: true, isAvailable: true, code: 'SVC', description: 'Spicy Schezwan sauce with crunch vegetable patty' },

  // Fries & Quick Bites
  { id: 'm24', name: 'Peri Peri Fries Large', categoryId: 'cat-munchies', price: 120, isVeg: true, isAvailable: true, code: 'PPF', description: 'Golden french fries tossed in aromatic spicy peri-peri dust' },
  { id: 'm25', name: 'Cheesy Loaded Nachos', categoryId: 'cat-munchies', price: 160, isVeg: true, isAvailable: true, code: 'CLN', description: 'Crispy corn nachos with warm cheese sauce and fresh salsa' },
  { id: 'm26', name: 'Crispy Veggie Nuggets (8 Pcs)', categoryId: 'cat-munchies', price: 130, isVeg: true, isAvailable: true, code: 'CVN', description: 'Bite-sized seasoned vegetable nuggets served with dip' },
  { id: 'm27', name: 'Garlic Herb Potato Pops', categoryId: 'cat-munchies', price: 110, isVeg: true, isAvailable: true, code: 'GHP', description: 'Bite-sized potato hash nuggets with garlic herb dip' },
  { id: 'm28', name: 'Paneer Popcorn Bites', categoryId: 'cat-munchies', price: 160, isVeg: true, isAvailable: true, code: 'PPB', description: 'Crispy coated spiced cottage cheese bites' },

  // Pizzas & Garlic Breads
  { id: 'm29', name: 'Classic Margherita Pizza (8")', categoryId: 'cat-pizzas', price: 199, isVeg: true, isAvailable: true, code: 'CMP', description: 'Tomato basil concasse with 100% pure mozzarella cheese' },
  { id: 'm30', name: 'Farmhouse Veggie Delight Pizza (8")', categoryId: 'cat-pizzas', price: 259, isVeg: true, isAvailable: true, code: 'FVP', description: 'Capsicum, onions, sweet corn, olives & mushroom' },
  { id: 'm31', name: 'Paneer Tikka Makhani Pizza (8")', categoryId: 'cat-pizzas', price: 289, isVeg: true, isAvailable: true, code: 'PTP', description: 'Marinated paneer chunks with makhani gravy sauce' },
  { id: 'm32', name: 'Cheesy Stuffed Garlic Bread', categoryId: 'cat-pizzas', price: 149, isVeg: true, isAvailable: true, code: 'SGB', description: 'Freshly baked garlic loaf stuffed with gooey cheese & sweet corn' },

  // Power Meal Combos
  { id: 'm33', name: 'Magic Combo: Burger + Fries + Shake', categoryId: 'cat-combos', price: 299, isVeg: true, isAvailable: true, code: 'MC1', description: 'Crispy Veg Burger + Peri Peri Fries + Choice of Thick Shake' },
  { id: 'm34', name: 'Snack Box Combo: Wrap + Cold Coffee', categoryId: 'cat-combos', price: 249, isVeg: true, isAvailable: true, code: 'MC2', description: 'Veggie Wrap + Classic Cold Coffee' },
  { id: 'm35', name: 'Pizza Party Combo: Pizza + Garlic Bread + Drink', categoryId: 'cat-combos', price: 349, isVeg: true, isAvailable: true, code: 'MC3', description: '8" Margherita Pizza + Cheesy Garlic Bread + 2 Cold Drinks' },
  { id: 'm36', name: 'Quick Byte Combo: Sandwich + Cold Coffee', categoryId: 'cat-combos', price: 229, isVeg: true, isAvailable: true, code: 'MC4', description: 'Cheese Corn Sandwich + Cold Coffee Classic' },

  // Hot Brews & Chai
  { id: 'm37', name: 'Classic Cappuccino', categoryId: 'cat-hotbrews', price: 120, isVeg: true, isAvailable: true, code: 'CAP', description: 'Rich espresso shot with steamed foamy milk' },
  { id: 'm38', name: 'Cafe Latte Caramel', categoryId: 'cat-hotbrews', price: 140, isVeg: true, isAvailable: true, code: 'CLC', description: 'Smooth espresso with caramel syrup and silky milk' },
  { id: 'm39', name: 'Hot Dark Chocolate', categoryId: 'cat-hotbrews', price: 150, isVeg: true, isAvailable: true, code: 'HDC', description: 'Velvety melted dark cocoa with steamed cream' },
  { id: 'm40', name: 'Masala Kulhad Chai', categoryId: 'cat-hotbrews', price: 50, isVeg: true, isAvailable: true, code: 'MKC', description: 'Aromatic ginger, cardamom & clove brewed milk tea' },
  { id: 'm41', name: 'Elaichi Special Tea', categoryId: 'cat-hotbrews', price: 50, isVeg: true, isAvailable: true, code: 'EST', description: 'Fragrant freshly crushed cardamom milk tea' },

  // Chinese Bowls & Noodles
  { id: 'm42', name: 'Veg Hakka Noodles', categoryId: 'cat-chinese', price: 160, isVeg: true, isAvailable: true, code: 'VHN', description: 'Wok tossed noodles with shredded vegetables and soy seasoning' },
  { id: 'm43', name: 'Schezwan Fried Rice', categoryId: 'cat-chinese', price: 170, isVeg: true, isAvailable: true, code: 'SFR', description: 'Basmati rice tossed in spicy house-made Schezwan sauce' },
  { id: 'm44', name: 'Veg Manchurian Dry (8 Pcs)', categoryId: 'cat-chinese', price: 180, isVeg: true, isAvailable: true, code: 'VMD', description: 'Crispy cabbage & carrot dumplings tossed in tangy sauce' },
  { id: 'm45', name: 'Chilli Paneer Dry', categoryId: 'cat-chinese', price: 210, isVeg: true, isAvailable: true, code: 'CPD', description: 'Crispy paneer cubes with bell peppers and green chillies' },

  // Desserts & Ice Creams
  { id: 'm46', name: 'Chocolate Sizzling Brownie', categoryId: 'cat-desserts', price: 180, isVeg: true, isAvailable: true, code: 'CSB', description: 'Fudge walnut brownie served on hot sizzler plate with vanilla scoop' },
  { id: 'm47', name: 'Vanilla Choco Fudge Sundae', categoryId: 'cat-desserts', price: 110, isVeg: true, isAvailable: true, code: 'VCF', description: 'Vanilla ice cream topped with warm chocolate fudge and nuts' },
  { id: 'm48', name: 'Nutella Belgium Waffle Bite', categoryId: 'cat-desserts', price: 160, isVeg: true, isAvailable: true, code: 'NBW', description: 'Crispy warm waffle loaded with authentic Nutella spread' },
  { id: 'm49', name: 'Gulab Jamun Sundae Bowl', categoryId: 'cat-desserts', price: 130, isVeg: true, isAvailable: true, code: 'GJS', description: 'Warm gulab jamuns served with rich vanilla bean ice cream' },
];


interface MenuState {
  categories: MenuCategory[];
  items: MenuItemData[];
  isLoading: boolean;
  
  // Actions
  fetchFromBackend: () => Promise<void>;
  addCategory: (name: string, icon?: string, description?: string) => MenuCategory;
  updateCategory: (id: string, name: string, icon?: string, description?: string) => void;
  deleteCategory: (id: string) => void;
  
  addItem: (item: Omit<MenuItemData, 'id'>) => MenuItemData;
  updateItem: (id: string, updated: Partial<MenuItemData>) => void;
  deleteItem: (id: string) => void;
  toggleItemAvailability: (id: string) => void;
  setItemAvailability: (id: string, isAvailable: boolean) => void;
  resetToDefaults: () => void;
}

const getTenantId = (): string => {
  try {
    return localStorage.getItem('quantrobill_tenant_id') || '';
  } catch {
    return '';
  }
};

const getCategoryStorageKey = (tenantId?: string): string => {
  const tid = tenantId || getTenantId();
  return tid ? `pbk_pos_categories_${tid}` : 'pbk_pos_categories_demo';
};

const getItemStorageKey = (tenantId?: string): string => {
  const tid = tenantId || getTenantId();
  return tid ? `pbk_pos_items_${tid}` : 'pbk_pos_items_demo';
};

const loadInitialCategories = (): MenuCategory[] => {
  const tenantId = getTenantId();
  if (tenantId) {
    try {
      const saved = localStorage.getItem(getCategoryStorageKey(tenantId));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load categories from localStorage', e);
    }
    // When tenant context is active, start empty until fetched from backend (do NOT use demo categories)
    return [];
  }

  try {
    const saved = localStorage.getItem('pbk_pos_categories_demo');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load categories from localStorage', e);
  }
  return DEFAULT_CATEGORIES;
};

const loadInitialItems = (): MenuItemData[] => {
  const tenantId = getTenantId();
  if (tenantId) {
    try {
      const saved = localStorage.getItem(getItemStorageKey(tenantId));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load items from localStorage', e);
    }
    // When tenant context is active, start empty until fetched from backend (do NOT use demo items)
    return [];
  }

  try {
    const saved = localStorage.getItem('pbk_pos_items_demo');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load items from localStorage', e);
  }
  return DEFAULT_ITEMS;
};

export const useMenuStore = create<MenuState>((set, get) => ({
  categories: loadInitialCategories(),
  items: loadInitialItems(),
  isLoading: false,

  fetchFromBackend: async () => {
    set({ isLoading: true });
    const tenantId = getTenantId();

    // Clean up legacy un-scoped cache if tenant is active
    if (tenantId) {
      try {
        localStorage.removeItem('pbk_pos_items');
        localStorage.removeItem('pbk_pos_categories');
        localStorage.removeItem('petbharke_menu_items_v4');
        localStorage.removeItem('petbharke_menu_categories_v4');
      } catch {}
    }

    try {
      const [catRes, itemRes] = await Promise.all([
        apiClient.get('/menu/categories').catch(() => null),
        apiClient.get('/menu/items').catch(() => null),
      ]);

      let backendCats: MenuCategory[] = [];

      if (catRes?.data?.data && Array.isArray(catRes.data.data)) {
        backendCats = catRes.data.data.map((c: any, index: number) => ({
          id: c.id,
          name: c.name,
          icon: c.iconUrl || '🍽️',
          description: c.description || '',
          displayOrder: c.displayOrder || index + 1,
        }));

        set({ categories: backendCats });
        if (tenantId) {
          localStorage.setItem(getCategoryStorageKey(tenantId), JSON.stringify(backendCats));
        }
      }

      if (itemRes?.data?.data && Array.isArray(itemRes.data.data)) {
        const activeCats = backendCats.length > 0 ? backendCats : get().categories;
        const backendItems: MenuItemData[] = itemRes.data.data.map((i: any) => {
          let validCatId = i.categoryId;
          const catExists = activeCats.some((c) => c.id === validCatId);
          if (!catExists && activeCats.length > 0) {
            validCatId = activeCats[0]?.id;
          }

          return {
            id: i.id,
            name: i.name,
            categoryId: validCatId || 'cat-general',
            price: i.basePrice || i.price || 0,
            isVeg: i.isVeg !== false,
            isAvailable: i.isAvailable !== false,
            code: i.shortCode || i.code || 'ITEM',
            description: i.description || '',
          };
        });

        set({ items: backendItems });
        if (tenantId) {
          localStorage.setItem(getItemStorageKey(tenantId), JSON.stringify(backendItems));
        }

        // Sync to Desktop Electron offline disk cache if running in desktop POS
        if (typeof window !== 'undefined' && (window as any).desktopApi?.saveOfflineCache) {
          (window as any).desktopApi.saveOfflineCache(`menu_catalog_${tenantId || 'default'}`, {
            categories: activeCats,
            items: backendItems,
            cachedAt: new Date().toISOString(),
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Backend sync failed, using stored local menu items', err);

      // Attempt offline recovery from Desktop Electron offline disk cache
      if (typeof window !== 'undefined' && (window as any).desktopApi?.getOfflineCache) {
        try {
          const cached = await (window as any).desktopApi.getOfflineCache(`menu_catalog_${tenantId || 'default'}`);
          if (cached?.success && cached.data?.items?.length) {
            console.log('[Desktop POS] Restored menu catalog from offline disk cache');
            set({
              items: cached.data.items,
              categories: cached.data.categories || get().categories,
            });
          }
        } catch (cacheErr) {
          console.debug('Electron cache fallback failed:', cacheErr);
        }
      }
    } finally {
      set({ isLoading: false });
    }
  },

  addCategory: (name: string, icon: string = '🍽️', description: string = '') => {
    const newCat: MenuCategory = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      icon,
      description,
      displayOrder: get().categories.length + 1,
    };
    const updated = [...get().categories, newCat];
    set({ categories: updated });
    localStorage.setItem(getCategoryStorageKey(), JSON.stringify(updated));
    return newCat;
  },

  updateCategory: (id: string, name: string, icon?: string, description?: string) => {
    const updated = get().categories.map((c) =>
      c.id === id ? { ...c, name: name.trim(), ...(icon ? { icon } : {}), ...(description !== undefined ? { description } : {}) } : c
    );
    set({ categories: updated });
    localStorage.setItem(getCategoryStorageKey(), JSON.stringify(updated));
  },

  deleteCategory: (id: string) => {
    const updatedCategories = get().categories.filter((c) => c.id !== id);
    const updatedItems = get().items.filter((i) => i.categoryId !== id);
    set({ categories: updatedCategories, items: updatedItems });
    localStorage.setItem(getCategoryStorageKey(), JSON.stringify(updatedCategories));
    localStorage.setItem(getItemStorageKey(), JSON.stringify(updatedItems));
  },

  addItem: (itemData) => {
    const newItem: MenuItemData = {
      id: `m-${Date.now()}`,
      ...itemData,
    };
    const updated = [...get().items, newItem];
    set({ items: updated });
    localStorage.setItem(getItemStorageKey(), JSON.stringify(updated));
    return newItem;
  },

  updateItem: (id: string, updatedFields) => {
    const updated = get().items.map((i) =>
      i.id === id ? { ...i, ...updatedFields } : i
    );
    set({ items: updated });
    localStorage.setItem(getItemStorageKey(), JSON.stringify(updated));
  },

  deleteItem: (id: string) => {
    const updated = get().items.filter((i) => i.id !== id);
    set({ items: updated });
    localStorage.setItem(getItemStorageKey(), JSON.stringify(updated));
  },

  toggleItemAvailability: (id: string) => {
    const updated = get().items.map((i) =>
      i.id === id ? { ...i, isAvailable: !i.isAvailable } : i
    );
    set({ items: updated });
    localStorage.setItem(getItemStorageKey(), JSON.stringify(updated));

    // Try background API update if available
    apiClient.patch(`/menu/items/${id}/toggle-availability`).catch(() => {
      // Ignore background failure, local state is preserved
    });
  },

  setItemAvailability: (id: string, isAvailable: boolean) => {
    const updated = get().items.map((i) =>
      i.id === id ? { ...i, isAvailable } : i
    );
    set({ items: updated });
    localStorage.setItem(getItemStorageKey(), JSON.stringify(updated));
  },

  resetToDefaults: () => {
    const tenantId = getTenantId();
    if (!tenantId) {
      set({ categories: DEFAULT_CATEGORIES, items: DEFAULT_ITEMS });
      localStorage.setItem('pbk_pos_categories_demo', JSON.stringify(DEFAULT_CATEGORIES));
      localStorage.setItem('pbk_pos_items_demo', JSON.stringify(DEFAULT_ITEMS));
    } else {
      set({ categories: [], items: [] });
      localStorage.removeItem(getCategoryStorageKey(tenantId));
      localStorage.removeItem(getItemStorageKey(tenantId));
    }
  },
}));
