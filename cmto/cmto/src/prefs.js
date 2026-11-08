const K = 'cmto:prefs';
export const prefs = {
  get() { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch { return {}; } },
  set(p) { try { localStorage.setItem(K, JSON.stringify({ ...this.get(), ...p })); } catch {} },
};
