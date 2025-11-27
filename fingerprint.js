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

    // Generate hash
    const fingerprintString = JSON.stringify(fingerprintObject);
    const fingerprintHash = await cryptoHash(fingerprintString);

    const result = {
      fingerprint: fingerprintObject,
      fingerprintHash,
      timestamp: Date.now(),
      version: '3.0.0', // P0 fixes + P1 caching & configuration + P2 Strategy Pattern
      cached: false
    };

    // Cache result
    if (Config.get('cache.enabled', true) && cacheKey) {
      try {
        await Cache.set(cacheKey, {
          fingerprint: fingerprintObject,
          fingerprintHash,
          timestamp: result.timestamp,
          version: result.version
        });
        result.cacheKey = cacheKey;
        Logger.info('FingerprintCollector', 'Fingerprint cached', { cacheKey });
      } catch (e) {
        Logger.warn('FingerprintCollector', 'Failed to cache fingerprint', { error: e.message });
      }
    } else if (Config.get('cache.enabled', true) && !cacheKey) {
      // Generate cache key if not already generated
      try {
        const stableComponents = Cache.getStableComponents(fingerprintObject);
        cacheKey = Cache.generateCacheKey(stableComponents);
        await Cache.set(cacheKey, {
          fingerprint: fingerprintObject,
          fingerprintHash,
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
    
    try {
      canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        ResourceManager.cleanupCanvas(canvas);
        return null;
      }

      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = "16px 'Arial'";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(0, 0, 200, 50);
      ctx.fillStyle = "#069";
      ctx.fillText("Canvas fingerprinting test 🚀", 2, 15);
      ctx.strokeStyle = "rgba(120, 186, 176, 0.8)";
      ctx.beginPath();
      ctx.arc(100, 25, 15, 0, Math.PI * 2);
      ctx.stroke();
      results.basic = simpleHash(canvas.toDataURL());

      ctx.font = "14px Arial";
      const metrics = ctx.measureText("Canvas fingerprint");
      results.textMetrics = {
        width: metrics.width,
        actualBoundingBoxLeft: metrics.actualBoundingBoxLeft || 0,
        actualBoundingBoxRight: metrics.actualBoundingBoxRight || 0,
        actualBoundingBoxAscent: metrics.actualBoundingBoxAscent || 0,
        actualBoundingBoxDescent: metrics.actualBoundingBoxDescent || 0
      };

      const gradient = ctx.createLinearGradient(0, 0, 200, 50);
      gradient.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 0, 255, 0.5)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 200, 50);
      results.gradient = simpleHash(canvas.toDataURL());

      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.fillText("Shadow test", 10, 10);
      results.shadow = simpleHash(canvas.toDataURL());

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

      for (const font of baseFonts) {
        span.style.fontFamily = font;
        body.appendChild(span);
        void span.offsetWidth;
        defaultWidth[font] = span.offsetWidth;
        defaultHeight[font] = span.offsetHeight;
        body.removeChild(span);
      }

      return new Promise((resolve) => {
        const availableFonts = [];
        let fontIndex = 0;

        const checkFont = (font) => {
          let detected = false;
          for (const baseFont of baseFonts) {
            span.style.fontFamily = `'${font}',${baseFont}`;
            body.appendChild(span);
            void span.offsetWidth;
            const matched = (
              span.offsetWidth !== defaultWidth[baseFont] ||
              span.offsetHeight !== defaultHeight[baseFont]
            );
            body.removeChild(span);
            if (matched) {
              detected = true;
              break;
            }
          }
          return detected;
        };

        const processBatch = (deadline) => {
          const batchSize = Config.get('performance.fontDetectionBatchSize', 5);
          while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && fontIndex < fontList.length) {
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
            
            if (useIdleCallback && window.requestIdleCallback) {
              requestIdleCallback(processBatch, { timeout: idleTimeout });
            } else {
              setTimeout(() => processBatch({ timeRemaining: () => 5, didTimeout: false }), 10);
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
        effectiveType: connection.effectiveType || null,
        downlink: connection.downlink || null,
        downlinkMax: connection.downlinkMax || null,
        rtt: connection.rtt || null,
        saveData: connection.saveData || false,
        type: connection.type || null
      };
    } catch (e) {
      Logger.warn('ConnectionStrategy', 'Connection info failed', { error: e.message });
      return null;
    }
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

  async execute() {
    const result = {
      localStorage: false,
      sessionStorage: false,
      indexedDB: false,
      webSQL: false
    };

    try {
      result.localStorage = !!window.localStorage;
      if (result.localStorage) {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
        } catch (e) {
          Logger.warn('StorageStrategy', 'LocalStorage test failed', { error: e.message });
          result.localStorage = false;
        }
      }
    } catch (e) {
      Logger.warn('StorageStrategy', 'LocalStorage check failed', { error: e.message });
      result.localStorage = false;
    }

    try {
      result.sessionStorage = !!window.sessionStorage;
      if (result.sessionStorage) {
        try {
          sessionStorage.setItem('test', 'test');
          sessionStorage.removeItem('test');
        } catch (e) {
          Logger.warn('StorageStrategy', 'SessionStorage test failed', { error: e.message });
          result.sessionStorage = false;
        }
      }
    } catch (e) {
      Logger.warn('StorageStrategy', 'SessionStorage check failed', { error: e.message });
      result.sessionStorage = false;
    }

    try {
      result.indexedDB = !!window.indexedDB;
    } catch (e) {
      Logger.warn('StorageStrategy', 'IndexedDB check failed', { error: e.message });
      result.indexedDB = false;
    }

    try {
      result.webSQL = !!window.openDatabase;
    } catch (e) {
      Logger.warn('StorageStrategy', 'WebSQL check failed', { error: e.message });
      result.webSQL = false;
    }

    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await withTimeout(
          navigator.storage.estimate(),
          'storage',
          null,
          'StorageStrategy'
        );
        if (estimate) {
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
          return {
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
            level: battery.level
          };
        }
      }
    } catch (e) {
      Logger.warn('BatteryStrategy', 'Battery API access failed', { error: e.message });
    }
    return null;
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
    return {
      E: Math.E,
      LN2: Math.LN2,
      LN10: Math.LN10,
      LOG2E: Math.LOG2E,
      LOG10E: Math.LOG10E,
      PI: Math.PI,
      SQRT1_2: Math.SQRT1_2,
      SQRT2: Math.SQRT2,
      random: Math.random()
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
    const now = new Date();
    return {
      timestamp: now.getTime(),
      timezoneOffset: now.getTimezoneOffset(),
      dateString: now.toString(),
      toISOString: now.toISOString(),
      precision: performance.now ? performance.now() : null
    };
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
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || null,
      onLine: navigator.onLine
    };
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
      return {
        length: window.history.length,
        state: window.history.state !== null
      };
    } catch (e) {
      Logger.warn('HistoryStrategy', 'History info failed', { error: e.message });
      return null;
    }
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
          angle: screen.orientation.angle,
          type: screen.orientation.type,
          onchange: screen.orientation.onchange !== null
        };
      }
    } catch (e) {
      Logger.warn('ScreenOrientationStrategy', 'Screen orientation failed', { error: e.message });
    }
    return null;
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
  let cancelled = false;
  
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      if (!cancelled) {
        Logger.warn('withTimeout', `Operation timed out after ${timeoutMs}ms`, { context, timeoutType });
        resolve(fallbackValue);
      }
    }, timeoutMs);
  });
  
  const wrappedPromise = promise
    .then(result => {
      if (timeoutId) clearTimeout(timeoutId);
      if (!cancelled) return result;
      return fallbackValue;
    })
    .catch(error => {
      if (timeoutId) clearTimeout(timeoutId);
      Logger.error('withTimeout', 'Promise rejected', error, { context, timeoutType });
      throw error;
    });
  
  return Promise.race([wrappedPromise, timeoutPromise]);
}

/**
 * 1. Time Zone Information
 */
function getTimeZone() {
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

/**
 * 2. Browser User Agent
 */
function getUserAgent() {
  return {
    userAgent: navigator.userAgent || null,
    vendor: navigator.vendor || null,
    appName: navigator.appName || null,
    appVersion: navigator.appVersion || null,
    product: navigator.product || null,
    productSub: navigator.productSub || null
  };
}

/**
 * 3. Enhanced Canvas Fingerprinting
 * P0 FIX: Proper resource cleanup
 * P1 IMPROVEMENT: Feature flag check
 */
function getCanvasFingerprint() {
  // P1: Check feature flag
  if (!Config.get('features.canvas', true)) {
    Logger.debug('getCanvasFingerprint', 'Canvas fingerprinting disabled by config');
    return null;
  }
  
  const results = {};
  let canvas = null;
  
  try {
    canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      ResourceManager.cleanupCanvas(canvas);
      return null;
    }

    // Basic canvas fingerprint
    canvas.width = 200;
    canvas.height = 50;
    ctx.textBaseline = 'top';
    ctx.font = "16px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = "#069";
    ctx.fillText("Canvas fingerprinting test 🚀", 2, 15);
    ctx.strokeStyle = "rgba(120, 186, 176, 0.8)";
    ctx.beginPath();
    ctx.arc(100, 25, 15, 0, Math.PI * 2);
    ctx.stroke();
    results.basic = simpleHash(canvas.toDataURL());

    // Text metrics fingerprint
    ctx.font = "14px Arial";
    const metrics = ctx.measureText("Canvas fingerprint");
    results.textMetrics = {
      width: metrics.width,
      actualBoundingBoxLeft: metrics.actualBoundingBoxLeft || 0,
      actualBoundingBoxRight: metrics.actualBoundingBoxRight || 0,
      actualBoundingBoxAscent: metrics.actualBoundingBoxAscent || 0,
      actualBoundingBoxDescent: metrics.actualBoundingBoxDescent || 0
    };

    // Gradient fingerprint
    const gradient = ctx.createLinearGradient(0, 0, 200, 50);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 255, 0.5)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, 50);
    results.gradient = simpleHash(canvas.toDataURL());

    // Shadow fingerprint
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText("Shadow test", 10, 10);
    results.shadow = simpleHash(canvas.toDataURL());

    return results;
  } catch (e) {
    Logger.error('getCanvasFingerprint', 'Canvas fingerprinting failed', e);
    return null;
  } finally {
    // P0 FIX: Always cleanup canvas
    ResourceManager.cleanupCanvas(canvas);
  }
}

/**
 * 4. Enhanced Font Detection
 * P0 FIX: Async, non-blocking, with proper cleanup
 * P1 IMPROVEMENT: Uses configurable font list and performance settings
 */
async function detectFonts(fontList = null) {
  // P1: Check feature flag
  if (!Config.get('features.fonts', true)) {
    Logger.debug('detectFonts', 'Font detection disabled by config');
    return [];
  }
  
  // P1: Use configured font list if not provided
  const fontsToCheck = fontList || Config.get('fontList', []);
  if (!fontsToCheck || fontsToCheck.length === 0) {
    return [];
  }
  
  const baseFonts = ["monospace", "sans-serif", "serif"];
  const testString = "mmmmmmmmmmlli";
  const testSize = "72px";

  const body = document.body || document.getElementsByTagName("body")[0];
  if (!body) {
    Logger.warn('detectFonts', 'Document body not available');
    return [];
  }

  let span = null;
  const defaultWidth = {};
  const defaultHeight = {};

  try {
    // Create single reusable span element
    span = document.createElement("span");
    span.style.cssText = `position:absolute;left:-9999px;visibility:hidden;font-size:${testSize}`;
    span.textContent = testString;

    // Measure base fonts
    for (const font of baseFonts) {
    span.style.fontFamily = font;
    body.appendChild(span);
      // Force reflow
      void span.offsetWidth;
    defaultWidth[font] = span.offsetWidth;
    defaultHeight[font] = span.offsetHeight;
    body.removeChild(span);
    }

    // P0 FIX: Use requestIdleCallback for non-blocking font detection
    return new Promise((resolve) => {
      const availableFonts = [];
      let fontIndex = 0;

      const checkFont = (font) => {
    let detected = false;
        for (const baseFont of baseFonts) {
          span.style.fontFamily = `'${font}',${baseFont}`;
      body.appendChild(span);
          void span.offsetWidth; // Force reflow
      const matched = (
        span.offsetWidth !== defaultWidth[baseFont] ||
        span.offsetHeight !== defaultHeight[baseFont]
      );
      body.removeChild(span);
          if (matched) {
            detected = true;
            break;
          }
        }
        return detected;
      };

      const processBatch = (deadline) => {
        const batchSize = Config.get('performance.fontDetectionBatchSize', 5);
        // Process fonts while we have time
        while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && fontIndex < fontsToCheck.length) {
          const font = fontsToCheck[fontIndex];
          if (checkFont(font)) {
      availableFonts.push(font);
    }
          fontIndex++;
          
          // P1: Process in batches for better performance
          if (fontIndex % batchSize === 0 && deadline.timeRemaining() < 1) {
            break;
          }
        }

        if (fontIndex < fontsToCheck.length) {
          // More fonts to process, schedule next batch
          const useIdleCallback = Config.get('performance.useRequestIdleCallback', true);
          const idleTimeout = Config.get('performance.fontDetectionIdleTimeout', 5000);
          
          if (useIdleCallback && window.requestIdleCallback) {
            requestIdleCallback(processBatch, { timeout: idleTimeout });
          } else {
            // Fallback: use setTimeout with small delay
            setTimeout(() => processBatch({ timeRemaining: () => 5, didTimeout: false }), 10);
          }
        } else {
          // All fonts processed
          resolve(availableFonts);
        }
      };

      // Start processing
      const useIdleCallback = Config.get('performance.useRequestIdleCallback', true);
      const idleTimeout = Config.get('performance.fontDetectionIdleTimeout', 5000);
      
      if (useIdleCallback && window.requestIdleCallback) {
        requestIdleCallback(processBatch, { timeout: idleTimeout });
      } else {
        // Fallback for browsers without requestIdleCallback
        processBatch({ timeRemaining: () => Infinity, didTimeout: false });
      }
    });
  } catch (e) {
    Logger.error('detectFonts', 'Font detection failed', e);
    return [];
  } finally {
    // P0 FIX: Always cleanup DOM element
    ResourceManager.cleanupDOMElement(span);
  }
}

/**
 * 5. Screen Information
 */
function getScreenInfo() {
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

/**
 * 6. Browser Plugins and MIME Types
 * P0 FIX: Added error logging
 */
function getPlugins() {
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
    Logger.error('getPlugins', 'Plugin detection failed', e);
    return [];
  }
}

/**
 * 7. Language and Locale Information
 */
function getLanguageInfo() {
  return {
    language: navigator.language || null,
    languages: navigator.languages || [],
    systemLanguage: navigator.systemLanguage || null,
    userLanguage: navigator.userLanguage || null
  };
}

/**
 * 8. Platform and Hardware Information
 */
function getPlatformInfo() {
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

  // User-Agent Client Hints API (if available)
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

/**
 * 9. Enhanced WebGL Fingerprinting
 * P0 FIX: Proper resource cleanup
 * P1 IMPROVEMENT: Feature flag check
 */
function getWebGLInfo() {
  // P1: Check feature flag
  if (!Config.get('features.webgl', true)) {
    Logger.debug('getWebGLInfo', 'WebGL fingerprinting disabled by config');
    return null;
  }
  
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

    // WebGL parameters
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

    // WebGL extensions
    const extensions = gl.getSupportedExtensions() || [];
    results.extensions = extensions;
    results.extensionsCount = extensions.length;

    // WebGL fingerprint via canvas
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

    // WebGL2 if available
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
    Logger.error('getWebGLInfo', 'WebGL fingerprinting failed', e);
    return null;
  } finally {
    // P0 FIX: Always cleanup WebGL contexts and canvas
    ResourceManager.cleanupWebGL(gl);
    if (gl2) ResourceManager.cleanupWebGL(gl2);
    ResourceManager.cleanupCanvas(canvas);
  }
}

/**
 * 10. Enhanced Audio Context Fingerprinting
 * P0 FIX: Proper resource cleanup
 * P1 IMPROVEMENT: Feature flag check
 */
async function getAudioFingerprint() {
  // P1: Check feature flag
  if (!Config.get('features.audio', true)) {
    Logger.debug('getAudioFingerprint', 'Audio fingerprinting disabled by config');
    return null;
  }
  
  let context = null;
  
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext || window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!AudioContext) return null;

    context = new AudioContext(1, 44100, 44100);
    
    // Add timeout wrapper
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

    return await withTimeout(audioPromise, 'audio', null, 'getAudioFingerprint');
  } catch (e) {
    Logger.error('getAudioFingerprint', 'Audio fingerprinting failed', e);
    return null;
  } finally {
    // P0 FIX: Always cleanup AudioContext
    ResourceManager.cleanupAudioContext(context);
  }
}

/**
 * 11. Media Devices Information
 * P0 FIX: Added error logging and timeout context
 * P1 IMPROVEMENT: Feature flag check
 */
async function getMediaDevices() {
  // P1: Check feature flag
  if (!Config.get('features.mediaDevices', true)) {
    Logger.debug('getMediaDevices', 'Media device detection disabled by config');
    return null;
  }
  
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return null;
    }

    const devices = await withTimeout(
      navigator.mediaDevices.enumerateDevices(),
      'mediaDevices',
      [],
      'getMediaDevices'
    );
    const result = {
      audioInputs: [],
      audioOutputs: [],
      videoInputs: []
    };

    devices.forEach(device => {
      const deviceInfo = {
        deviceId: device.deviceId ? simpleHash(device.deviceId) : null, // Hash for privacy
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
    Logger.error('getMediaDevices', 'Media device enumeration failed', e);
    return null;
  }
}

/**
 * 12. Connection Information
 */
function getConnectionInfo() {
  try {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return null;

    return {
      effectiveType: connection.effectiveType || null,
      downlink: connection.downlink || null,
      downlinkMax: connection.downlinkMax || null,
      rtt: connection.rtt || null,
      saveData: connection.saveData || false,
      type: connection.type || null
    };
  } catch (e) {
    return null;
  }
}

/**
 * 13. Touch and Pointer Support
 */
function getTouchInfo() {
  return {
    maxTouchPoints: navigator.maxTouchPoints || 0,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    pointerSupport: {
      pointerEvents: 'PointerEvent' in window,
      maxPointers: navigator.maxTouchPoints || 0
    }
  };
}

/**
 * 14. Storage Information
 * P0 FIX: Added error logging
 */
async function getStorageInfo() {
  const result = {
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
    webSQL: false
  };

  try {
    result.localStorage = !!window.localStorage;
    if (result.localStorage) {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
      } catch (e) {
        Logger.warn('getStorageInfo', 'LocalStorage test failed', { error: e.message });
        result.localStorage = false;
      }
    }
  } catch (e) {
    Logger.warn('getStorageInfo', 'LocalStorage check failed', { error: e.message });
    result.localStorage = false;
  }

  try {
    result.sessionStorage = !!window.sessionStorage;
    if (result.sessionStorage) {
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
      } catch (e) {
        Logger.warn('getStorageInfo', 'SessionStorage test failed', { error: e.message });
        result.sessionStorage = false;
      }
    }
  } catch (e) {
    Logger.warn('getStorageInfo', 'SessionStorage check failed', { error: e.message });
    result.sessionStorage = false;
  }

  try {
    result.indexedDB = !!window.indexedDB;
  } catch (e) {
    Logger.warn('getStorageInfo', 'IndexedDB check failed', { error: e.message });
    result.indexedDB = false;
  }

  try {
    result.webSQL = !!window.openDatabase;
  } catch (e) {
    Logger.warn('getStorageInfo', 'WebSQL check failed', { error: e.message });
    result.webSQL = false;
  }

  // Storage quota (if available)
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await withTimeout(
        navigator.storage.estimate(),
        'storage',
        null,
        'getStorageInfo'
      );
      if (estimate) {
        result.quota = estimate.quota || null;
        result.usage = estimate.usage || null;
        result.usageDetails = estimate.usageDetails || null;
      }
    } catch (e) {
      Logger.warn('getStorageInfo', 'Storage quota estimation failed', { error: e.message });
    }
  }

  return result;
}

/**
 * 15. Permissions API
 * P0 FIX: Added error logging
 */
async function getPermissions() {
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
      const status = await withTimeout(
        navigator.permissions.query({ name: permission }),
        'permissions',
        null,
        `getPermissions:${permission}`
      );
      result[permission] = status ? status.state : 'timeout';
    } catch (e) {
      // Permission not supported or denied
      Logger.warn('getPermissions', `Permission query failed for ${permission}`, { error: e.message });
      result[permission] = 'unsupported';
    }
  }

  return result;
}

/**
 * 16. Speech Synthesis Voices
 */
function getSpeechVoices() {
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
    return null;
  }
}

/**
 * 17. Battery API (deprecated but still works)
 * P0 FIX: Added error logging
 */
async function getBatteryInfo() {
  try {
    if (navigator.getBattery) {
      const battery = await withTimeout(
        navigator.getBattery(),
        'battery',
        null,
        'getBatteryInfo'
      );
      if (battery) {
        return {
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
          level: battery.level
        };
      }
    }
  } catch (e) {
    Logger.warn('getBatteryInfo', 'Battery API access failed', { error: e.message });
  }
  return null;
}

/**
 * 18. CSS Media Queries
 */
function getMediaQueries() {
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

/**
 * 19. Feature Detection
 */
function getFeatureDetection() {
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

/**
 * 20. Performance Timing
 */
function getPerformanceInfo() {
  try {
    if (!window.performance || !window.performance.timing) {
      return null;
    }

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
    return null;
  }
}

/**
 * 21. Math Constants (Floating Point Precision)
 */
function getMathConstants() {
  return {
    E: Math.E,
    LN2: Math.LN2,
    LN10: Math.LN10,
    LOG2E: Math.LOG2E,
    LOG10E: Math.LOG10E,
    PI: Math.PI,
    SQRT1_2: Math.SQRT1_2,
    SQRT2: Math.SQRT2,
    random: Math.random() // Single random value for consistency
  };
}

/**
 * 22. Date/Time Precision
 */
function getDateTimePrecision() {
  const now = new Date();
  return {
    timestamp: now.getTime(),
    timezoneOffset: now.getTimezoneOffset(),
    dateString: now.toString(),
    toISOString: now.toISOString(),
    precision: performance.now ? performance.now() : null
  };
}

/**
 * 23. Cookie and Do Not Track
 */
function getPrivacySettings() {
  return {
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || null,
    onLine: navigator.onLine
  };
}

/**
 * 24. History Length
 */
function getHistoryInfo() {
  try {
    return {
      length: window.history.length,
      state: window.history.state !== null
    };
  } catch (e) {
    return null;
  }
}

/**
 * 25. Media Codecs Support
 */
function getMediaCodecs() {
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

/**
 * 26. WebRTC IP Leak (Privacy-conscious)
 * P0 FIX: Fix race conditions, proper cleanup
 */
async function getWebRTCInfo() {
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
      
      // P0 FIX: Prevent multiple resolves
      const safeResolve = (value) => {
        if (!resolved) {
          resolved = true;
          if (timeoutId) clearTimeout(timeoutId);
          ResourceManager.cleanupPeerConnection(pc);
          resolve(value);
        }
      };
      
      // P0 FIX: Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          candidates.push(event.candidate.candidate);
        } else {
          // All candidates gathered
          safeResolve({
            hasWebRTC: true,
            candidatesCount: candidates.length
            // Note: Not including actual IPs for privacy
          });
        }
      };
      
      // P0 FIX: Handle errors
      pc.onerror = (error) => {
        Logger.warn('getWebRTCInfo', 'WebRTC error', null, { error: error.message || 'Unknown error' });
        safeResolve({ hasWebRTC: true, error: true });
      };
      
      // P0 FIX: Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          safeResolve({ hasWebRTC: true, connectionState: pc.connectionState });
        }
      };

      // Create data channel and offer
      try {
        pc.createDataChannel('');
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .catch((error) => {
            Logger.warn('getWebRTCInfo', 'Failed to create offer', error);
            safeResolve({ hasWebRTC: true, error: true });
          });
      } catch (error) {
        Logger.warn('getWebRTCInfo', 'Failed to create data channel', error);
        safeResolve({ hasWebRTC: true, error: true });
      }

      // P0 FIX: Timeout with cleanup (P1: Uses configurable timeout)
      const webRTCTimeout = Config.get('timeouts.webRTC', 2000);
      timeoutId = setTimeout(() => {
        safeResolve({ hasWebRTC: true, timeout: true });
      }, webRTCTimeout);
    });
  } catch (e) {
    Logger.error('getWebRTCInfo', 'WebRTC detection failed', e);
    if (pc) ResourceManager.cleanupPeerConnection(pc);
    if (timeoutId) clearTimeout(timeoutId);
    return null;
  }
}

/**
 * 27. Screen Orientation
 */
function getScreenOrientation() {
  try {
    if (screen.orientation) {
      return {
        angle: screen.orientation.angle,
        type: screen.orientation.type,
        onchange: screen.orientation.onchange !== null
      };
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * 28. Device Motion/Orientation (if available)
 */
function getDeviceMotion() {
  try {
    return {
      deviceMotion: 'DeviceMotionEvent' in window,
      deviceOrientation: 'DeviceOrientationEvent' in window,
      // Note: Not reading actual values to avoid permission prompts
    };
  } catch (e) {
    return null;
  }
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

/**
 * Legacy getFingerprint implementation (kept for reference, not used)
 * This function is replaced by the Strategy Pattern implementation above
 */
async function getFingerprint_Legacy(userConfig = {}) {
  // P1: Merge user config with defaults
  if (Object.keys(userConfig).length > 0) {
    Config.init(userConfig);
  }
  
  // P1: Use configured font list
  const fontList = Config.get('fontList', []);
  
  // P1: Check cache first (using stable components that don't require async operations)
  let cacheKey = null;
  if (Config.get('cache.enabled', true)) {
    try {
      // Get stable components synchronously for cache key
      const quickFingerprint = {
        screen: Config.get('features.screen', true) ? getScreenInfo() : null,
        platform: Config.get('features.platform', true) ? getPlatformInfo() : null,
        language: Config.get('features.language', true) ? getLanguageInfo() : null,
        timeZone: Config.get('features.timeZone', true) ? getTimeZone() : null,
        userAgent: Config.get('features.userAgent', true) ? getUserAgent() : null
      };
      
      const stableComponents = Cache.getStableComponents(quickFingerprint);
      cacheKey = Cache.generateCacheKey(stableComponents);
      
      const cachedResult = await Cache.get(cacheKey);
      if (cachedResult) {
        Logger.info('getFingerprint', 'Cache hit - returning cached fingerprint', { cacheKey });
        return {
          ...cachedResult,
          cached: true,
          cacheKey
        };
      }
      
      Logger.debug('getFingerprint', 'Cache miss - generating new fingerprint', { cacheKey });
    } catch (e) {
      Logger.warn('getFingerprint', 'Cache check failed, continuing with generation', { error: e.message });
    }
  }

  // P0 FIX: Collect all fingerprint data with error handling
  let fonts, canvasFp, ua, timeZone, screenInfo, plugins, langInfo, platformInfo;
  let webglInfo, audioFp, mediaDevices, connectionInfo, touchInfo, storageInfo;
  let permissions, speechVoices, batteryInfo, mediaQueries, features;
  let performanceInfo, mathConstants, dateTimePrecision, privacySettings;
  let historyInfo, mediaCodecs, webRTCInfo, screenOrientation, deviceMotion;

  try {
    [
      fonts,
      canvasFp,
      ua,
      timeZone,
      screenInfo,
      plugins,
      langInfo,
      platformInfo,
      webglInfo,
      audioFp,
      mediaDevices,
      connectionInfo,
      touchInfo,
      storageInfo,
      permissions,
      speechVoices,
      batteryInfo,
      mediaQueries,
      features,
      performanceInfo,
      mathConstants,
      dateTimePrecision,
      privacySettings,
      historyInfo,
      mediaCodecs,
      webRTCInfo,
      screenOrientation,
      deviceMotion
    ] = await Promise.allSettled([
      // P1: Only call functions if feature is enabled
      Config.get('features.fonts', true) ? detectFonts(fontList) : Promise.resolve([]),
      Config.get('features.canvas', true) ? Promise.resolve(getCanvasFingerprint()) : Promise.resolve(null),
      Config.get('features.userAgent', true) ? Promise.resolve(getUserAgent()) : Promise.resolve(null),
      Config.get('features.timeZone', true) ? Promise.resolve(getTimeZone()) : Promise.resolve(null),
      Config.get('features.screen', true) ? Promise.resolve(getScreenInfo()) : Promise.resolve(null),
      Config.get('features.plugins', true) ? Promise.resolve(getPlugins()) : Promise.resolve([]),
      Config.get('features.language', true) ? Promise.resolve(getLanguageInfo()) : Promise.resolve(null),
      Config.get('features.platform', true) ? Promise.resolve(getPlatformInfo()) : Promise.resolve(null),
      Config.get('features.webgl', true) ? Promise.resolve(getWebGLInfo()) : Promise.resolve(null),
      Config.get('features.audio', true) ? getAudioFingerprint() : Promise.resolve(null),
      Config.get('features.mediaDevices', true) ? getMediaDevices() : Promise.resolve(null),
      Config.get('features.connection', true) ? Promise.resolve(getConnectionInfo()) : Promise.resolve(null),
      Config.get('features.touch', true) ? Promise.resolve(getTouchInfo()) : Promise.resolve(null),
      Config.get('features.storage', true) ? getStorageInfo() : Promise.resolve(null),
      Config.get('features.permissions', true) ? getPermissions() : Promise.resolve(null),
      Config.get('features.speechVoices', true) ? Promise.resolve(getSpeechVoices()) : Promise.resolve(null),
      Config.get('features.battery', true) ? getBatteryInfo() : Promise.resolve(null),
      Config.get('features.mediaQueries', true) ? Promise.resolve(getMediaQueries()) : Promise.resolve(null),
      Config.get('features.features', true) ? Promise.resolve(getFeatureDetection()) : Promise.resolve(null),
      Config.get('features.performance', true) ? Promise.resolve(getPerformanceInfo()) : Promise.resolve(null),
      Config.get('features.math', true) ? Promise.resolve(getMathConstants()) : Promise.resolve(null),
      Config.get('features.dateTime', true) ? Promise.resolve(getDateTimePrecision()) : Promise.resolve(null),
      Config.get('features.privacy', true) ? Promise.resolve(getPrivacySettings()) : Promise.resolve(null),
      Config.get('features.history', true) ? Promise.resolve(getHistoryInfo()) : Promise.resolve(null),
      Config.get('features.codecs', true) ? Promise.resolve(getMediaCodecs()) : Promise.resolve(null),
      Config.get('features.webRTC', true) ? getWebRTCInfo() : Promise.resolve(null),
      Config.get('features.orientation', true) ? Promise.resolve(getScreenOrientation()) : Promise.resolve(null),
      Config.get('features.deviceMotion', true) ? Promise.resolve(getDeviceMotion()) : Promise.resolve(null)
    ]).then(results => {
      // P0 FIX: Extract values from Promise.allSettled results, log failures
      return results.map((result, index) => {
        if (result.status === 'rejected') {
          const methodNames = [
            'detectFonts', 'getCanvasFingerprint', 'getUserAgent', 'getTimeZone',
            'getScreenInfo', 'getPlugins', 'getLanguageInfo', 'getPlatformInfo',
            'getWebGLInfo', 'getAudioFingerprint', 'getMediaDevices', 'getConnectionInfo',
            'getTouchInfo', 'getStorageInfo', 'getPermissions', 'getSpeechVoices',
            'getBatteryInfo', 'getMediaQueries', 'getFeatureDetection', 'getPerformanceInfo',
            'getMathConstants', 'getDateTimePrecision', 'getPrivacySettings', 'getHistoryInfo',
            'getMediaCodecs', 'getWebRTCInfo', 'getScreenOrientation', 'getDeviceMotion'
          ];
          Logger.error('getFingerprint', `Failed to collect ${methodNames[index]}`, result.reason);
          return null;
        }
        return result.value;
      });
    });
  } catch (e) {
    Logger.error('getFingerprint', 'Critical error during fingerprint collection', e);
    throw e;
  }

  const fingerprintObject = {
    // Core identifiers
    timeZone,
    userAgent: ua,
    canvasFingerprint: canvasFp,
    fonts,
    screen: screenInfo,
    plugins,
    language: langInfo,
    platform: platformInfo,
    webgl: webglInfo,
    audioFingerprint: audioFp,

    // Extended detection
    mediaDevices,
    connection: connectionInfo,
    touch: touchInfo,
    storage: storageInfo,
    permissions,
    speechVoices,
    battery: batteryInfo,
    mediaQueries,
    features,
    performance: performanceInfo,
    math: mathConstants,
    dateTime: dateTimePrecision,
    privacy: privacySettings,
    history: historyInfo,
    codecs: mediaCodecs,
    webRTC: webRTCInfo,
    orientation: screenOrientation,
    deviceMotion
  };

  // Generate hash
  const fingerprintString = JSON.stringify(fingerprintObject);
  const fingerprintHash = await cryptoHash(fingerprintString);

  const result = {
    fingerprint: fingerprintObject,
    fingerprintHash,
    timestamp: Date.now(),
    version: '3.0.0', // P0 fixes + P1 caching & configuration + P2 Strategy Pattern
    cached: false
  };
  
  // P1: Cache the result
  if (Config.get('cache.enabled', true) && cacheKey) {
    try {
      await Cache.set(cacheKey, {
        fingerprint: fingerprintObject,
        fingerprintHash,
        timestamp: result.timestamp,
        version: result.version
      });
      result.cacheKey = cacheKey;
      Logger.info('getFingerprint', 'Fingerprint cached', { cacheKey });
    } catch (e) {
      Logger.warn('getFingerprint', 'Failed to cache fingerprint', { error: e.message });
    }
  } else if (Config.get('cache.enabled', true) && !cacheKey) {
    // Generate cache key if not already generated
    try {
      const stableComponents = Cache.getStableComponents(fingerprintObject);
      cacheKey = Cache.generateCacheKey(stableComponents);
      await Cache.set(cacheKey, {
        fingerprint: fingerprintObject,
        fingerprintHash,
        timestamp: result.timestamp,
        version: result.version
      });
      result.cacheKey = cacheKey;
      Logger.info('getFingerprint', 'Fingerprint cached', { cacheKey });
    } catch (e) {
      Logger.warn('getFingerprint', 'Failed to cache fingerprint', { error: e.message });
    }
  }
  
  Logger.info('getFingerprint', 'Fingerprint generated successfully', {
    hashLength: fingerprintHash.length,
    timestamp: result.timestamp,
    cached: result.cached
  });
  
  return result;
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
