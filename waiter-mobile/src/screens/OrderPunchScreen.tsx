import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import type { MobileTable, MobileOrderItem } from '../types';
import { mobileApiClient } from '../services/apiClient';

interface OrderPunchScreenProps {
  table: MobileTable;
  onBack: () => void;
  onKOTFired: (tableNum: string, items: MobileOrderItem[]) => void;
}

const defaultMenu = [
  { id: 'm1', name: 'Paneer Butter Masala', category: 'Main Course', price: 280, isVeg: true },
  { id: 'm2', name: 'Dal Makhani', category: 'Main Course', price: 240, isVeg: true },
  { id: 'm3', name: 'Butter Chicken Handi', category: 'Main Course', price: 340, isVeg: false },
  { id: 'm4', name: 'Chicken Dum Biryani', category: 'Rice', price: 320, isVeg: false },
  { id: 'm5', name: 'Butter Naan', category: 'Breads', price: 60, isVeg: true },
  { id: 'm6', name: 'Garlic Roti', category: 'Breads', price: 40, isVeg: true },
  { id: 'm7', name: 'Cold Coffee Float', category: 'Drinks', price: 150, isVeg: true },
  { id: 'm8', name: 'Oreo Thick Shake', category: 'Drinks', price: 180, isVeg: true },
  { id: 'm9', name: 'Paneer Tikka Angara', category: 'Starters', price: 260, isVeg: true },
];

export const OrderPunchScreen: React.FC<OrderPunchScreenProps> = ({
  table,
  onBack,
  onKOTFired,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<MobileOrderItem[]>([]);
  const [noteItem, setNoteItem] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [menu, setMenu] = useState(defaultMenu);
  const [categories, setCategories] = useState<string[]>(['All', 'Starters', 'Main Course', 'Breads', 'Rice', 'Drinks']);

  useEffect(() => {
    mobileApiClient.get('/menu/items')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const apiMenu = res.data.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            category: item.categoryName || 'Main Course',
            price: Number(item.price) || 0,
            isVeg: Boolean(item.isVeg),
          }));
          setMenu(apiMenu);
          const uniqueCats = ['All', ...new Set(apiMenu.map((m: any) => m.category))] as string[];
          setCategories(uniqueCats);
        }
      })
      .catch(() => {
        // Fallback to defaultMenu
      });
  }, []);

  const filteredMenu = menu.filter((item) => {
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAddItem = (dish: any) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.itemId === dish.id);
      if (existing) {
        return prev.map((ci) =>
          ci.itemId === dish.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [
        ...prev,
        {
          itemId: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: 1,
          isVeg: dish.isVeg,
        },
      ];
    });
  };

  const handleDecreaseItem = (dishId: string) => {
    setCart((prev) =>
      prev
        .map((ci) => (ci.itemId === dishId ? { ...ci, quantity: ci.quantity - 1 } : ci))
        .filter((ci) => ci.quantity > 0)
    );
  };

  const totalQuantity = cart.reduce((acc, it) => acc + it.quantity, 0);
  const subTotal = cart.reduce((acc, it) => acc + it.price * it.quantity, 0);

  const handleFireKOT = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Order', 'Please add items before firing KOT to kitchen.');
      return;
    }

    Alert.alert(
      'Confirm KOT Dispatch',
      `Send ${totalQuantity} items for ${table.tableNumber} directly to Kitchen KDS?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '🔥 FIRE KOT',
          style: 'default',
          onPress: () => {
            onKOTFired(table.tableNumber, cart);
          },
        },
      ]
    );
  };

  const saveNote = (dishId: string) => {
    if (tempNote.trim()) {
      setCart((prev) =>
        prev.map((ci) => (ci.itemId === dishId ? { ...ci, notes: tempNote.trim() } : ci))
      );
    }
    setNoteItem(null);
    setTempNote('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.tableTitle}>{table.tableNumber}</Text>
          <Text style={styles.tableSub}>{table.section} • {table.capacity} Seats</Text>
        </View>

        <View style={styles.cartCountBadge}>
          <Text style={styles.cartCountText}>{totalQuantity} Qty</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search dishes (e.g. Naan, Paneer)..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* Category Pills */}
      <View style={styles.categoryScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsList}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setSelectedCategory(c)}
              style={[
                styles.catPill,
                selectedCategory === c ? styles.catPillActive : styles.catPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.catText,
                  selectedCategory === c ? styles.catTextActive : styles.catTextInactive,
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Menu List */}
      <ScrollView contentContainerStyle={styles.menuList}>
        {filteredMenu.map((dish) => {
          const inCart = cart.find((ci) => ci.itemId === dish.id);

          return (
            <View key={dish.id} style={styles.dishCard}>
              <View style={styles.dishLeft}>
                <View style={styles.nameRow}>
                  <Text style={styles.vegIcon}>{dish.isVeg ? '🟢' : '🔴'}</Text>
                  <Text style={styles.dishName}>{dish.name}</Text>
                </View>
                <Text style={styles.dishPrice}>₹{dish.price}</Text>

                {inCart?.notes && (
                  <Text style={styles.noteDisplay}>Note: {inCart.notes}</Text>
                )}
              </View>

              <View style={styles.dishRight}>
                {inCart ? (
                  <View style={styles.qtyCounter}>
                    <TouchableOpacity
                      onPress={() => handleDecreaseItem(dish.id)}
                      style={styles.counterBtn}
                    >
                      <Text style={styles.counterText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.qtyText}>{inCart.quantity}</Text>

                    <TouchableOpacity
                      onPress={() => handleAddItem(dish)}
                      style={styles.counterBtn}
                    >
                      <Text style={styles.counterText}>+</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setNoteItem(dish.id);
                        setTempNote(inCart.notes || '');
                      }}
                      style={styles.noteBtn}
                    >
                      <Text style={styles.noteBtnText}>✎</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleAddItem(dish)}
                    style={styles.addBtn}
                  >
                    <Text style={styles.addBtnText}>+ ADD</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Note Modal */}
      {noteItem && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Cooking Note / Special Request</Text>
            <TextInput
              placeholder="e.g. Extra spicy, No onion, Jain..."
              placeholderTextColor="#64748b"
              value={tempNote}
              onChangeText={setTempNote}
              style={styles.noteInput}
              autoFocus
            />

            <View style={styles.quickTagsContainer}>
              {['Less Spicy', 'Extra Spicy', 'No Onion', 'Jain', 'Parcel', 'Extra Butter'].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => setTempNote((prev) => (prev ? `${prev}, ${tag}` : tag))}
                  style={styles.quickTag}
                >
                  <Text style={styles.quickTagText}>+{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setNoteItem(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => saveNote(noteItem)} style={styles.saveBtn}>
                <Text style={styles.saveText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Floating KOT Footer */}
      {cart.length > 0 && (
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerTotal}>₹{subTotal}</Text>
            <Text style={styles.footerItems}>{totalQuantity} Items • KOT Ready</Text>
          </View>

          <TouchableOpacity onPress={handleFireKOT} style={styles.fireBtn}>
            <Text style={styles.fireBtnText}>🔥 FIRE KOT TO KITCHEN</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
  },
  headerCenter: {
    alignItems: 'center',
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  tableSub: {
    fontSize: 11,
    color: '#64748b',
  },
  cartCountBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cartCountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  searchBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  categoryScroll: {
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  pillsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  catPillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  catPillInactive: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  catText: {
    fontSize: 11,
    fontWeight: '700',
  },
  catTextActive: {
    color: '#ffffff',
  },
  catTextInactive: {
    color: '#64748b',
  },
  menuList: {
    padding: 16,
    paddingBottom: 100,
    gap: 10,
  },
  dishCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  dishLeft: {
    flex: 1,
    paddingRight: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vegIcon: {
    fontSize: 10,
  },
  dishName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  dishPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d97706',
    marginTop: 4,
  },
  noteDisplay: {
    fontSize: 10,
    color: '#ea580c',
    marginTop: 3,
    fontStyle: 'italic',
  },
  dishRight: {
    alignItems: 'flex-end',
  },
  addBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  qtyCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  counterText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  qtyText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
    minWidth: 18,
    textAlign: 'center',
  },
  noteBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  noteBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    padding: 20,
    zIndex: 100,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  noteInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 10,
  },
  quickTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  quickTag: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  quickTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  cancelText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  saveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  footerTotal: {
    color: '#d97706',
    fontSize: 18,
    fontWeight: '900',
  },
  footerItems: {
    color: '#64748b',
    fontSize: 10,
  },
  fireBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fireBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
