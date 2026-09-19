import { Appearance } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'haradan.themePreference';

type Listener = () => void;

let preference: ThemePreference = 'system';
let hydrated = false;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      /* ignore listener error */
    }
  });
}

function readStorage(): ThemePreference {
  if (typeof localStorage === 'undefined') return 'system';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') {
      return raw;
    }
    return 'system';
  } catch {
    return 'system';
  }
}

function writeStorage(pref: ThemePreference) {
  if (typeof localStorage === 'undefined') return;
  try {
    if (pref === 'system') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, pref);
    }
  } catch {
    /* ignore */
  }
}

function syncDom(resolved: ResolvedTheme) {
  if (typeof document !== 'undefined') {
    try {
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.style.colorScheme = resolved;
    } catch {
      /* ignore */
    }
  }
}

export function hydrateTheme(): ThemePreference {
  if (!hydrated) {
    preference = readStorage();
    hydrated = true;
    syncDom(getResolvedTheme());
  }
  return preference;
}

export function getThemePreference(): ThemePreference {
  hydrateTheme();
  return preference;
}

export function getResolvedTheme(): ResolvedTheme {
  const pref = getThemePreference();
  if (pref === 'light' || pref === 'dark') {
    return pref;
  }
  const system = Appearance.getColorScheme();
  return system === 'dark' ? 'dark' : 'light';
}

export function setThemePreference(next: ThemePreference): void {
  preference = next;
  hydrated = true;
  writeStorage(next);
  syncDom(getResolvedTheme());
  notify();
}

export function subscribeTheme(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

if (typeof Appearance !== 'undefined' && typeof Appearance.addChangeListener === 'function') {
  Appearance.addChangeListener(() => {
    if (preference === 'system') {
      syncDom(getResolvedTheme());
      notify();
    }
  });
}
