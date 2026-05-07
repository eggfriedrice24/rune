import { LazyStore } from "@tauri-apps/plugin-store";
import type { StateStorage } from "zustand/middleware";

const SETTINGS_FILE = "settings.json";

const store = new LazyStore(SETTINGS_FILE);

export const tauriStoreStorage: StateStorage = {
  getItem: async (name) => (await store.get<string>(name)) ?? null,
  setItem: async (name, value) => {
    await store.set(name, value);
    await store.save();
  },
  removeItem: async (name) => {
    await store.delete(name);
    await store.save();
  },
};
