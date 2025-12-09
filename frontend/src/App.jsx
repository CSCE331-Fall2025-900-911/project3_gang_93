import { useState, useEffect } from "react";
import { Header, MenuGrid, OrderPanel, LandingPage } from "./components";
import { menuAPI, transactionAPI } from "./services/api";
import { TAX_RATE } from "./constants/menuItems";
import { API_BASE_URL } from "./config/api";
import PaymentSelector from "./components/PaymentSelector";
import AlertModal from "./components/AlertModal";
import KioskView from "./components/KioskView";
import ManagerView from "./components/ManagerView";
import DrinkCustomizationModal from "./components/DrinkCustomizationModal";
import KioskLoginPage from "./components/KioskLoginPage";
import EmployeeLoginPage from "./components/EmployeeLoginPage";
import "./App.css";

function App() {
  const [cart, setCart] = useState({});
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [viewMode, setViewMode] = useState("cashier"); // "cashier" or "kiosk"
  const [showManager, setShowManager] = useState(false);
  const [customizationModalOpen, setCustomizationModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [kioskUser, setKioskUser] = useState(null);
  const [showKioskLogin, setShowKioskLogin] = useState(false);
  const [isKioskExpanded, setIsKioskExpanded] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [showEmployeeLogin, setShowEmployeeLogin] = useState(false);
  const [showManagerLogin, setShowManagerLogin] = useState(false);
  const [kioskLanguage, setKioskLanguage] = useState("en");
  const [showLandingPage, setShowLandingPage] = useState(true);

  // Check for existing kiosk user session and OAuth callback on mount
  useEffect(() => {
    // Check for OAuth callback first - if present, show login page to process it
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email");
    const error = urlParams.get("error");
    
    if (email || error) {
      // OAuth callback detected - switch to kiosk mode and show login page
      // KioskLoginPage will handle extracting user info from query params
      setViewMode("kiosk");
      setShowKioskLogin(true);
      setShowLandingPage(false);
      return; // Don't check for stored user if OAuth callback is present
    }
    
    // Check if user is already logged in from previous session
    const storedUser = localStorage.getItem("kiosk_user");
    if (storedUser) {
      try {
        const userInfo = JSON.parse(storedUser);
        setKioskUser(userInfo);
      } catch (e) {
        localStorage.removeItem("kiosk_user");
      }
    }

    // Check for stored employee session
    const storedEmployee = localStorage.getItem("employee");
    if (storedEmployee) {
      try {
        const employeeInfo = JSON.parse(storedEmployee);
        setEmployee(employeeInfo);
      } catch (e) {
        localStorage.removeItem("employee");
      }
    }
  }, []);

  // Fetch menu items from backend on component mount
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        console.log("[App] Starting menu fetch...");
        setLoading(true);
        const items = await menuAPI.getAll();
        console.log("[App] Menu fetched successfully:", items.length, "items");
        setMenuItems(items);
        setError(null);
      } catch (err) {
        console.error("[App] Failed to fetch menu:", err);
        setError(
          `Failed to load menu: ${err.message || 'Unknown error'}. Please make sure the backend server is running at ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}.`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);


  const handleItemClick = (item) => {
    setSelectedItem(item);
    setCustomizationModalOpen(true);
  };

  const addToCart = (customizedItem) => {
    // Create a unique key based on item ID and customizations
    const customizationKey = JSON.stringify({
      addOnIDs: (customizedItem.addOnIDs || []).sort(),
      temperature: customizedItem.temperature || "cold",
      ice: customizedItem.ice || "normal",
      size: customizedItem.size || "regular",
      sweetness: customizedItem.sweetness || "100%",
    });
    const cartKey = `${customizedItem.id}_${customizationKey}`;

    setCart((prevCart) => {
      const existingItem = prevCart[cartKey];
      if (existingItem) {
        return {
          ...prevCart,
          [cartKey]: {
            ...existingItem,
            quantity: existingItem.quantity + 1,
          },
        };
      } else {
        return {
          ...prevCart,
          [cartKey]: {
            ...customizedItem,
            quantity: 1,
          },
        };
      }
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prevCart) => {
      const existingItem = prevCart[itemId];
      if (!existingItem) return prevCart;

      if (existingItem.quantity === 1) {
        const newCart = { ...prevCart };
        delete newCart[itemId];
        return newCart;
      } else {
        return {
          ...prevCart,
          [itemId]: {
            ...existingItem,
            quantity: existingItem.quantity - 1,
          },
        };
      }
    });
  };

  const completeTransaction = async () => {
    if (Object.keys(cart).length === 0) return;
    setPopupOpen(true);
  };

  const handlePaymentSelect = async (
    method,
    cashGiven = null,
    tipAmount = 0
  ) => {
    if (Object.keys(cart).length === 0) return;
    setPopupOpen(false);

    try {
      // Calculate total for display
      const cartItems = Object.values(cart);
      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const tax = subtotal * TAX_RATE;
      const tip = tipAmount || 0;
      const total = subtotal + tax + tip;

      if (method === "Cash") {
        if (cashGiven < total) {
          setAlertMessage(
            `Insufficient cash! Total due is $${total.toFixed(2)}.`
          );
          return;
        }
      }

      // Create transaction via API
      const result = await transactionAPI.create({
        items: cart,
        transactionType: method.toLowerCase(), // "card" or "cash"
        customerId: null, // You can add customer lookup later
        tip: tip,
      });

      // Show success message
      let message = `Transaction completed!\nPayment: ${method}\nTransaction ID: ${result.transactionId}`;
      if (tip > 0) {
        message += `\nTip: $${tip.toFixed(2)}`;
      }
      message += `\nTotal: $${total.toFixed(2)}`;

      // Add change information for cash payments
      if (method === "Cash") {
        const change = cashGiven - total;
        if (change > 0) {
          message += `\nChange due: $${change.toFixed(2)}`;
        }
      }

      setAlertMessage(message);

      // Clear cart
      setCart({});
    } catch (err) {
      console.error("Transaction failed:", err);
      setAlertMessage(`Transaction failed: ${err.message}\nPlease try again.`);
    }
  };

  const handleSelectSelfService = () => {
    setViewMode("kiosk");
    setShowLandingPage(false);
    // Check if user is already logged in
    const storedUser = localStorage.getItem("kiosk_user");
    if (storedUser) {
      try {
        const userInfo = JSON.parse(storedUser);
        setKioskUser(userInfo);
      } catch (e) {
        localStorage.removeItem("kiosk_user");
      }
    }
  };

  const handleSelectCashier = () => {
    setViewMode("cashier");
    setShowLandingPage(false);
    // If not logged in, show login
    if (!employee) {
      setShowEmployeeLogin(true);
    }
  };

  const handleSelectManager = () => {
    setViewMode("cashier");
    setShowLandingPage(false);
    // Check if employee is logged in and is a manager
    if (employee && employee.authLevel === "Manager") {
      setShowManager(true);
    } else {
      // Show manager login
      setShowManagerLogin(true);
    }
  };

  const handleBackToLanding = () => {
    setShowLandingPage(true);
    setShowManager(false);
    setViewMode("kiosk");
    // Clear any active sessions if needed
    // Note: We keep sessions in localStorage so users can return without re-logging
  };

  const handleKioskLoginSuccess = (userInfo) => {
    console.log("[App] Kiosk login success, user:", userInfo);
    setKioskUser(userInfo);
    setShowKioskLogin(false);
    // Ensure we're in kiosk mode
    setViewMode("kiosk");
    // Clear any OAuth query params from URL
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleKioskLogout = () => {
    localStorage.removeItem("kiosk_user");
    setKioskUser(null);
    setCart({});
  };

  const handleEmployeeLoginSuccess = (employeeInfo) => {
    console.log("[App] Employee login success:", employeeInfo);
    setEmployee(employeeInfo);
    setShowEmployeeLogin(false);
    localStorage.setItem("employee", JSON.stringify(employeeInfo));
  };

  const handleEmployeeLogout = () => {
    localStorage.removeItem("employee");
    setEmployee(null);
    setCart({});
    setShowEmployeeLogin(true);
  };

  const handleManagerClick = () => {
    if (!employee) {
      setShowEmployeeLogin(true);
      return;
    }
    if (employee.authLevel !== "Manager") {
      setShowManagerLogin(true);
      return;
    }
    setShowManager(true);
  };

  // Show manager login if trying to access manager view without manager auth
  if (showManagerLogin) {
    return (
      <div className="app">
        <EmployeeLoginPage
          title="Manager Login"
          subtitle="Enter your manager employee ID to access the manager view"
          onLoginSuccess={(employeeInfo) => {
            if (employeeInfo.authLevel === "Manager") {
              handleEmployeeLoginSuccess(employeeInfo);
              setShowManagerLogin(false);
              setShowManager(true);
            } else {
              alert("Access denied. Only managers can access this view.");
            }
          }}
          onCancel={() => {
            setShowManagerLogin(false);
            setShowLandingPage(true);
          }}
        />
      </div>
    );
  }

  // Show employee login if not logged in and trying to access cashier view
  if (showEmployeeLogin && viewMode === "cashier") {
    return (
      <div className="app">
        <EmployeeLoginPage
          onLoginSuccess={handleEmployeeLoginSuccess}
          onCancel={() => {
            // Go back to landing page if canceling employee login
            setShowEmployeeLogin(false);
            setShowLandingPage(true);
          }}
        />
      </div>
    );
  }

  // Show landing page if requested
  if (showLandingPage) {
    return (
      <LandingPage
        onSelectSelfService={handleSelectSelfService}
        onSelectCashier={handleSelectCashier}
        onSelectManager={handleSelectManager}
      />
    );
  }

  // Show manager view if requested and authenticated
  if (showManager) {
    return <ManagerView onBack={handleBackToLanding} employee={employee} />;
  }

  if (loading) {
    return (
      <div className="app">
        {viewMode === "cashier" && (
          <Header onBackToHome={handleBackToLanding} />
        )}
        <main className="main-content">
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>Loading menu...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        {viewMode === "cashier" && (
          <Header onBackToHome={handleBackToLanding} />
        )}
        <main className="main-content">
          <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>
            <p>{error}</p>
            <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
              Make sure the backend server is running at {API_BASE_URL}
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (menuItems.length === 0) {
    return (
      <div className="app">
        {viewMode === "cashier" && (
          <Header onBackToHome={handleBackToLanding} />
        )}
        <main className="main-content">
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>No menu items available.</p>
            <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
              Please check the database connection.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Kiosk View - Login is optional
  if (viewMode === "kiosk") {
    // Show login modal if user wants to login
    if (showKioskLogin) {
      return (
        <div className="app">
          <KioskLoginPage 
            onLoginSuccess={handleKioskLoginSuccess}
            onCancel={() => {
              setShowKioskLogin(false);
              // If canceling login, stay in kiosk mode (login is optional)
            }}
          />
        </div>
      );
    }

    return (
      <div className="app">
        <KioskView
          menuItems={menuItems}
          cart={cart}
          onItemClick={handleItemClick}
          onAddToCart={addToCart}
          onRemoveItem={removeFromCart}
          onCompleteTransaction={completeTransaction}
          user={kioskUser}
          onLoginClick={() => setShowKioskLogin(true)}
          onLogout={handleKioskLogout}
          isExpanded={isKioskExpanded}
          onToggleExpanded={() => setIsKioskExpanded(!isKioskExpanded)}
          onLanguageChange={setKioskLanguage}
          onBackToHome={handleBackToLanding}
        />
        <DrinkCustomizationModal
          item={selectedItem}
          isOpen={customizationModalOpen}
          onClose={() => {
            setCustomizationModalOpen(false);
            setSelectedItem(null);
          }}
          onAddToCart={addToCart}
          isExpanded={isKioskExpanded}
          language={kioskLanguage}
        />
        <PaymentSelector
          open={popupOpen}
          onClose={() => setPopupOpen(false)}
          onSelect={handlePaymentSelect}
          subtotal={Object.values(cart).reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          )}
          isExpanded={isKioskExpanded}
          language={kioskLanguage}
        />
        <AlertModal
          message={alertMessage}
          show={!!alertMessage}
          onClose={() => setAlertMessage(null)}
        />
      </div>
    );
  }

  // Cashier View
  return (
    <div className="app">
      <Header
        onBackToHome={handleBackToLanding}
        onManagerClick={handleManagerClick}
        employee={employee}
        onLogout={handleEmployeeLogout}
      />
      <main className="main-content">
        <MenuGrid items={menuItems} onItemClick={handleItemClick} />
        <OrderPanel
          cart={cart}
          onRemoveItem={removeFromCart}
          onAddItem={addToCart}
          onCompleteTransaction={completeTransaction}
        />
      </main>
      <DrinkCustomizationModal
        item={selectedItem}
        isOpen={customizationModalOpen}
        onClose={() => {
          setCustomizationModalOpen(false);
          setSelectedItem(null);
        }}
        onAddToCart={addToCart}
        language="en"
      />
      <PaymentSelector
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        onSelect={handlePaymentSelect}
        subtotal={Object.values(cart).reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        )}
      />
      <AlertModal
        message={alertMessage}
        show={!!alertMessage}
        onClose={() => setAlertMessage(null)}
      />
    </div>
  );
}

export default App;
