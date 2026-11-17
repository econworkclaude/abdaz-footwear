import AsyncStorage from '@react-native-async-storage/async-storage';

/** AsyncStorage, falling back to memory where storage is blocked (e.g. a sandboxed web preview). */
const mem = new Map<string, string>();
export const safeStorage = {
  getItem: async (k: string) => {
    try {
      return (await AsyncStorage.getItem(k)) ?? mem.get(k) ?? null;
    } catch {
      return mem.get(k) ?? null;
    }
  },
  setItem: async (k: string, v: string) => {
    mem.set(k, v);
    try {
      await AsyncStorage.setItem(k, v);
    } catch {}
  },
  removeItem: async (k: string) => {
    mem.delete(k);
    try {
      await AsyncStorage.removeItem(k);
    } catch {}
  },
};
