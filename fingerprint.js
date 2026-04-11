/**
 * Production-Grade Browser Fingerprinting Library
 * Comprehensive device identification with 50+ detection methods
 * Optimized for high reliability and performance (100k+ requests)
 * Version: 3.0.0 (P0 fixes + P1 caching & configuration + Strategy Pattern)
 */

// ============================================================================
// P0 FIX: Structured Error Logging System
// ============================================================================
const Logger = {
  enabled: true,
  level: 'error', // 'debug', 'info', 'warn', 'error'
  
  log(level, context, message, error = null, metadata = {}) {
    if (!this.enabled) return;
    
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] < levels[this.level]) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: `[Fingerprint:${context}]`,
      message,
      ...(error && { 
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      }),
      ...metadata
    };
    
    // Console logging (can be replaced with external service)
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](logEntry.context, message, error || '', metadata);
    
    // In production, send to monitoring service:
    // if (level === 'error' && window.monitoringService) {
    //   window.monitoringService.logError(logEntry);
    // }
  },
  
  error(context, message, error, metadata) {
    this.log('error', context, message, error, metadata);
  },
  
  warn(context, message, metadata) {
    this.log('warn', context, message, null, metadata);
  },
  
  info(context, message, metadata) {
    this.log('info', context, message, null, metadata);
  },
  
  debug(context, message, metadata) {
    this.log('debug', context, message, null, metadata);
  }
};

// ============================================================================
// P0 FIX: Resource Cleanup Utilities
// ============================================================================
const ResourceManager = {
  // Cleanup canvas element
  cleanupCanvas(canvas) {
    if (!canvas) return;
    try {
      canvas.width = 0;
      canvas.height = 0;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 0, 0);
      }
    } catch (e) {
      Logger.warn('ResourceManager', 'Canvas cleanup failed', { error: e.message });
    }
  },
  
  // Cleanup WebGL context
  cleanupWebGL(gl) {
    if (!gl) return;
    try {
      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
      }
      // Clear any remaining state
      const canvas = gl.canvas;
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
    } catch (e) {
      Logger.warn('ResourceManager', 'WebGL cleanup failed', { error: e.message });
    }
  },
  
  // Cleanup AudioContext
  cleanupAudioContext(context) {
    if (!context) return;
    try {
      if (context.state !== 'closed') {
        context.close().catch(e => {
          Logger.warn('ResourceManager', 'AudioContext close failed', { error: e.message });
        });
      }
    } catch (e) {
      Logger.warn('ResourceManager', 'AudioContext cleanup failed', { error: e.message });
    }
  },
  
  // Cleanup DOM element
  cleanupDOMElement(element) {
    if (!element) return;
    try {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    } catch (e) {
      Logger.warn('ResourceManager', 'DOM cleanup failed', { error: e.message });
    }
  },
  
  // Cleanup WebRTC PeerConnection
  cleanupPeerConnection(pc) {
    if (!pc) return;
    try {
      if (pc.connectionState !== 'closed' && pc.connectionState !== 'failed') {
        pc.close();
      }
    } catch (e) {
      Logger.warn('ResourceManager', 'PeerConnection cleanup failed', { error: e.message });
    }
  }
};

// ============================================================================
// P1 IMPROVEMENT: Configuration System
// ============================================================================
const Config = {
  // Default configuration
  defaults: {
    // Timeouts (in milliseconds)
    timeouts: {
      audio: 5000,
      mediaDevices: 3000,
      storage: 2000,
      permissions: 1000,
      battery: 2000,
      webRTC: 2000,
      fontDetection: 5000
    },
    
    // Feature flags - enable/disable detection methods
    features: {
      canvas: true,
      webgl: true,
      audio: true,
      fonts: true,
      mediaDevices: true,
      webRTC: true,
      battery: true,
      permissions: true,
      storage: true,
      plugins: true,
      screen: true,
      timeZone: true,
      userAgent: true,
      language: true,
      platform: true,
      connection: true,
      touch: true,
      speechVoices: true,
      mediaQueries: true,
      features: true,
      performance: true,
      math: true,
      dateTime: true,
      privacy: true,
      history: true,
      codecs: true,
      orientation: true,
      deviceMotion: true
    },
    
    // Caching configuration
    cache: {
      enabled: true,
      ttl: 3600000, // 1 hour in milliseconds
      maxSize: 100, // Maximum number of cached entries
      storage: 'memory' // 'memory' or 'indexedDB'
    },
    
    // Font list for detection
    fontList: [
      "Arial", "Verdana", "Times New Roman", "Courier New", "Roboto",
      "Open Sans", "Noto Sans", "Helvetica", "Tahoma", "Georgia", "Comic Sans MS",
      "Impact", "Lucida Console", "Palatino", "Garamond", "Bookman", "Trebuchet MS",
      "Arial Black", "Comic Sans", "Courier", "Lucida Sans Unicode", "MS Sans Serif",
      "MS Serif", "Symbol", "Times", "Wingdings", "Zapf Dingbats"
    ],
    
    // Performance settings
    performance: {
      useRequestIdleCallback: true,
      fontDetectionBatchSize: 5,
      fontDetectionIdleTimeout: 5000
    }
  },
  
  // Current configuration (merged with defaults)
  current: {},
  
  // Initialize configuration
  init(userConfig = {}) {
    this.current = this.deepMerge({}, this.defaults, userConfig);
    Logger.info('Config', 'Configuration initialized', { 
      cacheEnabled: this.current.cache.enabled,
      featuresCount: Object.keys(this.current.features).filter(k => this.current.features[k]).length
    });
    return this.current;
  },
  
  // Deep merge utility
  deepMerge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
    
    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
    
    return this.deepMerge(target, ...sources);
  },
  
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  },
  
  // Get configuration value
  get(path, defaultValue = null) {
    const keys = path.split('.');
    let value = this.current;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  },
  
  // Update configuration
  update(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.current;
    
    for (const key of keys) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key];
    }
    
    target[lastKey] = value;
    Logger.info('Config', `Configuration updated: ${path}`, { value });
  }
};

// Initialize with defaults
Config.init();

// ============================================================================
// P1 IMPROVEMENT: Caching Layer
// ============================================================================
const Cache = {
  // Memory cache
  memoryCache: new Map(),
  
  // IndexedDB cache (lazy initialization)
  indexedDBCache: null,
  indexedDBReady: false,
  
  // Initialize IndexedDB cache
  async initIndexedDB() {
    if (!window.indexedDB) {
      Logger.warn('Cache', 'IndexedDB not available, using memory cache only');
      return false;
    }
    
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('FingerprintCache', 1);
        
        request.onerror = () => {
          Logger.warn('Cache', 'IndexedDB open failed', { error: request.error });
          resolve(false);
        };
        
        request.onsuccess = () => {
          this.indexedDBCache = request.result;
          this.indexedDBReady = true;
          Logger.info('Cache', 'IndexedDB cache initialized');
          resolve(true);
        };
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('fingerprints')) {
            const objectStore = db.createObjectStore('fingerprints', { keyPath: 'key' });
            objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
      } catch (e) {
        Logger.error('Cache', 'IndexedDB initialization failed', e);
        resolve(false);
      }
    });
  },
  
  // Generate cache key from stable fingerprint components
  generateCacheKey(stableComponents) {
    const keyString = JSON.stringify(stableComponents);
    return simpleHash(keyString);
  },
  
  // Get stable components (components that don't change frequently)
  getStableComponents(fingerprint) {
    return {
      screen: fingerprint.screen ? {
        width: fingerprint.screen.width,
        height: fingerprint.screen.height,
        colorDepth: fingerprint.screen.colorDepth,
        pixelRatio: fingerprint.screen.pixelRatio
      } : null,
      platform: fingerprint.platform,
      language: fingerprint.language,
      timeZone: fingerprint.timeZone ? {
        name: fingerprint.timeZone.name,
        offsetMinutes: fingerprint.timeZone.offsetMinutes
      } : null,
      userAgent: fingerprint.userAgent ? {
        platform: fingerprint.userAgent.platform,
        vendor: fingerprint.userAgent.vendor
      } : null,
      webgl: fingerprint.webgl ? {
        vendor: fingerprint.webgl.vendor,
        renderer: fingerprint.webgl.renderer,
        version: fingerprint.webgl.version
      } : null,
      canvas: fingerprint.canvasFingerprint ? {
        basic: fingerprint.canvasFingerprint.basic
      } : null,
      audio: fingerprint.audioFingerprint ? {
        fingerprint: fingerprint.audioFingerprint.fingerprint,
        sampleRate: fingerprint.audioFingerprint.sampleRate
      } : null,
      fonts: fingerprint.fonts,
      features: fingerprint.features
    };
  },
  
  // Get from cache
  async get(key) {
    if (!Config.get('cache.enabled')) {
      return null;
    }
    
    const storage = Config.get('cache.storage', 'memory');
    const ttl = Config.get('cache.ttl', 3600000);
    const now = Date.now();
    
    // Try memory cache first
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key);
      if (now - entry.timestamp < ttl) {
        Logger.debug('Cache', 'Cache hit (memory)', { key });
        return entry.data;
      } else {
        // Expired, remove from cache
        this.memoryCache.delete(key);
      }
    }
    
    // Try IndexedDB cache if enabled
    if (storage === 'indexedDB' && this.indexedDBReady && this.indexedDBCache) {
      try {
        const transaction = this.indexedDBCache.transaction(['fingerprints'], 'readonly');
        const store = transaction.objectStore('fingerprints');
        const request = store.get(key);
        
        return new Promise((resolve) => {
          request.onsuccess = () => {
            const entry = request.result;
            if (entry && (now - entry.timestamp < ttl)) {
              // Also store in memory cache for faster access
              this.memoryCache.set(key, entry);
              Logger.debug('Cache', 'Cache hit (IndexedDB)', { key });
              resolve(entry.data);
            } else {
              if (entry) {
                // Expired, remove from IndexedDB
                this.delete(key);
              }
              resolve(null);
            }
          };
          
          request.onerror = () => {
            Logger.warn('Cache', 'IndexedDB get failed', { error: request.error });
            resolve(null);
          };
        });
      } catch (e) {
        Logger.warn('Cache', 'IndexedDB get error', { error: e.message });
        return null;
      }
    }
    
    return null;
  },
  
  // Set cache
  async set(key, data) {
    if (!Config.get('cache.enabled')) {
      return;
    }
    
    const storage = Config.get('cache.storage', 'memory');
    const maxSize = Config.get('cache.maxSize', 100);
    const entry = {
      key,
      data,
      timestamp: Date.now()
    };
    
    // Store in memory cache
    this.memoryCache.set(key, entry);
    
    // Enforce max size (LRU eviction)
    if (this.memoryCache.size > maxSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    
    // Store in IndexedDB if enabled
    if (storage === 'indexedDB' && this.indexedDBReady && this.indexedDBCache) {
      try {
        const transaction = this.indexedDBCache.transaction(['fingerprints'], 'readwrite');
        const store = transaction.objectStore('fingerprints');
        await new Promise((resolve, reject) => {
          const request = store.put(entry);
          request.onsuccess = () => {
            Logger.debug('Cache', 'Cache set (IndexedDB)', { key });
            resolve();
          };
          request.onerror = () => {
            Logger.warn('Cache', 'IndexedDB set failed', { error: request.error });
            reject(request.error);
          };
        });
      } catch (e) {
        Logger.warn('Cache', 'IndexedDB set error', { error: e.message });
      }
    }
  },
  
  // Delete from cache
  async delete(key) {
    this.memoryCache.delete(key);
    
    if (this.indexedDBCache && this.indexedDBReady) {
      try {
        const transaction = this.indexedDBCache.transaction(['fingerprints'], 'readwrite');
        const store = transaction.objectStore('fingerprints');
        await new Promise((resolve, reject) => {
          const request = store.delete(key);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (e) {
        Logger.warn('Cache', 'IndexedDB delete error', { error: e.message });
      }
    }
  },
  
  // Clear all cache
  async clear() {
    this.memoryCache.clear();
    
    if (this.indexedDBCache && this.indexedDBReady) {
      try {
        const transaction = this.indexedDBCache.transaction(['fingerprints'], 'readwrite');
        const store = transaction.objectStore('fingerprints');
        await new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => {
            Logger.info('Cache', 'Cache cleared');
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
      } catch (e) {
        Logger.warn('Cache', 'IndexedDB clear error', { error: e.message });
      }
    }
  },
  
  // Get cache statistics
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      indexedDBReady: this.indexedDBReady,
      enabled: Config.get('cache.enabled'),
      storage: Config.get('cache.storage'),
      ttl: Config.get('cache.ttl'),
      maxSize: Config.get('cache.maxSize')
    };
  }
};

// Initialize IndexedDB cache if configured
if (Config.get('cache.storage') === 'indexedDB') {
  Cache.initIndexedDB().catch(e => {
    Logger.warn('Cache', 'IndexedDB initialization deferred', { error: e.message });
  });
}

// ============================================================================
// P2 IMPROVEMENT: Strategy Pattern Implementation
// ============================================================================

/**
 * Base Strategy Interface
 * All fingerprint detection strategies must extend this class
 */
class FingerprintStrategy {
  constructor(config = {}) {
    this.config = config;
    this.name = this.constructor.name;
    this.enabled = true;
    this.priority = 100; // Lower = higher priority (default: 100)
    this.timeout = null;
    this.requiresAsync = false;
  }

  /**
   * Check if strategy is enabled
   */
  isEnabled() {
    return this.enabled && Config.get(`features.${this.getFeatureKey()}`, true);
  }

  /**
   * Get feature flag key (e.g., 'canvas', 'webgl')
   */
  getFeatureKey() {
    // Convert "CanvasStrategy" -> "canvas", "WebGLStrategy" -> "webgl", etc.
    const nameWithoutStrategy = this.name.replace(/Strategy$/, '');
    
    // Handle special cases
    const specialCases = {
      'FontDetection': 'fonts',
      'MediaDevices': 'mediaDevices',
      'SpeechVoices': 'speechVoices',
      'MediaQueries': 'mediaQueries',
      'FeatureDetection': 'features',
      'ScreenOrientation': 'orientation',
      'DeviceMotion': 'deviceMotion',
      'MediaCodecs': 'codecs',
      'WebRTC': 'webRTC',
      'WebGL': 'webgl',
      'UserAgent': 'userAgent',
      'TimeZone': 'timeZone'
    };
    
    if (specialCases[nameWithoutStrategy]) {
      return specialCases[nameWithoutStrategy];
    }
    
    // Default: convert camelCase to camelCase (already correct)
    // Or convert PascalCase to camelCase
    return nameWithoutStrategy.charAt(0).toLowerCase() + nameWithoutStrategy.slice(1);
  }

  /**
   * Collect fingerprint data
   * Wraps execute() with error handling and logging
   */
  async collect() {
    if (!this.isEnabled()) {
      Logger.debug(this.name, 'Strategy disabled');
      return null;
    }

    const startTime = performance.now();
    try {
      let result;
      if (this.timeout) {
        result = await withTimeout(
          this.execute(),
          this.timeout,
          null,
          this.name
        );
      } else {
        result = await this.execute();
      }
      
      const duration = performance.now() - startTime;
      Logger.debug(this.name, 'Strategy completed', { duration: duration.toFixed(2) + 'ms' });
      return result;
    } catch (error) {
      Logger.error(this.name, 'Strategy failed', error);
      return null;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Execute the actual detection logic
   * Must be implemented by subclasses
   */
  async execute() {
    throw new Error(`execute() must be implemented by ${this.name}`);
  }

  /**
   * Get stable components for caching
   * Returns null if not cacheable
   */
  getStableComponents(result) {
    return null; // Override in subclasses if cacheable
  }

  /**
   * Cleanup resources
   * Override in subclasses if needed
   */
  cleanup() {
    // Default: no cleanup needed
  }
}

/**
 * Strategy Registry
 * Manages all available fingerprint strategies
 */
class StrategyRegistry {
  constructor() {
    this.strategies = new Map();
  }

  /**
   * Register a strategy
   */
  register(strategy) {
    if (!(strategy instanceof FingerprintStrategy)) {
      throw new Error(`Strategy must extend FingerprintStrategy, got: ${strategy.constructor.name}`);
    }
    this.strategies.set(strategy.name, strategy);
    Logger.debug('StrategyRegistry', `Registered strategy: ${strategy.name}`, {
      priority: strategy.priority,
      requiresAsync: strategy.requiresAsync
    });
  }

  /**
   * Register multiple strategies
   */
  registerAll(strategies) {
    strategies.forEach(strategy => this.register(strategy));
  }

  /**
   * Get strategy by name
   */
  get(name) {
    return this.strategies.get(name);
  }

  /**
   * Get all enabled strategies, sorted by priority
   */
  getEnabledStrategies() {
    return Array.from(this.strategies.values())
      .filter(strategy => strategy.isEnabled())
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Disable a strategy
   */
  disable(name) {
    const strategy = this.strategies.get(name);
    if (strategy) {
      strategy.enabled = false;
      Logger.info('StrategyRegistry', `Disabled strategy: ${name}`);
    }
  }

  /**
   * Enable a strategy
   */
  enable(name) {
    const strategy = this.strategies.get(name);
    if (strategy) {
      strategy.enabled = true;
      Logger.info('StrategyRegistry', `Enabled strategy: ${name}`);
    }
  }

  /**
   * Get all registered strategies
   */
  getAll() {
    return Array.from(this.strategies.values());
  }

  /**
   * Clear all strategies
   */
  clear() {
    this.strategies.clear();
    Logger.info('StrategyRegistry', 'All strategies cleared');
  }
}

/**
 * Fingerprint Collector
 * Manages strategy execution and result aggregation
 */
class FingerprintCollector {
  constructor(registry) {
    this.registry = registry || new StrategyRegistry();
  }

  /**
   * Collect fingerprint using all enabled strategies
   */
  async collect(userConfig = {}) {
    // Merge user config
    if (Object.keys(userConfig).length > 0) {
      Config.init(userConfig);
    }

    // Check cache first
    let cacheKey = null;
    if (Config.get('cache.enabled', true)) {
      try {
        const stableComponents = this.getStableComponentsForCache();
        cacheKey = Cache.generateCacheKey(stableComponents);
        
        const cachedResult = await Cache.get(cacheKey);
        if (cachedResult) {
          Logger.info('FingerprintCollector', 'Cache hit - returning cached fingerprint', { cacheKey });
          return {
            ...cachedResult,
            cached: true,
            cacheKey
          };
        }
        
        Logger.debug('FingerprintCollector', 'Cache miss - generating new fingerprint', { cacheKey });
      } catch (e) {
        Logger.warn('FingerprintCollector', 'Cache check failed, continuing with generation', { error: e.message });
      }
    }

    // Get enabled strategies
    const strategies = this.registry.getEnabledStrategies();
    Logger.info('FingerprintCollector', `Collecting with ${strategies.length} strategies`);

    // Execute strategies
    const results = await this.executeStrategies(strategies);

    // Aggregate results
    const fingerprintObject = this.aggregateResults(results);

    // Generate hash from STABLE components only (exclude time-based, random, dynamic values)
    const stableFingerprint = this.getStableFingerprint(fingerprintObject);
    
    // Sort keys to ensure consistent JSON.stringify order (important for hash consistency)
    const sortedStableFingerprint = this.sortObjectKeys(stableFingerprint);
    const fingerprintString = JSON.stringify(sortedStableFingerprint);
    const fingerprintHash = await cryptoHash(fingerprintString);

    const result = {
      fingerprint: fingerprintObject, // Full fingerprint (includes all data, even dynamic values)
      fingerprintHash, // Hash of STABLE components only (consistent across page loads)
      stableFingerprint: sortedStableFingerprint, // Stable components used for hash (sorted, for debugging)
      timestamp: Date.now(), // When fingerprint was generated (not used in hash)
      version: '3.0.0', // P0 fixes + P1 caching & configuration + P2 Strategy Pattern
      cached: false
    };

    // OPT: Consolidated cache write. The previous body had two copies of
    // this block — one for the happy-path cacheKey (computed pre-flight on
    // line ~767) and one for the fallback where the pre-flight key
    // computation threw. Both did exactly the same Cache.set with exactly
    // the same payload, so we keep the fallback key regeneration inline
    // and write once.
    if (Config.get('cache.enabled', true)) {
      try {
        if (!cacheKey) {
          const stableComponents = Cache.getStableComponents(fingerprintObject);
          cacheKey = Cache.generateCacheKey(stableComponents);
        }
        await Cache.set(cacheKey, {
          fingerprint: fingerprintObject,
          fingerprintHash,
          stableFingerprint: sortedStableFingerprint,
          timestamp: result.timestamp,
          version: result.version
        });
        result.cacheKey = cacheKey;
        Logger.info('FingerprintCollector', 'Fingerprint cached', { cacheKey });
      } catch (e) {
        Logger.warn('FingerprintCollector', 'Failed to cache fingerprint', { error: e.message });
      }
    }

    Logger.info('FingerprintCollector', 'Fingerprint generated successfully', {
      hashLength: fingerprintHash.length,
      timestamp: result.timestamp,
      strategiesUsed: strategies.length
    });

    return result;
  }

  /**
   * Execute all strategies in parallel
   */
  async executeStrategies(strategies) {
    const promises = strategies.map(strategy => strategy.collect());

    const results = await Promise.allSettled(promises);
    
    const strategyResults = {};
    strategies.forEach((strategy, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        strategyResults[strategy.name] = result.value;
      } else {
        Logger.error('FingerprintCollector', `Strategy ${strategy.name} failed`, result.reason);
        strategyResults[strategy.name] = null;
      }
    });

    return strategyResults;
  }

  /**
   * Aggregate strategy results into fingerprint object
   */
  aggregateResults(results) {
    // Map strategy names to fingerprint keys
    const keyMapping = {
      'TimeZoneStrategy': 'timeZone',
      'UserAgentStrategy': 'userAgent',
      'CanvasStrategy': 'canvasFingerprint',
      'FontDetectionStrategy': 'fonts',
      'ScreenStrategy': 'screen',
      'PluginsStrategy': 'plugins',
      'LanguageStrategy': 'language',
      'PlatformStrategy': 'platform',
      'WebGLStrategy': 'webgl',
      'AudioStrategy': 'audioFingerprint',
      'MediaDevicesStrategy': 'mediaDevices',
      'ConnectionStrategy': 'connection',
      'TouchStrategy': 'touch',
      'StorageStrategy': 'storage',
      'PermissionsStrategy': 'permissions',
      'SpeechVoicesStrategy': 'speechVoices',
      'BatteryStrategy': 'battery',
      'MediaQueriesStrategy': 'mediaQueries',
      'FeatureDetectionStrategy': 'features',
      'PerformanceStrategy': 'performance',
      'MathStrategy': 'math',
      'DateTimeStrategy': 'dateTime',
      'PrivacyStrategy': 'privacy',
      'HistoryStrategy': 'history',
      'MediaCodecsStrategy': 'codecs',
      'WebRTCStrategy': 'webRTC',
      'ScreenOrientationStrategy': 'orientation',
      'DeviceMotionStrategy': 'deviceMotion'
    };

    const fingerprint = {};
    for (const [strategyName, value] of Object.entries(results)) {
      const key = keyMapping[strategyName] || 
                  strategyName.toLowerCase().replace('strategy', '');
      fingerprint[key] = value;
    }

    return fingerprint;
  }

  /**
   * Get stable fingerprint (excludes time-based, random, dynamic values)
   * This ensures the hash remains consistent across page loads for the same device/browser
   * 
   * Excluded from hash (but included in full fingerprint object):
   * - Math.random() - changes every call
   * - Timestamps (Date.now(), performance.now()) - change constantly
   * - Performance timing - changes on every page load
   * - History.length - changes with navigation
   * - Battery level/time - changes over time
   * - Connection RTT/downlink - varies with network conditions
   * - Storage quota/usage - changes as data is stored
   * - Screen orientation angle - changes when device rotates
   * - Online status - can change with connectivity
   * 
   * Included in hash (stable characteristics):
   * - Hardware: screen size, color depth, pixel ratio, platform, architecture
   * - Software: user agent, browser, OS, language, timezone offset
   * - Capabilities: WebGL renderer, canvas fingerprint, audio fingerprint, fonts
   * - Features: available APIs, codec support, touch support
   */
  getStableFingerprint(fingerprintObject) {
    const stable = { ...fingerprintObject };
    
    // Canvas fingerprint: Only use basic hash (most stable)
    // Gradient and shadow can vary slightly due to rendering differences
    if (stable.canvasFingerprint) {
      stable.canvasFingerprint = {
        basic: stable.canvasFingerprint.basic
        // Exclude: gradient, shadow, textMetrics (less stable)
      };
    }
    
    // Remove time-based values from DateTime
    if (stable.dateTime) {
      stable.dateTime = {
        timezoneOffset: stable.dateTime.timezoneOffset
        // Exclude: timestamp, dateString, toISOString, precision
      };
    }
    
    // Remove random value from Math
    if (stable.math) {
      const mathStable = { ...stable.math };
      delete mathStable.random; // Math.random() changes every time
      stable.math = mathStable;
    }
    
    // Remove performance timing (changes on every page load)
    // ALL performance timing values are excluded: navigationStart, domInteractive, 
    // domComplete, loadEventEnd, connectEnd, connectStart, domainLookupEnd, 
    // domainLookupStart, fetchStart, responseEnd, responseStart
    // These ALL change on every page load and must be completely excluded
    if (stable.performance) {
      // Completely exclude performance timing - it's not stable for fingerprinting
      delete stable.performance; // Remove entirely from hash calculation
    }
    
    // Remove history.length (can change as user navigates)
    if (stable.history) {
      stable.history = {
        state: stable.history.state
        // Exclude: length (changes with navigation)
      };
    }
    
    // Remove battery level (changes over time)
    if (stable.battery) {
      const batteryStable = { ...stable.battery };
      delete batteryStable.level; // Battery level changes
      delete batteryStable.chargingTime; // Changes
      delete batteryStable.dischargingTime; // Changes
      // Keep only: charging (boolean, more stable)
      stable.battery = {
        charging: batteryStable.charging
      };
    }
    
    // Remove connection info that changes (rtt, downlink can vary)
    if (stable.connection) {
      const connectionStable = { ...stable.connection };
      delete connectionStable.rtt; // Round-trip time varies
      delete connectionStable.downlink; // Can change
      delete connectionStable.downlinkMax; // Can change
      // Keep: effectiveType, type, saveData (more stable)
      stable.connection = {
        effectiveType: connectionStable.effectiveType,
        type: connectionStable.type,
        saveData: connectionStable.saveData
      };
    }
    
    // Remove storage usage (can change)
    if (stable.storage) {
      const storageStable = { ...stable.storage };
      delete storageStable.quota; // Can change
      delete storageStable.usage; // Changes as data is stored
      delete storageStable.usageDetails; // Changes
      // Keep only: availability flags
      stable.storage = {
        localStorage: storageStable.localStorage,
        sessionStorage: storageStable.sessionStorage,
        indexedDB: storageStable.indexedDB,
        webSQL: storageStable.webSQL
      };
    }
    
    // Remove screen orientation angle (can change)
    if (stable.orientation) {
      const orientationStable = { ...stable.orientation };
      delete orientationStable.angle; // Changes when device rotates
      // Keep: type (more stable)
      stable.orientation = {
        type: orientationStable.type
      };
    }
    
    // Remove onLine status (can change)
    if (stable.privacy) {
      const privacyStable = { ...stable.privacy };
      delete privacyStable.onLine; // Can change
      stable.privacy = {
        cookieEnabled: privacyStable.cookieEnabled,
        doNotTrack: privacyStable.doNotTrack
      };
    }
    
    // Remove WebRTC candidatesCount (can vary between page loads)
    if (stable.webRTC) {
      const webRTCStable = { ...stable.webRTC };
      delete webRTCStable.candidatesCount; // Can vary
      delete webRTCStable.connectionState; // Can vary
      delete webRTCStable.error; // Can vary
      delete webRTCStable.timeout; // Can vary
      // Keep only: hasWebRTC (boolean, stable)
      stable.webRTC = {
        hasWebRTC: webRTCStable.hasWebRTC
      };
    }
    
    // Remove any undefined/null values to ensure consistent JSON.stringify
    // This prevents issues where undefined values might be serialized differently
    Object.keys(stable).forEach(key => {
      if (stable[key] === undefined || stable[key] === null) {
        delete stable[key];
      }
    });
    
    return stable;
  }

  /**
   * Sort object keys recursively to ensure consistent JSON.stringify output
   * This is critical for hash consistency - same data must always produce same JSON string
   */
  sortObjectKeys(obj) {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }
    
    if (typeof obj !== 'object') {
      return obj;
    }
    
    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = this.sortObjectKeys(obj[key]);
    });
    
    return sorted;
  }

  /**
   * Get stable components for cache key generation
   * Uses only fast, synchronous strategies
   */
  getStableComponentsForCache() {
    // Get synchronous strategies only (fast ones for cache key)
    // Priority <= 20 means fast, synchronous strategies
    const syncStrategies = this.registry.getEnabledStrategies()
      .filter(s => !s.requiresAsync && s.priority <= 20)
      .slice(0, 5); // Limit to first 5 for speed

    const components = {};
    
    // Execute synchronously (these should be fast and return immediately)
    for (const strategy of syncStrategies) {
      try {
        // For sync strategies, execute() should return immediately (not a promise)
        const result = strategy.execute();
        
        // Check if it's a promise (async strategy incorrectly marked as sync)
        if (result && typeof result.then === 'function') {
          // It's a promise, skip for cache key (we want instant results)
          Logger.debug('FingerprintCollector', `Skipping async strategy ${strategy.name} for cache key`);
          continue;
        }
        
        // Get stable components from result
        const stable = strategy.getStableComponents(result);
        if (stable) {
          components[strategy.name] = stable;
        }
      } catch (e) {
        Logger.debug('FingerprintCollector', `Failed to get stable components for ${strategy.name}`, { error: e.message });
      }
    }

    return components;
  }
}

// ============================================================================
// Strategy Implementations (28+ Detection Methods)
// ============================================================================

/**
 * TimeZone Strategy
 */
class TimeZoneStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 1;
    this.requiresAsync = false;
  }

  async execute() {
    let name = null;
    try {
      if (Intl && Intl.DateTimeFormat) {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) name = tz;
      }
    } catch (e) {
      // ignore
    }
    const offsetMinutes = new Date().getTimezoneOffset();
    const offsetHours = -offsetMinutes / 60;
    
    return {
      name: name || null,
      offsetMinutes,
      offsetHours,
      offsetString: `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`
    };
  }

  getStableComponents(result) {
    return result ? {
      name: result.name,
      offsetMinutes: result.offsetMinutes
    } : null;
  }
}

/**
 * UserAgent Strategy
 */
class UserAgentStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 2;
    this.requiresAsync = false;
  }

  async execute() {
    return {
      userAgent: navigator.userAgent || null,
      vendor: navigator.vendor || null,
      appName: navigator.appName || null,
      appVersion: navigator.appVersion || null,
      product: navigator.product || null,
      productSub: navigator.productSub || null
    };
  }

  getStableComponents(result) {
    return result ? {
      platform: result.platform,
      vendor: result.vendor
    } : null;
  }
}

/**
 * Canvas Strategy
 */
class CanvasStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 10;
    this.requiresAsync = false;
  }

  async execute() {
    const results = {};
    let canvas = null;

    // Anti-fingerprinting check: blank or blocked canvases return either
    // an empty `data:,` URL or an obviously truncated payload. Any real
    // 200x50 PNG is well over 100 bytes.
    const isValidDataURL = (url) => !!url && url.length >= 100 && url !== 'data:,';

    try {
      canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        ResourceManager.cleanupCanvas(canvas);
        return null;
      }

      // Use fixed dimensions for consistency
      canvas.width = 200;
      canvas.height = 50;

      // Reset canvas state for consistent rendering
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Basic canvas fingerprint - use stable text (no emoji for better consistency)
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'start';
      // Use generic sans-serif font stack for better cross-platform consistency
      ctx.font = "16px Arial, sans-serif";
      ctx.fillStyle = "#f60";
      // Use canvas dimensions instead of hardcoded values for consistency
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#069";
      // Removed emoji - can render differently across browsers/OS
      ctx.fillText("Canvas fingerprinting test", 2, 15);
      ctx.strokeStyle = "rgba(120, 186, 176, 0.8)";
      ctx.beginPath();
      // Use canvas center coordinates instead of hardcoded values
      ctx.arc(canvas.width / 2, canvas.height / 2, 15, 0, Math.PI * 2);
      ctx.stroke();

      // Explicitly specify PNG format for consistency
      const basicDataURL = canvas.toDataURL('image/png');
      if (!isValidDataURL(basicDataURL)) {
        Logger.warn('CanvasStrategy', 'Canvas fingerprinting blocked or blank (anti-fingerprinting)');
        return null;
      }
      results.basic = simpleHash(basicDataURL);

      // Text metrics (stable - doesn't depend on canvas rendering)
      // Use same font stack as basic fingerprint for consistency
      ctx.font = "14px Arial, sans-serif";
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'start';
      const metrics = ctx.measureText("Canvas fingerprint");
      results.textMetrics = {
        width: metrics.width,
        actualBoundingBoxLeft: metrics.actualBoundingBoxLeft || 0,
        actualBoundingBoxRight: metrics.actualBoundingBoxRight || 0,
        actualBoundingBoxAscent: metrics.actualBoundingBoxAscent || 0,
        actualBoundingBoxDescent: metrics.actualBoundingBoxDescent || 0
      };

      // Gradient fingerprint - use fresh canvas state
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Use canvas dimensions instead of hardcoded values for consistency
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 0, 255, 0.5)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const gradientDataURL = canvas.toDataURL('image/png');
      if (isValidDataURL(gradientDataURL)) {
        results.gradient = simpleHash(gradientDataURL);
      }

      // Shadow fingerprint - use fresh canvas state
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.fillStyle = "#000";
      ctx.fillText("Shadow test", 10, 10);
      // NOTE: intentionally matches the previous call (no explicit format
      // argument) so the shadow data URL - and therefore the hash - stays
      // byte-identical to pre-refactor runs. The default is image/png.
      const shadowDataURL = canvas.toDataURL();
      if (isValidDataURL(shadowDataURL)) {
        results.shadow = simpleHash(shadowDataURL);
      }

      // If basic hash is missing, return null (anti-fingerprinting active)
      if (!results.basic) {
        return null;
      }

      return results;
    } catch (e) {
      Logger.error('CanvasStrategy', 'Canvas fingerprinting failed', e);
      return null;
    } finally {
      ResourceManager.cleanupCanvas(canvas);
    }
  }

  getStableComponents(result) {
    return result ? { basic: result.basic } : null;
  }
}

/**
 * Font Detection Strategy
 */
class FontDetectionStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 30;
    this.requiresAsync = true;
    this.timeout = Config.get('timeouts.fontDetection', 5000);
  }

  async execute() {
    const fontList = Config.get('fontList', []);
    if (!fontList || fontList.length === 0) {
      return [];
    }

    const baseFonts = ["monospace", "sans-serif", "serif"];
    const testString = "mmmmmmmmmmlli";
    const testSize = "72px";

    const body = document.body || document.getElementsByTagName("body")[0];
    if (!body) {
      Logger.warn('FontDetectionStrategy', 'Document body not available');
      return [];
    }

    let span = null;
    const defaultWidth = {};
    const defaultHeight = {};

    try {
      span = document.createElement("span");
      span.style.cssText = `position:absolute;left:-9999px;visibility:hidden;font-size:${testSize}`;
      span.textContent = testString;

      // OPT: Append the probe span exactly once and keep it attached for
      // the entire baseline + candidate-font measurement pass. Mutating
      // `span.style.fontFamily` and reading `offsetWidth`/`offsetHeight`
      // still triggers the layout recalc we need, and the absolute
      // positioning keeps the span out of the document flow, so the
      // measured widths are byte-identical to the previous implementation
      // (which appended / removed per probe). This drops O(3*N + 3) DOM
      // mutations to exactly 2 (append + remove in `finally`).
      body.appendChild(span);

      for (const font of baseFonts) {
        span.style.fontFamily = font;
        defaultWidth[font] = span.offsetWidth;
        defaultHeight[font] = span.offsetHeight;
      }

      const checkFont = (font) => {
        for (const baseFont of baseFonts) {
          span.style.fontFamily = `'${font}',${baseFont}`;
          if (
            span.offsetWidth !== defaultWidth[baseFont] ||
            span.offsetHeight !== defaultHeight[baseFont]
          ) {
            return true;
          }
        }
        return false;
      };

      return await new Promise((resolve) => {
        const availableFonts = [];
        let fontIndex = 0;

        const processBatch = (deadline) => {
          const batchSize = Config.get('performance.fontDetectionBatchSize', 5);
          while (
            fontIndex < fontList.length &&
            (deadline.didTimeout || deadline.timeRemaining() > 0)
          ) {
            const font = fontList[fontIndex];
            if (checkFont(font)) {
              availableFonts.push(font);
            }
            fontIndex++;

            if (fontIndex % batchSize === 0 && deadline.timeRemaining() < 1) {
              break;
            }
          }

          if (fontIndex < fontList.length) {
            const useIdleCallback = Config.get('performance.useRequestIdleCallback', true);
            const idleTimeout = Config.get('performance.fontDetectionIdleTimeout', 5000);
            const fallbackDelay = Config.get('performance.fontDetectionFallbackDelay', 10);

            if (useIdleCallback && window.requestIdleCallback) {
              requestIdleCallback(processBatch, { timeout: idleTimeout });
            } else {
              setTimeout(
                () => processBatch({ timeRemaining: () => 5, didTimeout: false }),
                fallbackDelay
              );
            }
          } else {
            resolve(availableFonts);
          }
        };

        const useIdleCallback = Config.get('performance.useRequestIdleCallback', true);
        const idleTimeout = Config.get('performance.fontDetectionIdleTimeout', 5000);

        if (useIdleCallback && window.requestIdleCallback) {
          requestIdleCallback(processBatch, { timeout: idleTimeout });
        } else {
          processBatch({ timeRemaining: () => Infinity, didTimeout: false });
        }
      });
    } catch (e) {
      Logger.error('FontDetectionStrategy', 'Font detection failed', e);
      return [];
    } finally {
      ResourceManager.cleanupDOMElement(span);
    }
  }

  getStableComponents(result) {
    return result && Array.isArray(result) ? result : null;
  }
}

/**
 * Screen Strategy
 */
class ScreenStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 3;
    this.requiresAsync = false;
  }

  async execute() {
    const s = window.screen || {};
    return {
      width: s.width || null,
      height: s.height || null,
      availWidth: s.availWidth || null,
      availHeight: s.availHeight || null,
      colorDepth: s.colorDepth || null,
      pixelDepth: s.pixelDepth || null,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: s.orientation ? {
        angle: s.orientation.angle || null,
        type: s.orientation.type || null
      } : null
    };
  }

  getStableComponents(result) {
    return result ? {
      width: result.width,
      height: result.height,
      colorDepth: result.colorDepth,
      pixelRatio: result.pixelRatio
    } : null;
  }
}

/**
 * Plugins Strategy
 */
class PluginsStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 15;
    this.requiresAsync = false;
  }

  async execute() {
    try {
      const plugins = [];
      if (navigator.plugins) {
        for (let i = 0; i < navigator.plugins.length; i++) {
          const p = navigator.plugins[i];
          const mimeTypes = [];
          for (let j = 0; j < p.length; j++) {
            mimeTypes.push({
              type: p[j].type,
              suffixes: p[j].suffixes,
              description: p[j].description
            });
          }
          plugins.push({
            name: p.name,
            filename: p.filename,
            description: p.description,
            mimeTypes
          });
        }
      }
      return plugins;
    } catch (e) {
      Logger.error('PluginsStrategy', 'Plugin detection failed', e);
      return [];
    }
  }
}

/**
 * Language Strategy
 */
class LanguageStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 4;
    this.requiresAsync = false;
  }

  async execute() {
    return {
      language: navigator.language || null,
      languages: navigator.languages || [],
      systemLanguage: navigator.systemLanguage || null,
      userLanguage: navigator.userLanguage || null
    };
  }

  getStableComponents(result) {
    return result ? {
      language: result.language,
      languages: result.languages
    } : null;
  }
}

/**
 * Platform Strategy
 */
class PlatformStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 5;
    this.requiresAsync = false;
  }

  async execute() {
    const ua = navigator.userAgent || "";
    let architecture = null;

    if (/x86_64|Win64|WOW64|x64/i.test(ua)) {
      architecture = "x64";
    } else if (/i[0-9]86/i.test(ua)) {
      architecture = "x86";
    } else if (/arm64|aarch64|arm/i.test(ua)) {
      architecture = "ARM";
    }

    const result = {
      platform: navigator.platform || null,
      architecture,
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      deviceMemory: navigator.deviceMemory || null,
      maxTouchPoints: navigator.maxTouchPoints || 0
    };

    if (navigator.userAgentData) {
      result.userAgentData = {
        platform: navigator.userAgentData.platform || null,
        mobile: navigator.userAgentData.mobile || false,
        brands: navigator.userAgentData.brands || [],
        platformVersion: navigator.userAgentData.platformVersion || null
      };
    }

    return result;
  }

  getStableComponents(result) {
    return result ? {
      platform: result.platform,
      architecture: result.architecture,
      hardwareConcurrency: result.hardwareConcurrency
    } : null;
  }
}

/**
 * WebGL Strategy
 */
class WebGLStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 20;
    this.requiresAsync = false;
  }

  async execute() {
    const results = {};
    let canvas = null;
    let gl = null;
    let gl2 = null;
    
    try {
      canvas = document.createElement("canvas");
      gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        ResourceManager.cleanupCanvas(canvas);
        return null;
      }

      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        results.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        results.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }

      results.version = gl.getParameter(gl.VERSION);
      results.shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
      results.vendor = results.vendor || gl.getParameter(gl.VENDOR);
      results.renderer = results.renderer || gl.getParameter(gl.RENDERER);
      results.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      results.maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      results.maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
      results.maxTextureImageUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
      results.maxCombinedTextureImageUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
      results.maxFragmentUniformVectors = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
      results.maxVaryingVectors = gl.getParameter(gl.MAX_VARYING_VECTORS);
      results.maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
      results.aliasedLineWidthRange = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);
      results.aliasedPointSizeRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);

      const extensions = gl.getSupportedExtensions() || [];
      results.extensions = extensions;
      results.extensionsCount = extensions.length;

      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, "attribute vec2 attrVertex;varying vec2 varyinTexCoordinate;uniform vec2 uniformOffset;void main(){varyinTexCoordinate=attrVertex+uniformOffset;gl_Position=vec4(attrVertex,0,1);}");
      gl.compileShader(vertexShader);
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, "precision mediump float;varying vec2 varyinTexCoordinate;void main() {gl_FragColor=vec4(varyinTexCoordinate,0,1);}");
      gl.compileShader(fragmentShader);
      const shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);
      gl.useProgram(shaderProgram);
      gl.drawArrays(gl.POINTS, 0, 1);
      const webglFp = canvas.toDataURL();
      results.canvasFingerprint = simpleHash(webglFp);

      gl2 = canvas.getContext("webgl2");
      if (gl2) {
        results.webgl2 = {
          version: gl2.getParameter(gl2.VERSION),
          maxColorAttachments: gl2.getParameter(gl2.MAX_COLOR_ATTACHMENTS),
          maxDrawBuffers: gl2.getParameter(gl2.MAX_DRAW_BUFFERS),
          maxVertexOutputComponents: gl2.getParameter(gl2.MAX_VERTEX_OUTPUT_COMPONENTS),
          maxFragmentInputComponents: gl2.getParameter(gl2.MAX_FRAGMENT_INPUT_COMPONENTS)
        };
      }

      return results;
    } catch (e) {
      Logger.error('WebGLStrategy', 'WebGL fingerprinting failed', e);
      return null;
    } finally {
      ResourceManager.cleanupWebGL(gl);
      if (gl2) ResourceManager.cleanupWebGL(gl2);
      ResourceManager.cleanupCanvas(canvas);
    }
  }

  getStableComponents(result) {
    return result ? {
      vendor: result.vendor,
      renderer: result.renderer,
      version: result.version
    } : null;
  }
}

/**
 * Audio Strategy
 */
class AudioStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 25;
    this.requiresAsync = true;
    this.timeout = Config.get('timeouts.audio', 5000);
  }

  async execute() {
    let context = null;
    
    try {
      // Use OfflineAudioContext (required for startRendering(), no audio output)
      const OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!OfflineAudioContext) {
        Logger.debug('AudioStrategy', 'OfflineAudioContext not available');
        return null;
      }

      // OfflineAudioContext constructor: (numberOfChannels, length, sampleRate)
      context = new OfflineAudioContext(1, 44100, 44100);
      
      const audioPromise = (async () => {
        const osc = context.createOscillator();
        const comp = context.createDynamicsCompressor();
        const gainNode = context.createGain();

        osc.type = "triangle";
        osc.frequency.value = 10000;

        comp.threshold.value = -50;
        comp.knee.value = 40;
        comp.ratio.value = 12;
        comp.attack.value = 0;
        comp.release.value = 0.25;

        gainNode.gain.value = 0.5;

        osc.connect(comp);
        comp.connect(gainNode);
        gainNode.connect(context.destination);
        osc.start(0);
        osc.stop(0.001);

        // startRendering() is only available on OfflineAudioContext
        const buffer = await context.startRendering();
        const data = buffer.getChannelData(0);
        
        let sum = 0;
        let output = "";
        for (let i = 0; i < data.length; i += 100) {
          const val = Math.abs(data[i]);
          sum += val;
          output += val.toString().substring(0, 10);
        }

        return {
          fingerprint: simpleHash(output),
          sum: sum.toString(),
          sampleRate: context.sampleRate,
          numberOfChannels: buffer.numberOfChannels,
          length: buffer.length,
          duration: buffer.duration
        };
      })();

      return await withTimeout(audioPromise, 'audio', null, 'AudioStrategy');
    } catch (e) {
      Logger.error('AudioStrategy', 'Audio fingerprinting failed', e);
      return null;
    } finally {
      ResourceManager.cleanupAudioContext(context);
    }
  }

  getStableComponents(result) {
    return result ? {
      fingerprint: result.fingerprint,
      sampleRate: result.sampleRate
    } : null;
  }
}

/**
 * Media Devices Strategy
 */
class MediaDevicesStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 35;
    this.requiresAsync = true;
    this.timeout = Config.get('timeouts.mediaDevices', 3000);
  }

  async execute() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return null;
      }

      const devices = await withTimeout(
        navigator.mediaDevices.enumerateDevices(),
        'mediaDevices',
        [],
        'MediaDevicesStrategy'
      );
      
      const result = {
        audioInputs: [],
        audioOutputs: [],
        videoInputs: []
      };

      devices.forEach(device => {
        const deviceInfo = {
          deviceId: device.deviceId ? simpleHash(device.deviceId) : null,
          kind: device.kind,
          label: device.label || null,
          groupId: device.groupId ? simpleHash(device.groupId) : null
        };

        if (device.kind === 'audioinput') {
          result.audioInputs.push(deviceInfo);
        } else if (device.kind === 'audiooutput') {
          result.audioOutputs.push(deviceInfo);
        } else if (device.kind === 'videoinput') {
          result.videoInputs.push(deviceInfo);
        }
      });

      result.totalDevices = devices.length;
      return result;
    } catch (e) {
      Logger.error('MediaDevicesStrategy', 'Media device enumeration failed', e);
      return null;
    }
  }
}

/**
 * Connection Strategy
 */
class ConnectionStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 12;
    this.requiresAsync = false;
  }

  async execute() {
    try {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!connection) return null;

      return {
        effectiveType: connection.effectiveType || null, // Relatively stable
        downlink: connection.downlink || null, // Can vary
        downlinkMax: connection.downlinkMax || null, // Can vary
        rtt: connection.rtt || null, // Varies with network conditions
        saveData: connection.saveData || false, // Stable
        type: connection.type || null // Relatively stable
      };
    } catch (e) {
      Logger.warn('ConnectionStrategy', 'Connection info failed', { error: e.message });
      return null;
    }
  }
  
  getStableComponents(result) {
    // Only return stable connection characteristics
    return result ? {
      effectiveType: result.effectiveType,
      type: result.type,
      saveData: result.saveData
    } : null;
  }
}

/**
 * Touch Strategy
 */
class TouchStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 6;
    this.requiresAsync = false;
  }

  async execute() {
    return {
      maxTouchPoints: navigator.maxTouchPoints || 0,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      pointerSupport: {
        pointerEvents: 'PointerEvent' in window,
        maxPointers: navigator.maxTouchPoints || 0
      }
    };
  }
}

/**
 * Storage Strategy
 */
class StorageStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 13;
    this.requiresAsync = true;
    this.timeout = Config.get('timeouts.storage', 2000);
  }

  // OPT: Extracted probe helpers. The previous body repeated nearly
  // identical nested try/catch blocks four times. These helpers keep the
  // boolean semantics byte-identical (same 'test' key, same set→remove
  // sequence, same "any failure means false") so the resulting hash is
  // unchanged, while halving the line count and making the surface area
  // of the blocking storage writes obvious.
  _probeWebStorage(name) {
    try {
      const store = window[name];
      if (!store) return false;
      store.setItem('test', 'test');
      store.removeItem('test');
      return true;
    } catch (e) {
      Logger.warn('StorageStrategy', `${name} probe failed`, { error: e && e.message });
      return false;
    }
  }

  _hasGlobal(name) {
    try {
      return !!window[name];
    } catch (e) {
      Logger.warn('StorageStrategy', `${name} check failed`, { error: e && e.message });
      return false;
    }
  }

  async execute() {
    const result = {
      localStorage: this._probeWebStorage('localStorage'),
      sessionStorage: this._probeWebStorage('sessionStorage'),
      indexedDB: this._hasGlobal('indexedDB'),
      webSQL: this._hasGlobal('openDatabase')
    };

    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await withTimeout(
          navigator.storage.estimate(),
          'storage',
          null,
          'StorageStrategy'
        );
        if (estimate) {
          // NOTE: quota and usage change as data is stored/removed
          // These are included in full fingerprint but NOT used for identity hash
          result.quota = estimate.quota || null;
          result.usage = estimate.usage || null;
          result.usageDetails = estimate.usageDetails || null;
        }
      } catch (e) {
        Logger.warn('StorageStrategy', 'Storage quota estimation failed', { error: e.message });
      }
    }

    return result;
  }
  
  getStableComponents(result) {
    // Only return storage availability flags, exclude quota/usage (change over time)
    return result ? {
      localStorage: result.localStorage,
      sessionStorage: result.sessionStorage,
      indexedDB: result.indexedDB,
      webSQL: result.webSQL
    } : null;
  }
}

/**
 * Permissions Strategy
 */
class PermissionsStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 40;
    this.requiresAsync = true;
    this.timeout = Config.get('timeouts.permissions', 1000);
  }

  async execute() {
    if (!navigator.permissions || !navigator.permissions.query) {
      return null;
    }

    const permissions = [
      'camera',
      'microphone',
      'notifications',
      'geolocation',
      'persistent-storage',
      'push',
      'midi'
    ];

    const result = {};
    for (const permission of permissions) {
      try {
        // Special handling for push permission (requires userVisibleOnly)
        let queryParams = { name: permission };
        if (permission === 'push') {
          queryParams = { name: permission, userVisibleOnly: true };
        }
        
        const status = await withTimeout(
          navigator.permissions.query(queryParams),
          'permissions',
          null,
          `PermissionsStrategy:${permission}`
        );
        result[permission] = status ? status.state : 'timeout';
      } catch (e) {
        // Handle specific error for push permission
        if (permission === 'push' && e.name === 'NotSupportedError') {
          Logger.debug('PermissionsStrategy', `Push permission not supported (requires userVisibleOnly)`, { error: e.message });
          result[permission] = 'not-supported';
        } else {
          Logger.warn('PermissionsStrategy', `Permission query failed for ${permission}`, { error: e.message });
          result[permission] = 'unsupported';
        }
      }
    }

    return result;
  }
}

/**
 * Speech Voices Strategy
 */
class SpeechVoicesStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 16;
    this.requiresAsync = false;
  }

  async execute() {
    try {
      if (!window.speechSynthesis) return null;
      
      const voices = speechSynthesis.getVoices();
      return {
        count: voices.length,
        languages: [...new Set(voices.map(v => v.lang))],
        defaultVoice: voices.find(v => v.default) ? {
          name: voices.find(v => v.default).name,
          lang: voices.find(v => v.default).lang
        } : null
      };
    } catch (e) {
      Logger.warn('SpeechVoicesStrategy', 'Speech voices detection failed', { error: e.message });
      return null;
    }
  }
}

/**
 * Battery Strategy
 */
class BatteryStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 45;
    this.requiresAsync = true;
    this.timeout = Config.get('timeouts.battery', 2000);
  }

  async execute() {
    try {
      if (navigator.getBattery) {
        const battery = await withTimeout(
          navigator.getBattery(),
          'battery',
          null,
          'BatteryStrategy'
        );
        if (battery) {
          // NOTE: Battery level and times change constantly
          // Only charging status is relatively stable for short periods
          return {
            charging: battery.charging, // Relatively stable (changes slowly)
            chargingTime: battery.chargingTime, // Changes constantly
            dischargingTime: battery.dischargingTime, // Changes constantly
            level: battery.level // Changes constantly
          };
        }
      }
    } catch (e) {
      Logger.warn('BatteryStrategy', 'Battery API access failed', { error: e.message });
    }
    return null;
  }
  
  getStableComponents(result) {
    // Only return charging status, exclude level and times (change constantly)
    return result ? {
      charging: result.charging
    } : null;
  }
}

/**
 * Media Queries Strategy
 */
class MediaQueriesStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 7;
    this.requiresAsync = false;
  }

  async execute() {
    const result = {};
    const queries = [
      '(prefers-color-scheme: dark)',
      '(prefers-color-scheme: light)',
      '(prefers-reduced-motion: reduce)',
      '(prefers-reduced-motion: no-preference)',
      '(prefers-contrast: high)',
      '(prefers-contrast: low)',
      '(pointer: fine)',
      '(pointer: coarse)',
      '(pointer: none)',
      '(hover: hover)',
      '(hover: none)',
      '(any-pointer: fine)',
      '(any-pointer: coarse)',
      '(any-hover: hover)',
      '(any-hover: none)'
    ];

    queries.forEach(query => {
      try {
        result[query] = window.matchMedia(query).matches;
      } catch (e) {
        result[query] = null;
      }
    });

    return result;
  }
}

/**
 * Feature Detection Strategy
 */
class FeatureDetectionStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 8;
    this.requiresAsync = false;
  }

  async execute() {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      webWorker: typeof Worker !== 'undefined',
      webAssembly: typeof WebAssembly !== 'undefined',
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      webGL: !!document.createElement('canvas').getContext('webgl'),
      webGL2: !!document.createElement('canvas').getContext('webgl2'),
      webRTC: !!(window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection),
      webAudio: !!(window.AudioContext || window.webkitAudioContext),
      geolocation: 'geolocation' in navigator,
      vibration: 'vibrate' in navigator,
      bluetooth: 'bluetooth' in navigator,
      usb: 'usb' in navigator,
      serial: 'serial' in navigator,
      clipboard: 'clipboard' in navigator,
      credentials: 'credentials' in navigator,
      paymentRequest: 'PaymentRequest' in window,
      gamepad: 'getGamepads' in navigator,
      mediaDevices: 'mediaDevices' in navigator,
      notifications: 'Notification' in window,
      pushManager: 'PushManager' in window,
      share: 'share' in navigator,
      wakeLock: 'wakeLock' in navigator,
      storage: 'storage' in navigator,
      locks: 'locks' in navigator,
      fileSystem: 'showOpenFilePicker' in window,
      webShare: 'share' in navigator,
      webXR: 'xr' in navigator,
      webGPU: 'gpu' in navigator
    };
  }
}

/**
 * Performance Strategy
 */
class PerformanceStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 9;
    this.requiresAsync = false;
  }

  async execute() {
    try {
      if (!window.performance || !window.performance.timing) {
        return null;
      }

      // NOTE: Performance timing values change on every page load
      // These are included in full fingerprint for analysis but NOT used for identity hash
      const timing = window.performance.timing;
      return {
        navigationStart: timing.navigationStart,
        domInteractive: timing.domInteractive,
        domComplete: timing.domComplete,
        loadEventEnd: timing.loadEventEnd,
        connectEnd: timing.connectEnd,
        connectStart: timing.connectStart,
        domainLookupEnd: timing.domainLookupEnd,
        domainLookupStart: timing.domainLookupStart,
        fetchStart: timing.fetchStart,
        responseEnd: timing.responseEnd,
        responseStart: timing.responseStart
      };
    } catch (e) {
      Logger.warn('PerformanceStrategy', 'Performance timing failed', { error: e.message });
      return null;
    }
  }
  
  getStableComponents(result) {
    // Performance timing is not stable - return null so it's excluded from hash
    return null;
  }
}

/**
 * Math Strategy
 */
class MathStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 11;
    this.requiresAsync = false;
  }

  async execute() {
    // NOTE: Math.random() is excluded from fingerprint hash (changes every time)
    // It's included in the full fingerprint object for analysis but not used for identity
    return {
      E: Math.E,
      LN2: Math.LN2,
      LN10: Math.LN10,
      LOG2E: Math.LOG2E,
      LOG10E: Math.LOG10E,
      PI: Math.PI,
      SQRT1_2: Math.SQRT1_2,
      SQRT2: Math.SQRT2
      // random: Math.random() - EXCLUDED (not stable for fingerprinting)
    };
  }
}

/**
 * DateTime Strategy
 */
class DateTimeStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 14;
    this.requiresAsync = false;
  }

  async execute() {
    // NOTE: Timestamp values are excluded from fingerprint hash (change every time)
    // Only timezoneOffset is stable and used for identity
    const now = new Date();
    return {
      // These are included in full fingerprint but NOT used for hash:
      timestamp: now.getTime(), // Changes every millisecond
      dateString: now.toString(), // Changes every second
      toISOString: now.toISOString(), // Changes every second
      precision: performance.now ? performance.now() : null, // Changes every microsecond
      // This is stable and used for identity:
      timezoneOffset: now.getTimezoneOffset() // Stable (doesn't change unless user changes timezone)
    };
  }
  
  getStableComponents(result) {
    // Only return timezoneOffset for fingerprint hash
    return result ? {
      timezoneOffset: result.timezoneOffset
    } : null;
  }
}

/**
 * Privacy Strategy
 */
class PrivacyStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 17;
    this.requiresAsync = false;
  }

  async execute() {
    return {
      cookieEnabled: navigator.cookieEnabled, // Stable
      doNotTrack: navigator.doNotTrack || null, // Stable
      onLine: navigator.onLine // Can change (network connectivity)
    };
  }
  
  getStableComponents(result) {
    // Only return stable privacy settings, exclude onLine (can change)
    return result ? {
      cookieEnabled: result.cookieEnabled,
      doNotTrack: result.doNotTrack
    } : null;
  }
}

/**
 * History Strategy
 */
class HistoryStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 18;
    this.requiresAsync = false;
  }

  async execute() {
    try {
      // NOTE: history.length changes as user navigates
      // Only state presence is relatively stable
      return {
        length: window.history.length, // Changes with navigation
        state: window.history.state !== null // More stable
      };
    } catch (e) {
      Logger.warn('HistoryStrategy', 'History info failed', { error: e.message });
      return null;
    }
  }
  
  getStableComponents(result) {
    // Only return state, exclude length (changes with navigation)
    return result ? {
      state: result.state
    } : null;
  }
}

/**
 * Media Codecs Strategy
 */
class MediaCodecsStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 19;
    this.requiresAsync = false;
  }

  async execute() {
    const result = {
      video: {},
      audio: {}
    };

    const videoCodecs = [
      'video/webm; codecs="vp8"',
      'video/webm; codecs="vp9"',
      'video/webm; codecs="av01"',
      'video/mp4; codecs="avc1.42E01E"',
      'video/mp4; codecs="avc1.4D401E"',
      'video/mp4; codecs="avc1.640028"',
      'video/mp4; codecs="hev1.1.6.L93.B0"',
      'video/mp4; codecs="hvc1.1.6.L93.B0"'
    ];

    const audioCodecs = [
      'audio/webm; codecs="opus"',
      'audio/webm; codecs="vorbis"',
      'audio/mp4; codecs="mp4a.40.2"',
      'audio/mp4; codecs="mp4a.40.5"',
      'audio/ogg; codecs="vorbis"',
      'audio/ogg; codecs="opus"'
    ];

    if (document.createElement('video').canPlayType) {
      const video = document.createElement('video');
      videoCodecs.forEach(codec => {
        result.video[codec] = video.canPlayType(codec);
      });
    }

    if (document.createElement('audio').canPlayType) {
      const audio = document.createElement('audio');
      audioCodecs.forEach(codec => {
        result.audio[codec] = audio.canPlayType(codec);
      });
    }

    return result;
  }
}

/**
 * WebRTC Strategy
 */
class WebRTCStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 50;
    this.requiresAsync = true;
    this.timeout = Config.get('timeouts.webRTC', 2000);
  }

  async execute() {
    let pc = null;
    let timeoutId = null;
    let resolved = false;
    
    try {
      const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
      if (!RTCPeerConnection) return null;

      pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      return new Promise((resolve) => {
        const candidates = [];
        
        const safeResolve = (value) => {
          if (!resolved) {
            resolved = true;
            if (timeoutId) clearTimeout(timeoutId);
            ResourceManager.cleanupPeerConnection(pc);
            resolve(value);
          }
        };
        
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            candidates.push(event.candidate.candidate);
          } else {
            safeResolve({
              hasWebRTC: true,
              candidatesCount: candidates.length
            });
          }
        };
        
        pc.onerror = (error) => {
          Logger.warn('WebRTCStrategy', 'WebRTC error', null, { error: error.message || 'Unknown error' });
          safeResolve({ hasWebRTC: true, error: true });
        };
        
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            safeResolve({ hasWebRTC: true, connectionState: pc.connectionState });
          }
        };

        try {
          pc.createDataChannel('');
          pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .catch((error) => {
              Logger.warn('WebRTCStrategy', 'Failed to create offer', error);
              safeResolve({ hasWebRTC: true, error: true });
            });
        } catch (error) {
          Logger.warn('WebRTCStrategy', 'Failed to create data channel', error);
          safeResolve({ hasWebRTC: true, error: true });
        }

        const webRTCTimeout = Config.get('timeouts.webRTC', 2000);
        timeoutId = setTimeout(() => {
          safeResolve({ hasWebRTC: true, timeout: true });
        }, webRTCTimeout);
      });
    } catch (e) {
      Logger.error('WebRTCStrategy', 'WebRTC detection failed', e);
      if (pc) ResourceManager.cleanupPeerConnection(pc);
      if (timeoutId) clearTimeout(timeoutId);
      return null;
    }
  }
}

/**
 * Screen Orientation Strategy
 */
class ScreenOrientationStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 21;
    this.requiresAsync = false;
  }

  async execute() {
    try {
      if (screen.orientation) {
        return {
          angle: screen.orientation.angle, // Changes when device rotates
          type: screen.orientation.type, // More stable
          onchange: screen.orientation.onchange !== null
        };
      }
    } catch (e) {
      Logger.warn('ScreenOrientationStrategy', 'Screen orientation failed', { error: e.message });
    }
    return null;
  }
  
  getStableComponents(result) {
    // Only return type, exclude angle (changes with rotation)
    return result ? {
      type: result.type
    } : null;
  }
}

/**
 * Device Motion Strategy
 */
class DeviceMotionStrategy extends FingerprintStrategy {
  constructor(config) {
    super(config);
    this.priority = 22;
    this.requiresAsync = false;
  }

  async execute() {
    try {
      return {
        deviceMotion: 'DeviceMotionEvent' in window,
        deviceOrientation: 'DeviceOrientationEvent' in window
      };
    } catch (e) {
      Logger.warn('DeviceMotionStrategy', 'Device motion detection failed', { error: e.message });
      return null;
    }
  }
}

/**
 * Strategy Factory
 * Creates and registers all default strategies
 */
class StrategyFactory {
  static createDefaultStrategies() {
    return [
      new TimeZoneStrategy(),
      new UserAgentStrategy(),
      new CanvasStrategy(),
      new FontDetectionStrategy(),
      new ScreenStrategy(),
      new PluginsStrategy(),
      new LanguageStrategy(),
      new PlatformStrategy(),
      new WebGLStrategy(),
      new AudioStrategy(),
      new MediaDevicesStrategy(),
      new ConnectionStrategy(),
      new TouchStrategy(),
      new StorageStrategy(),
      new PermissionsStrategy(),
      new SpeechVoicesStrategy(),
      new BatteryStrategy(),
      new MediaQueriesStrategy(),
      new FeatureDetectionStrategy(),
      new PerformanceStrategy(),
      new MathStrategy(),
      new DateTimeStrategy(),
      new PrivacyStrategy(),
      new HistoryStrategy(),
      new MediaCodecsStrategy(),
      new WebRTCStrategy(),
      new ScreenOrientationStrategy(),
      new DeviceMotionStrategy()
    ];
  }

  static createCollector(userConfig = {}) {
    const registry = new StrategyRegistry();
    const strategies = this.createDefaultStrategies();
    registry.registerAll(strategies);
    
    const collector = new FingerprintCollector(registry);
    return collector;
  }
}

// Global collector instance (lazy initialization)
let globalCollector = null;

// Enhanced hash function with better distribution
function simpleHash(str) {
  if (!str || str.length === 0) return '0';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Better hash function using crypto API if available
async function cryptoHash(str) {
  if (!str) return '0';
  try {
    if (window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    // Fallback to simple hash
  }
  return simpleHash(str);
}

// ============================================================================
// P0 FIX: Improved Promise with timeout and cancellation
// P1 IMPROVEMENT: Uses configurable timeouts
// ============================================================================
function withTimeout(promise, timeoutType, fallbackValue = null, context = 'unknown', customTimeout = null) {
  // P1: Get timeout from config or use custom
  const timeoutMs = customTimeout || Config.get(`timeouts.${timeoutType}`, 5000);
  let timeoutId = null;

  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      Logger.warn('withTimeout', `Operation timed out after ${timeoutMs}ms`, { context, timeoutType });
      resolve(fallbackValue);
    }, timeoutMs);
  });

  // OPT: Use .finally to guarantee the timer is cleared exactly once on
  // any settlement (fulfilled, rejected, or racing loss), avoiding the
  // dangling reference that the previous `then`+`catch` pair could leave
  // behind when Promise.race picked the timeout branch.
  const wrappedPromise = promise
    .catch((error) => {
      Logger.error('withTimeout', 'Promise rejected', error, { context, timeoutType });
      throw error;
    })
    .finally(() => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    });

  return Promise.race([wrappedPromise, timeoutPromise]);
}

/**
 * Main Fingerprint Function
 * P2 IMPROVEMENT: Uses Strategy Pattern for better architecture
 * Maintains backward compatibility
 */
async function getFingerprint(userConfig = {}) {
  // Initialize global collector if not already done
  if (!globalCollector) {
    globalCollector = StrategyFactory.createCollector();
  }
  
  // Use the Strategy-based collector
  return await globalCollector.collect(userConfig);
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    getFingerprint, 
    cryptoHash, 
    simpleHash,
    Logger, // Export logger for external configuration
    ResourceManager, // Export for testing
    Config, // P1: Export configuration system
    Cache, // P1: Export cache system
    // P2: Export Strategy Pattern classes
    FingerprintStrategy, // Base strategy class
    StrategyRegistry, // Strategy registry
    FingerprintCollector, // Fingerprint collector
    StrategyFactory, // Strategy factory
    // Export all strategy classes for custom implementations
    TimeZoneStrategy,
    UserAgentStrategy,
    CanvasStrategy,
    FontDetectionStrategy,
    ScreenStrategy,
    PluginsStrategy,
    LanguageStrategy,
    PlatformStrategy,
    WebGLStrategy,
    AudioStrategy,
    MediaDevicesStrategy,
    ConnectionStrategy,
    TouchStrategy,
    StorageStrategy,
    PermissionsStrategy,
    SpeechVoicesStrategy,
    BatteryStrategy,
    MediaQueriesStrategy,
    FeatureDetectionStrategy,
    PerformanceStrategy,
    MathStrategy,
    DateTimeStrategy,
    PrivacyStrategy,
    HistoryStrategy,
    MediaCodecsStrategy,
    WebRTCStrategy,
    ScreenOrientationStrategy,
    DeviceMotionStrategy
  };
}

// Auto-run example (commented out for production)
// getFingerprint().then(result => {
//   console.log("Fingerprint object:", result.fingerprint);
//   console.log("Combined fingerprint hash:", result.fingerprintHash);
// });
