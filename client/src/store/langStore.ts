import { create } from 'zustand';

export type Language = 'en' | 'mr' | 'hi';

interface Translations {
  newOrder: string;
  billNo: string;
  kotNo: string;
  itemOnOff: string;
  store: string;
  liveView: string;
  orders: string;
  recent: string;
  hold: string;
  alerts: string;
  logout: string;
  dineIn: string;
  delivery: string;
  pickUp: string;
  takeAway: string;
  parcel: string;
  items: string;
  qty: string;
  price: string;
  total: string;
  save: string;
  savePrint: string;
  saveEbill: string;
  kot: string;
  kotPrint: string;
  split: string;
  notPaid: string;
  cash: string;
  card: string;
  operations: string;
  reports: string;
  settings: string;
  cafeMode: string;
  restaurantMode: string;
  simulateOrder: string;
}

const translations: Record<Language, Translations> = {
  en: {
    newOrder: 'New Order',
    billNo: 'Bill No',
    kotNo: 'KOT No.',
    itemOnOff: 'Item On/Off',
    store: 'Store',
    liveView: 'Live View',
    orders: 'Orders',
    recent: 'Recent',
    hold: 'Hold',
    alerts: 'Alerts',
    logout: 'Logout',
    dineIn: 'Dine In',
    delivery: 'Delivery',
    pickUp: 'Pick Up',
    takeAway: 'Take Away',
    parcel: 'Parcel',
    items: 'ITEMS',
    qty: 'QTY.',
    price: 'PRICE',
    total: 'Total',
    save: 'Save',
    savePrint: 'Save & Print',
    saveEbill: 'Save & EBill',
    kot: 'KOT',
    kotPrint: 'KOT & Print',
    split: 'Split',
    notPaid: 'Not Paid',
    cash: 'Cash',
    card: 'Card',
    operations: 'Operations',
    reports: 'Reports',
    settings: 'Settings',
    cafeMode: 'Cafe POS Mode',
    restaurantMode: 'Restaurant POS Mode',
    simulateOrder: 'Simulate Online Order',
  },
  mr: {
    newOrder: 'नवीन ऑर्डर',
    billNo: 'बिल क्र.',
    kotNo: 'केओटी क्र.',
    itemOnOff: 'आइटम ऑन/ऑफ',
    store: 'स्टोअर',
    liveView: 'लाईव्ह व्ह्यू',
    orders: 'ऑर्डर्स',
    recent: 'मागील',
    hold: 'होल्ड',
    alerts: 'सूचना',
    logout: 'लॉगआउट',
    dineIn: 'डायन इन',
    delivery: 'डिलिव्हरी',
    pickUp: 'पिक अप',
    takeAway: 'टेक अवे',
    parcel: 'पार्सल',
    items: 'पदार्थ',
    qty: 'नग',
    price: 'किंमत',
    total: 'एकूण',
    save: 'जतन करा',
    savePrint: 'जतन व प्रिंट',
    saveEbill: 'ई-बिल पाठवा',
    kot: 'केओटी',
    kotPrint: 'केओटी व प्रिंट',
    split: 'बिल वाटा (Split)',
    notPaid: 'बाकी',
    cash: 'रोख (Cash)',
    card: 'कार्ड',
    operations: 'ऑपरेशन्स',
    reports: 'अहवाल',
    settings: 'सेटिंग्ज',
    cafeMode: 'कॅफे पीओएस मोड',
    restaurantMode: 'रेस्टॉरंट पीओएस मोड',
    simulateOrder: 'ऑनलाईन ऑर्डर सिम्युलेट करा',
  },
  hi: {
    newOrder: 'नई आर्डर',
    billNo: 'बिल नं.',
    kotNo: 'केओटी नं.',
    itemOnOff: 'आइटम ऑन/ऑफ',
    store: 'स्टोर',
    liveView: 'लाइव व्यू',
    orders: 'ऑर्डर्स',
    recent: 'हालिया',
    hold: 'होल्ड',
    alerts: 'अलर्ट',
    logout: 'लॉगआउट',
    dineIn: 'डाइन इन',
    delivery: 'डिलीवरी',
    pickUp: 'पिक अप',
    takeAway: 'टेक अवे',
    parcel: 'पार्सल',
    items: 'आइटम्स',
    qty: 'मात्रा',
    price: 'मूल्य',
    total: 'कुल राशि',
    save: 'सेव करें',
    savePrint: 'सेव और प्रिंट',
    saveEbill: 'ई-बिल भेजें',
    kot: 'केओटी',
    kotPrint: 'केओटी और प्रिंट',
    split: 'बिल स्प्लिट',
    notPaid: 'भुगतान बाकी',
    cash: 'नकद (Cash)',
    card: 'कार्ड',
    operations: 'ऑपरेशन्स',
    reports: 'रिपोर्ट्स',
    settings: 'सेटिंग्स',
    cafeMode: 'कैफे पीओएस मोड',
    restaurantMode: 'रेस्टोरेंट पीओएस मोड',
    simulateOrder: 'ऑनलाइन ऑर्डर सिमुलेट करें',
  },
};

interface LangState {
  currentLang: Language;
  posMode: 'restaurant' | 'cafe';
  setLanguage: (lang: Language) => void;
  setPosMode: (mode: 'restaurant' | 'cafe') => void;
  t: () => Translations;
}

export const useLangStore = create<LangState>((set, get) => ({
  currentLang: 'en',
  posMode: 'restaurant',
  setLanguage: (lang: Language) => set({ currentLang: lang }),
  setPosMode: (mode: 'restaurant' | 'cafe') => set({ posMode: mode }),
  t: () => translations[get().currentLang],
}));
