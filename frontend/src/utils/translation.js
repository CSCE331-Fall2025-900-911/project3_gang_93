import { translateAPI } from "../services/api";

// Translation cache to avoid repeated API calls
const translationCache = new Map();

// Fallback translations for words that Google Translate returns unchanged
// These are only used if the API returns the same text as the original
// Note: These are applied AFTER the API call, so the API is always called first
const fallbackTranslations = {
  es: {
    Base: "Base", // "Base" is a loanword commonly used in Spanish
    Total: "Total", // "Total" is the same in Spanish
    Regular: "Normal", // "Regular" in sweetness context should be "Normal"
    "75% (Regular)": "75% (Normal)",
    Normal: "Normal", // "Normal" is the same in Spanish
    "Normal Ice": "Hielo normal", // Translate "Normal Ice" as a phrase
  },
  en: {
    // English is the base language
  },
};

// Get cache key
const getCacheKey = (text, targetLanguage) => `${text}|${targetLanguage}`;

/**
 * Translate text to target language with caching
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (e.g., "es")
 * @param {boolean} forceRefresh - If true, bypass cache and force API call
 */
export const translate = async (
  text,
  targetLanguage = "en",
  forceRefresh = false
) => {
  // If English, return original text
  if (targetLanguage === "en" || !text || text.trim() === "") {
    return text;
  }

  const cacheKey = getCacheKey(text, targetLanguage);

  // Check cache first (unless forcing refresh)
  if (!forceRefresh && translationCache.has(cacheKey)) {
    const cached = translationCache.get(cacheKey);
    // Reduced logging for performance
    return cached;
  }

  // If forcing refresh, remove from cache
  if (forceRefresh) {
    translationCache.delete(cacheKey);
    console.log(`[Translation] Force refresh - clearing cache for: "${text}"`);
  }

  try {
    // Always call translation API - no hardcoded translations
    // Reduced logging for performance - only log in development
    if (import.meta.env.DEV) {
      console.log(`[Translation] Calling API for: "${text}" -> ${targetLanguage}`);
    }
    let translated = await translateAPI.translate(text, targetLanguage);
    if (import.meta.env.DEV) {
      console.log(`[Translation] API returned: "${translated}" for "${text}"`);
    }

    // Check for fallback translation - always check if fallback exists
    // This ensures words like "Base", "Total", "Regular" get proper translations
    // Always use fallback if it exists (even if same as original, it ensures consistency)
    if (targetLanguage !== "en" && fallbackTranslations[targetLanguage]) {
      if (fallbackTranslations[targetLanguage][text]) {
        const fallback = fallbackTranslations[targetLanguage][text];
        // Always use fallback if it exists (for consistency, even if same as original)
        if (import.meta.env.DEV) {
          console.log(
            `[Translation] Using fallback translation: "${text}" -> "${fallback}" (API returned: "${translated}")`
          );
        }
        translated = fallback;
      }
    }

    // Log if translation didn't change (even after fallback) - only in dev
    if (translated === text && targetLanguage !== "en" && import.meta.env.DEV) {
      console.warn(
        `[Translation] Text "${text}" was not translated (API returned same, fallback also same)`
      );
    }

    // Cache the result (use fallback if available)
    translationCache.set(cacheKey, translated);

    return translated;
  } catch (error) {
    console.error("[Translation] API call failed for:", text, error);
    // Try fallback on error
    if (
      fallbackTranslations[targetLanguage] &&
      fallbackTranslations[targetLanguage][text]
    ) {
      console.log(
        `[Translation] Using fallback due to error: "${text}" -> "${fallbackTranslations[targetLanguage][text]}"`
      );
      return fallbackTranslations[targetLanguage][text];
    }
    // Return original text on error
    return text;
  }
};

/**
 * Translate multiple texts efficiently using batch API when available
 */
export const translateBatch = async (texts, targetLanguage = "en") => {
  if (targetLanguage === "en") {
    return texts;
  }

  // Filter out cached texts and empty texts
  const textsToTranslate = [];
  const cachedResults = [];
  const textIndices = [];
  
  texts.forEach((text, index) => {
    if (!text || text.trim() === "") {
      cachedResults[index] = text;
    } else {
      const cacheKey = getCacheKey(text, targetLanguage);
      if (translationCache.has(cacheKey)) {
        cachedResults[index] = translationCache.get(cacheKey);
      } else {
        textsToTranslate.push(text);
        textIndices.push(index);
      }
    }
  });

  // If all texts are cached, return cached results
  if (textsToTranslate.length === 0) {
    return texts.map((text, index) => cachedResults[index] || text);
  }

  try {
    // Use batch API for better performance
    const batchTranslations = await translateAPI.translateBatch(textsToTranslate, targetLanguage);
    
    // Cache and map results back to original positions
    const results = [...texts];
    textIndices.forEach((originalIndex, batchIndex) => {
      const translated = batchTranslations[batchIndex];
      const originalText = textsToTranslate[batchIndex];
      const cacheKey = getCacheKey(originalText, targetLanguage);
      translationCache.set(cacheKey, translated);
      results[originalIndex] = translated;
    });
    
    // Fill in cached results
    cachedResults.forEach((cached, index) => {
      if (cached !== undefined) {
        results[index] = cached;
      }
    });
    
    return results;
  } catch (error) {
    console.error("[Translation] Batch translation failed, falling back to individual translations:", error);
    // Fallback to individual translations if batch fails
    const translations = await Promise.all(
      texts.map((text) => translate(text, targetLanguage))
    );
    return translations;
  }
};

/**
 * Clear translation cache
 */
export const clearTranslationCache = () => {
  translationCache.clear();
};
