/**
 * ΔTOM // VizState — optimized front-end state manager for complex data visualizations
 *
 * - Single source of truth for all chart/viz state
 * - Batched DOM updates via requestAnimationFrame
 * - Selector memoization (avoids redundant re-renders)
 * - Time-sliced updates for large datasets (no jank)
 * - DevTools integration via window.__DTOM_DEVTOOLS__
 */

class VizState {
  constructor(initialState = {}) {
    this._state = JSON.parse(JSON.stringify(initialState));
    this._prev  = JSON.parse(JSON.stringify(initialState));
    this._listeners = new Map();  // selector -> Set<callback>
    this._memoCache = new Map();  // selector -> { val, deps }
    this._rafId = null;
    this._pendingUpdates = [];
    this._batchDepth = 0;
    this._devtools = typeof window !== 'undefined' && window.__DTOM_DEVTOOLS__;
  }

  // Get deeply nested value with dot-path support
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this._state);
  }

  // Memoized selector — only recomputes when dependencies change
  select(selectorFn, deps = []) {
    const key = selectorFn.toString();
    const cached = this._memoCache.get(key);
    const depsChanged = !cached || deps.some((d, i) => !Object.is(d, cached.deps[i]));
    if (depsChanged || !cached) {
      const val = selectorFn(this._state);
      this._memoCache.set(key, { val, deps });
      return val;
    }
    return cached.val;
  }

  // Subscribe to a path (fires only when that path changes)
  on(path, callback) {
    if (!this._listeners.has(path)) this._listeners.set(path, new Set());
    this._listeners.get(path).add(callback);
    return () => this._listeners.get(path)?.delete(callback);
  }

  // Batched update — multiple set() calls in one rAF cycle = one render
  set(path, value) {
    this._pendingUpdates.push({ path, value });
    if (!this._rafId) {
      this._rafId = requestAnimationFrame(() => this._flush());
    }
    return this;
  }

  // Immediate update (bypass batching — use sparingly for user input)
  setImmediate(path, value) {
    this._applyUpdate(path, value);
    this._notifyListeners([path]);
  }

  // Batch multiple updates (synchronous grouping)
  batch(fn) {
    this._batchDepth++;
    fn(this.set.bind(this));
    this._batchDepth--;
    if (this._batchDepth === 0 && this._pendingUpdates.length) {
      this._flush();
    }
  }

  // Time-sliced bulk data update — for large datasets, yields to browser every 16ms
  async setLargeDataset(path, data, chunkSize = 100) {
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) chunks.push(data.slice(i, i + chunkSize));
    const accumulated = [];
    for (const chunk of chunks) {
      accumulated.push(...chunk);
      this._applyUpdate(path, [...accumulated]);
      this._notifyListeners([path]);
      await new Promise(r => setTimeout(r, 0)); // yield to browser
    }
  }

  _flush() {
    this._rafId = null;
    if (!this._pendingUpdates.length) return;
    const changedPaths = [];
    for (const { path, value } of this._pendingUpdates) {
      this._applyUpdate(path, value);
      changedPaths.push(path);
    }
    this._pendingUpdates = [];
    this._invalidateMemo(changedPaths);
    this._notifyListeners(changedPaths);
    if (this._devtools) this._devtools.update(this._state, changedPaths);
  }

  _applyUpdate(path, value) {
    const keys = path.split('.');
    let obj = this._state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (typeof obj[keys[i]] !== 'object' || obj[keys[i]] === null) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
  }

  _notifyListeners(changedPaths) {
    const notified = new Set();
    for (const path of changedPaths) {
      // Notify exact path and all parent paths
      const parts = path.split('.');
      for (let i = parts.length; i > 0; i--) {
        const p = parts.slice(0, i).join('.');
        if (!notified.has(p) && this._listeners.has(p)) {
          notified.add(p);
          const val = this.get(p);
          const prev = p.split('.').reduce((o, k) => o?.[k], this._prev);
          if (!Object.is(val, prev)) {
            this._listeners.get(p).forEach(fn => fn(val, prev));
          }
        }
      }
    }
    this._prev = JSON.parse(JSON.stringify(this._state));
  }

  _invalidateMemo(changedPaths) {
    // Simple: invalidate all memo entries when any path changes
    // (could optimize with dependency tracking later)
    if (changedPaths.length) this._memoCache.clear();
  }

  // Snapshot for debugging
  snapshot() { return JSON.parse(JSON.stringify(this._state)); }
}

// Global viz state for ΔTOM dashboard
const vizState = new VizState({
  crisisMap: { activeSegment: 0, hoveredSegment: null, autoCycle: true },
  flywheel:  { activeNode: 0 },
  calculator: { qpm: 5000, edgeOffload: 40, peakMultiplier: 3, cacheHitRate: 18 },
  ui: { theme: 'dark', drawerOpen: false, navOpen: false },
   { sources: [], crisisData: [], metrics: {} },
});

// Expose globally
if (typeof window !== 'undefined') {
  window.VizState = VizState;
  window.vizState = vizState;
}
if (typeof module !== 'undefined') module.exports = { VizState, vizState };
