import { useState, useRef, useEffect } from "react";
import WeatherWidget from "./WeatherWidget";
import { translate, translateBatch, clearTranslationCache } from "../utils/translation";
import "./KioskView.css";

function KioskView({ menuItems, cart, onItemClick, onAddToCart, onRemoveItem, onCompleteTransaction, user, onLoginClick, onLogout, isExpanded, onToggleExpanded, onLanguageChange }) {
  const [filter, setFilter] = useState("all");
  const [currentStep, setCurrentStep] = useState("menu"); // "menu" or "cart"
  const [language, setLanguage] = useState(() => {
    // Initialize from localStorage if available, otherwise default to "en"
    const saved = localStorage.getItem("kiosk_language");
    return saved || "en";
  }); // "en" or "es"
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const languageDropdownRef = useRef(null);
  const [translations, setTranslations] = useState({});
  const [translating, setTranslating] = useState(false);
  const [translatingMenuItems, setTranslatingMenuItems] = useState(false);
  const [translatingCart, setTranslatingCart] = useState(false);

  const languages = {
    en: "English",
    es: "Español"
  };

  // UI text keys that need translation
  const uiTextKeys = {
    orderHere: "Order Here",
    currentOrder: "Current Order",
    addMoreItems: "Add More Items",
    subtotal: "Subtotal",
    tax: "Tax",
    total: "Total",
    checkout: "Checkout",
    all: "All",
    coffee: "Coffee",
    tea: "Tea",
    seasonal: "Seasonal",
    customize: "+ Customize",
    noItemsFound: "No items found in this category.",
    signIn: "Sign In",
    logout: "Logout",
    item: "item",
    items: "items"
  };

  // Notify parent component of language changes
  useEffect(() => {
    if (onLanguageChange) {
      onLanguageChange(language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]); // Only depend on language, not onLanguageChange to avoid unnecessary re-runs

  // Clear translation cache when language changes to ensure fresh translations
  // Only clear cache when switching TO a different language (not on initial mount)
  useEffect(() => {
    // Don't clear cache on initial mount, only when language actually changes
    const timer = setTimeout(() => {
      clearTranslationCache();
    }, 100);
    return () => clearTimeout(timer);
  }, [language]);

  // Translate UI text when language changes
  useEffect(() => {
    const translateUIText = async () => {
      const currentLanguage = language; // Capture current language at start
      console.log("[KioskView] Language changed to:", currentLanguage);
      
      if (currentLanguage === "en") {
        // Reset to English
        const englishTranslations = {};
        Object.keys(uiTextKeys).forEach(key => {
          englishTranslations[key] = uiTextKeys[key];
        });
        setTranslations(englishTranslations);
        setTranslating(false);
        return;
      }

      setTranslating(true);
      try {
        console.log("[KioskView] Starting translation to", currentLanguage);
        const textsToTranslate = Object.values(uiTextKeys);
        const translatedTexts = await translateBatch(textsToTranslate, currentLanguage);
        console.log("[KioskView] Translation complete:", translatedTexts);
        
        // Check if language hasn't changed during async operation
        if (language !== currentLanguage) {
          console.warn("[KioskView] Language changed during translation, aborting update");
          return;
        }
        
        const newTranslations = {};
        Object.keys(uiTextKeys).forEach((key, index) => {
          newTranslations[key] = translatedTexts[index];
        });
        
        console.log("[KioskView] Setting translations state:", newTranslations, "for language:", currentLanguage);
        // Force React to recognize the state change by creating a new object
        setTranslations({ ...newTranslations });
        console.log("[KioskView] Translations state set, current language:", language);
      } catch (error) {
        console.error("[KioskView] Failed to translate UI text:", error);
        // Fallback to English
        const englishTranslations = {};
        Object.keys(uiTextKeys).forEach(key => {
          englishTranslations[key] = uiTextKeys[key];
        });
        setTranslations(englishTranslations);
      } finally {
        setTranslating(false);
      }
    };

    translateUIText();
  }, [language]);

  const [translatedMenuItems, setTranslatedMenuItems] = useState(menuItems);
  const [translatedCart, setTranslatedCart] = useState(cart);

  // Translate menu item names when language or menuItems change
  useEffect(() => {
    const updateTranslatedMenuItems = async () => {
      if (language === "en") {
        setTranslatedMenuItems(menuItems);
        setTranslatingMenuItems(false);
        return;
      }

      setTranslatingMenuItems(true);
      try {
        console.log("[KioskView] Starting menu items translation to", language);
        const translatedItems = await Promise.all(
          menuItems.map(async (item) => {
            const translatedName = await translate(item.name, language);
            // Log if translation didn't change (might be a proper noun)
            if (translatedName === item.name && language !== "en") {
              console.log(`[Translation] "${item.name}" was not translated (may be a proper noun)`);
            }
            // Preserve all item properties including icon, price, etc.
            const translatedItem = { 
              ...item, 
              translatedName,
              // Explicitly preserve icon to ensure images show
              icon: item.icon 
            };
            console.log(`[KioskView] Translated item: "${item.name}" -> "${translatedName}"`);
            return translatedItem;
          })
        );
        console.log("[KioskView] Menu items translation complete, setting state");
        console.log("[KioskView] Sample translated item:", translatedItems[0]);
        // Force React to recognize the state change by creating a new array
        const newTranslatedItems = translatedItems.map(item => ({ ...item }));
        setTranslatedMenuItems(newTranslatedItems);
        console.log("[KioskView] Translated menu items state set, count:", newTranslatedItems.length);
        // Force a re-render by updating a dummy state if needed
        setTimeout(() => {
          console.log("[KioskView] State update should have triggered re-render");
        }, 0);
      } catch (error) {
        console.error("Failed to translate menu items:", error);
        setTranslatedMenuItems(menuItems);
      } finally {
        setTranslatingMenuItems(false);
      }
    };

    updateTranslatedMenuItems();
  }, [language, menuItems]);

  // Translate cart item names when language or cart changes
  useEffect(() => {
    const updateTranslatedCart = async () => {
      if (language === "en") {
        setTranslatedCart(cart);
        setTranslatingCart(false);
        return;
      }

      setTranslatingCart(true);
      try {
        console.log("[KioskView] Translating cart items to", language);
        const translatedCartObj = {};
        for (const [key, item] of Object.entries(cart)) {
          // Force fresh translation by bypassing cache
          const translatedName = await translate(item.name, language, true);
          console.log(`[KioskView] Translated cart item: "${item.name}" -> "${translatedName}"`);
          // Preserve all item properties including icon
          translatedCartObj[key] = { 
            ...item, 
            translatedName,
            icon: item.icon 
          };
        }
        console.log("[KioskView] Cart translation complete, setting state");
        setTranslatedCart(translatedCartObj);
      } catch (error) {
        console.error("[KioskView] Failed to translate cart items:", error);
        setTranslatedCart(cart);
      } finally {
        setTranslatingCart(false);
      }
    };

    updateTranslatedCart();
  }, [language, cart]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside the dropdown
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    if (showLanguageDropdown) {
      // Use capture phase to ensure we catch the event before it bubbles
      document.addEventListener("mousedown", handleClickOutside, true);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside, true);
      };
    }
  }, [showLanguageDropdown]);

  const cartItems = Object.values(translatedCart);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;

  const filteredItems = filter === "all" 
    ? translatedMenuItems 
    : translatedMenuItems.filter(item => {
        if (filter === "seasonal") {
          const isSeasonal = item.isSeasonal === true;
          if (isSeasonal) {
            console.log(`[KioskView] Found seasonal item: ${item.name}`, item);
          }
          return isSeasonal;
        }
        const name = (item.translatedName || item.name).toLowerCase();
        const originalName = item.name.toLowerCase();
        if (filter === "coffee") {
          return name.includes("café") || name.includes("coffee") || name.includes("latte") || 
                 originalName.includes("coffee") || originalName.includes("latte");
        }
        if (filter === "tea") {
          return name.includes("té") || name.includes("tea") || originalName.includes("tea");
        }
        return true;
      });
  
  // Debug: Log seasonal items when filter changes
  useEffect(() => {
    if (filter === "seasonal") {
      const seasonalItems = translatedMenuItems.filter(item => item.isSeasonal === true);
      console.log(`[KioskView] Seasonal filter active. Found ${seasonalItems.length} seasonal items:`, seasonalItems);
      console.log(`[KioskView] All menu items with isSeasonal:`, translatedMenuItems.map(item => ({
        name: item.name,
        isSeasonal: item.isSeasonal
      })));
    }
  }, [filter, translatedMenuItems]);

  // Calculate if any translation is in progress
  const isTranslating = translating || translatingMenuItems || translatingCart;

  if (currentStep === "cart" && cartItems.length > 0) {
    return (
      <div className={`kiosk-view ${isExpanded ? 'kiosk-view-expanded' : ''}`}>
        {isTranslating && (
          <div className="kiosk-translating-overlay">
            <div className="kiosk-translating-spinner"></div>
            <p className="kiosk-translating-text">Translating...</p>
          </div>
        )}
        <div className="kiosk-cart-view">
          <div className="kiosk-cart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2>
                <span className="cart-icon">🛒</span>
                {translations.currentOrder || "Current Order"}
              </h2>
              <WeatherWidget city="College Station" language={language} />
              <div className="kiosk-language-selector" ref={languageDropdownRef}>
                <button 
                  type="button"
                  className="kiosk-translate-button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("[KioskView] Language dropdown toggle clicked (cart view), current state:", showLanguageDropdown);
                    setShowLanguageDropdown(!showLanguageDropdown);
                  }}
                >
                  🌐 {languages[language]}
                </button>
                {showLanguageDropdown && (
                  <div 
                    className="kiosk-language-dropdown"
                    onClick={(e) => {
                      // Prevent clicks inside dropdown from closing it
                      e.stopPropagation();
                    }}
                  >
                    <button
                      type="button"
                      className={`kiosk-language-option ${language === "en" ? "active" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("[KioskView] English button clicked (cart view)");
                        localStorage.setItem("kiosk_language", "en");
                        setLanguage("en");
                        setShowLanguageDropdown(false);
                      }}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      className={`kiosk-language-option ${language === "es" ? "active" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("[KioskView] Spanish button clicked (cart view) - BEFORE setLanguage, current language:", language);
                        localStorage.setItem("kiosk_language", "es");
                        setLanguage("es");
                        console.log("[KioskView] Spanish button clicked (cart view) - AFTER setLanguage");
                        setShowLanguageDropdown(false);
                      }}
                    >
                      Español
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button 
              className="kiosk-back-button"
              onClick={() => setCurrentStep("menu")}
            >
              ← {translations.addMoreItems || "Add More Items"}
            </button>
          </div>

          <div className="kiosk-cart-items">
            {Object.entries(translatedCart).map(([cartKey, item]) => (
              <div key={cartKey} className="kiosk-cart-item">
                <div className="kiosk-cart-item-info">
                  <span className="kiosk-cart-item-name">{item.translatedName || item.name}</span>
                  <span className="kiosk-cart-item-price">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
                <div className="kiosk-cart-item-controls">
                  <button
                    className="kiosk-quantity-button"
                    onClick={() => onRemoveItem(cartKey)}
                  >
                    −
                  </button>
                  <span className="kiosk-quantity">{item.quantity}</span>
                  <button
                    className="kiosk-quantity-button"
                    onClick={() => onAddToCart(item)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="kiosk-order-summary">
            <div className="kiosk-summary-row">
              <span>{translations.subtotal || "Subtotal"}:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="kiosk-summary-row">
              <span>{translations.tax || "Tax"}:</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="kiosk-summary-row kiosk-total-row">
              <span>{translations.total || "Total"}:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="kiosk-checkout-button"
            onClick={onCompleteTransaction}
            disabled={translating}
          >
            {translating ? "..." : (translations.checkout || "Checkout")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`kiosk-view ${isExpanded ? 'kiosk-view-expanded' : ''}`}>
      {isTranslating && (
        <div className="kiosk-translating-overlay">
          <div className="kiosk-translating-spinner"></div>
          <p className="kiosk-translating-text">Translating...</p>
        </div>
      )}
      <div className="kiosk-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
          <h1 className="kiosk-title">{translations.orderHere || "Order Here"}</h1>
          {user && (
            <div className="kiosk-user-info">
              <span className="kiosk-user-name">{user.name || user.email}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <WeatherWidget city="College Station" language={language} />
          <div className="kiosk-language-selector" ref={languageDropdownRef}>
            <button 
              type="button"
              className="kiosk-translate-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("[KioskView] Language dropdown toggle clicked, current state:", showLanguageDropdown);
                setShowLanguageDropdown(!showLanguageDropdown);
              }}
            >
              🌐 {languages[language]}
            </button>
            {showLanguageDropdown && (
              <div 
                className="kiosk-language-dropdown"
                onClick={(e) => {
                  // Prevent clicks inside dropdown from closing it
                  e.stopPropagation();
                }}
              >
                <button
                  type="button"
                  className={`kiosk-language-option ${language === "en" ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("[KioskView] English button clicked");
                    localStorage.setItem("kiosk_language", "en");
                    setLanguage("en");
                    setShowLanguageDropdown(false);
                  }}
                >
                  English
                </button>
                <button
                  type="button"
                  className={`kiosk-language-option ${language === "es" ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("[KioskView] Spanish button clicked - BEFORE setLanguage, current language:", language);
                    localStorage.setItem("kiosk_language", "es");
                    setLanguage("es");
                    console.log("[KioskView] Spanish button clicked - AFTER setLanguage");
                    setShowLanguageDropdown(false);
                  }}
                >
                  Español
                </button>
              </div>
            )}
          </div>
          <button
            className="kiosk-mode-toggle"
            onClick={onToggleExpanded}
            title={isExpanded ? "Normal View" : "Expand View"}
          >
            🔍
          </button>
          {cartItems.length > 0 && (
            <button
              className="kiosk-cart-badge"
              onClick={() => setCurrentStep("cart")}
            >
              🛒 {totalItems} {totalItems !== 1 ? (translations.items || "items") : (translations.item || "item")} • ${subtotal.toFixed(2)}
            </button>
          )}
          {!user && onLoginClick && (
            <button
              className="kiosk-login-button"
              onClick={onLoginClick}
              title="Sign in with Google"
            >
              {translations.signIn || "Sign In"}
            </button>
          )}
          {user && onLogout && (
            <button
              className="kiosk-logout-button"
              onClick={onLogout}
              title="Logout"
            >
              {translations.logout || "Logout"}
            </button>
          )}
        </div>
      </div>

      <div className="kiosk-filters">
        <button
          className={`kiosk-filter-button ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          {translations.all || "All"}
        </button>
        <button
          className={`kiosk-filter-button ${filter === "coffee" ? "active" : ""}`}
          onClick={() => setFilter("coffee")}
        >
          {translations.coffee || "Coffee"}
        </button>
        <button
          className={`kiosk-filter-button ${filter === "tea" ? "active" : ""}`}
          onClick={() => setFilter("tea")}
        >
          {translations.tea || "Tea"}
        </button>
        <button
          className={`kiosk-filter-button ${filter === "seasonal" ? "active" : ""}`}
          onClick={() => setFilter("seasonal")}
        >
          🌿 {translations.seasonal || "Seasonal"}
        </button>
      </div>

      <div className={`kiosk-menu-grid ${isExpanded ? 'kiosk-menu-grid-expanded' : ''}`} key={`menu-grid-${language}`}>
        {filteredItems.map(item => {
          const displayName = item.translatedName || item.name;
          return (
            <div
              key={`${item.id}-${language}`}
              className={`kiosk-menu-item ${isExpanded ? 'kiosk-menu-item-expanded' : ''}`}
              onClick={() => onItemClick(item)}
            >
              <div className="kiosk-menu-item-icon">
                {item.icon ? (
                  <img 
                    src={item.icon} 
                    alt={displayName} 
                    onError={(e) => { 
                      console.warn(`[KioskView] Failed to load image for ${item.name}:`, item.icon);
                      e.target.style.display = 'none'; 
                    }} 
                  />
                ) : null}
              </div>
              <div className="kiosk-menu-item-name">{displayName}</div>
              <div className="kiosk-menu-item-price">${item.price.toFixed(2)}</div>
              <div className="kiosk-menu-item-add">{translations.customize || "+ Customize"}</div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="kiosk-empty-state">
          <p>{translations.noItemsFound || "No items found in this category."}</p>
        </div>
      )}
    </div>
  );
}

export default KioskView;

