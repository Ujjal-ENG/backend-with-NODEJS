export default class CacheService {
  constructor({ ttlMinutes = 15 } = {}) {
    this.ttlMs = ttlMinutes * 60 * 1000;
    this.entry = null;
  }

  set(payload) {
    const now = Date.now();
    this.entry = {
      payload,
      updatedAt: now,
      expiresAt: now + this.ttlMs
    };
    return this.entry;
  }

  get() {
    return this.entry;
  }

  clear() {
    this.entry = null;
  }

  hasValue() {
    return Boolean(this.entry?.payload);
  }

  isFresh() {
    if (!this.entry) return false;
    return this.entry.expiresAt > Date.now();
  }

  getAgeSeconds() {
    if (!this.entry) return null;
    return Math.floor((Date.now() - this.entry.updatedAt) / 1000);
  }
}
