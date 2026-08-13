import type { AuthUser } from '@/types';

export type MockUserRecord = AuthUser & {
  password: string;
};

const STORAGE_KEY = 'haradan.mockUsers';

const SEED: MockUserRecord[] = [
  {
    id: 'user-demo',
    email: 'demo@cartzilla.com',
    password: 'password123',
    firstName: 'Demo',
    lastName: 'Haradan',
    phone: null,
  },
];

function readPersisted(): MockUserRecord[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockUserRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePersisted(users: MockUserRecord[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    const extra = users.filter((u) => u.id !== 'user-demo');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(extra));
  } catch {
    /* ignore */
  }
}

function merge(seed: MockUserRecord[], extra: MockUserRecord[]): MockUserRecord[] {
  const byEmail = new Map<string, MockUserRecord>();
  [...seed, ...extra].forEach((u) => {
    byEmail.set(u.email.toLowerCase(), u);
  });
  return [...byEmail.values()];
}

/** Mock kullanıcı dizini — kayıtlar localStorage’da kalır. */
export class MockUserDirectory {
  private users: MockUserRecord[];

  constructor() {
    this.users = merge(SEED, readPersisted());
  }

  list(): MockUserRecord[] {
    return this.users;
  }

  findByEmail(email: string): MockUserRecord | null {
    const key = email.trim().toLowerCase();
    return this.users.find((u) => u.email === key) ?? null;
  }

  add(user: MockUserRecord): void {
    this.users = this.users.filter((u) => u.email !== user.email);
    this.users.push(user);
    writePersisted(this.users);
  }
}

export const mockUserDirectory = new MockUserDirectory();

export function toAuthUser(record: MockUserRecord): AuthUser {
  return {
    id: record.id,
    email: record.email,
    firstName: record.firstName,
    lastName: record.lastName,
    phone: record.phone ?? null,
  };
}
