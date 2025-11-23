// Utility: simple hash function for strings (for canvas/audio, etc.)
function simpleHash(str) {
  let hash = 0, i, chr;
  if (!str || str.length === 0) return hash.toString();
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

/**
 * 3. Canvas Fingerprinting
 */
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

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

    const dataUrl = canvas.toDataURL();
    return simpleHash(dataUrl);
  } catch (e) {
    return null;
  }
}

/**
 * 4. Installed Fonts (heuristic; not perfect and can be slow)
 */
function detectFonts(fontList) {
  const baseFonts = ["monospace", "sans-serif", "serif"];
  const testString = "mmmmmmmmmmlli";
  const testSize = "72px";

  const body = document.body || document.getElementsByTagName("body")[0];
  if (!body) return [];

  const span = document.createElement("span");
  span.style.fontSize = testSize;
  span.innerHTML = testString;
  span.style.position = "absolute";
  span.style.left = "-9999px";

  const defaultWidth = {};
  const defaultHeight = {};

  baseFonts.forEach(function (font) {
    span.style.fontFamily = font;
    body.appendChild(span);
    defaultWidth[font] = span.offsetWidth;
    defaultHeight[font] = span.offsetHeight;
    body.removeChild(span);
  });

  function isFontAvailable(font) {
    let detected = false;
    baseFonts.forEach(function (baseFont) {
      span.style.fontFamily = "'" + font + "'," + baseFont;
      body.appendChild(span);
      const matched = (
        span.offsetWidth !== defaultWidth[baseFont] ||
        span.offsetHeight !== defaultHeight[baseFont]
      );
      body.removeChild(span);
      if (matched) detected = true;
    });
    return detected;
  }

  const availableFonts = [];
  fontList.forEach(function (font) {
    if (isFontAvailable(font)) {
      availableFonts.push(font);
    }
  });

  return availableFonts;
}

/**
 * 2. Browser (User Agent)
 */
function getUserAgent() {
  return navigator.userAgent || null;
}

/**
 * 1. Time Zone: name + offset
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
  const offsetMinutes = new Date().getTimezoneOffset(); // difference from UTC in minutes
  return {
    name: name || null,
    offsetMinutes // e.g. -360 for UTC+6
  };
}

/**
 * 5. Screen Resolution and Color Depth
 */
function getScreenInfo() {
  const s = window.screen || {};
  return {
    width: s.width || null,
    height: s.height || null,
    availWidth: s.availWidth || null,
    availHeight: s.availHeight || null,
    colorDepth: s.colorDepth || null,
    pixelRatio: window.devicePixelRatio || 1
  };
}

/**
 * 6. Browser Plugins (limited/empty on modern browsers)
 */
function getPlugins() {
  try {
    if (!navigator.plugins) return [];
    const plugins = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      const p = navigator.plugins[i];
      plugins.push({
        name: p.name,
        filename: p.filename,
        description: p.description
      });
    }
    return plugins;
  } catch (e) {
    return [];
  }
}

/**
 * 7. Language and System Locale
 */
function getLanguageInfo() {
  return {
    language: navigator.language || null,
    languages: navigator.languages || []
  };
}

/**
 * 8. Platform and CPU Architecture
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

  return {
    platform: navigator.platform || null, // e.g. "Win32", "MacIntel"
    architecture,
    userAgentData: navigator.userAgentData ? {
      platform: navigator.userAgentData.platform || null,
      mobile: navigator.userAgentData.mobile || false,
      brands: navigator.userAgentData.brands || []
    } : null
  };
}

/**
 * 9. WebGL Information
 */
function getWebGLInfo() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return null;

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return null;

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    return {
      vendor,
      renderer
    };
  } catch (e) {
    return null;
  }
}

/**
 * 10. AudioContext Fingerprinting
 */
async function getAudioFingerprint() {
  try {
    const AudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!AudioContext) return null;

    const context = new AudioContext(1, 44100, 44100); // 1 channel, 1 second
    const osc = context.createOscillator();
    const comp = context.createDynamicsCompressor();

    osc.type = "triangle";
    osc.frequency.value = 1000;

    comp.threshold.value = -50;
    comp.knee.value = 40;
    comp.ratio.value = 12;
    comp.reduction.value = -20;
    comp.attack.value = 0;
    comp.release.value = 0.25;

    osc.connect(comp);
    comp.connect(context.destination);
    osc.start(0);

    const buffer = await context.startRendering(); // offline rendering
    const data = buffer.getChannelData(0);
    let output = "";
    for (let i = 0; i < data.length; i += 100) {
      output += Math.abs(data[i]).toString();
    }
    return simpleHash(output);
  } catch (e) {
    return null;
  }
}

/**
 * Combined fingerprint – matches your 1–10 list
 */
async function getFingerprint() {
  const fontList = [
    "Arial", "Verdana", "Times New Roman", "Courier New", "Roboto",
    "Open Sans", "Noto Sans", "Helvetica", "Tahoma", "Georgia", "Comic Sans MS"
  ];

  const fonts = detectFonts(fontList);          // 4
  const canvasFp = getCanvasFingerprint();      // 3
  const ua = getUserAgent();                    // 2
  const timeZone = getTimeZone();               // 1
  const screenInfo = getScreenInfo();           // 5
  const plugins = getPlugins();                 // 6
  const langInfo = getLanguageInfo();           // 7
  const platformInfo = getPlatformInfo();       // 8
  const webglInfo = getWebGLInfo();             // 9
  const audioFp = await getAudioFingerprint();  // 10

  const fingerprintObject = {
    // 1. Time Zone
    timeZoneName: timeZone.name,
    timeZoneOffsetMinutes: timeZone.offsetMinutes,

    // 2. Browser (User Agent)
    userAgent: ua,

    // 3. Canvas Fingerprinting
    canvasFingerprint: canvasFp,

    // 4. Installed Fonts
    fonts,

    // 5. Screen Resolution and Color Depth
    screen: screenInfo,

    // 6. Browser Plugins
    plugins,

    // 7. Language and System Locale
    language: langInfo.language,
    languages: langInfo.languages,

    // 8. Platform and CPU Architecture
    platform: platformInfo.platform,
    architecture: platformInfo.architecture,
    userAgentData: platformInfo.userAgentData,

    // 9. WebGL Information
    webgl: webglInfo,

    // 10. AudioContext Fingerprinting
    audioFingerprint: audioFp
  };

  const fingerprintHash = simpleHash(JSON.stringify(fingerprintObject));

  return {
    fingerprint: fingerprintObject,
    fingerprintHash
  };
}

// Example usage:
getFingerprint().then(result => {
  console.log("Fingerprint object:", result.fingerprint);
  console.log("Combined fingerprint hash:", result.fingerprintHash);
});