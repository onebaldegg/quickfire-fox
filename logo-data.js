// Logo data using reliable GitHub-hosted assets from The-Quickness-Icons repository
const LOGO_URL = 'https://raw.githubusercontent.com/onebaldegg/The-Quickness-Icons/main/The%20Quickness%20Extension%20Icon%201024x10124.png';
const EXTENSION_ICON_URL = 'https://raw.githubusercontent.com/onebaldegg/The-Quickness-Icons/main/The%20Quickness%20Extension%20Icon%2048x48.png';

// Fallback logo as base64 (simple orange text logo for backup)
const FALLBACK_LOGO_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjAwIDgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRkY2QjM1O3N0b3Atb3BhY2l0eToxIiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I0Y1OUUwQjtzdG9wLW9wYWNpdHk6MSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjMzMzMzMzIiByeD0iOCIvPjx0ZXh0IHg9IjEwMCIgeT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9InVybCgjZ3JhZGllbnQpIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5USEUgUVVJQ0tORVNTPC90ZXh0Pjx0ZXh0IHg9IjEwMCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iI0JGNzdGNiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2NyZWVuc2hvdCAmYW1wOyBQREYgVG9vbDwvdGV4dD48L3N2Zz4=';

// Simple in-memory cache (no storage permission needed)
let logoCache = null;

// Function to convert image to base64 with GitHub hosting (lazy loading)
async function loadLogoAsBase64() {
  // Return cached version if available
  if (logoCache) {
    console.log('Using cached GitHub-hosted logo data');
    return logoCache;
  }
  
  try {
    console.log('Loading GitHub-hosted logo for PDF generation...');
    const response = await fetch(LOGO_URL, {
      cache: 'force-cache', // Use browser cache when possible
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub logo: ${response.status}`);
    }
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        logoCache = reader.result; // Cache in memory only
        console.log('GitHub-hosted logo cached successfully');
        resolve(reader.result);
      };
      reader.onerror = () => {
        console.warn('Failed to convert GitHub logo to base64, using fallback');
        logoCache = FALLBACK_LOGO_BASE64;
        resolve(FALLBACK_LOGO_BASE64);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to load GitHub logo, using fallback:', error);
    logoCache = FALLBACK_LOGO_BASE64;
    return FALLBACK_LOGO_BASE64;
  }
}

// Set up logo references with GitHub hosting
window.LOGO_BASE64 = LOGO_URL; // For HTML usage (reliable GitHub URL)
window.loadLogoAsBase64 = loadLogoAsBase64; // For PDF usage
window.GITHUB_ASSETS = {
  LOGO_URL: LOGO_URL,
  EXTENSION_ICON_URL: EXTENSION_ICON_URL,
  FALLBACK_LOGO_BASE64: FALLBACK_LOGO_BASE64
};

// NO automatic preloading - logo will be loaded only when needed for PDF generation
