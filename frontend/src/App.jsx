import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
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

// Shared state provider component
function AppContent() {
  const [cart, setCart] = useState({});
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [customizationModalOpen, setCustomizationModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [kioskUser, setKioskUser] = useState(null);
  const [isKioskExpanded, setIsKioskExpanded] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [kioskLanguage, setKioskLanguage] = useState("en");
  const navigate = useNavigate();
  const location = useLocation();

  // Check for existing sessions on mount
  useEffect(() => {
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email");
    const error = urlParams.get("error");
    
    if (email || error) {
      // OAuth callback detected - redirect to customer login
      if (location.pathname !== "/customer/login") {
        navigate("/customer/login", { replace: true });
      }
      return;
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
  }, [navigate, location.pathname]);

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

      const result = await transactionAPI.create({
        items: cart,
        transactionType: method.toLowerCase(),
        customerId: null,
        tip: tip,
      });

      let message = `Transaction completed!\nPayment: ${method}\nTransaction ID: ${result.transactionId}`;
      if (tip > 0) {
        message += `\nTip: $${tip.toFixed(2)}`;
      }
      message += `\nTotal: $${total.toFixed(2)}`;

      if (method === "Cash") {
        const change = cashGiven - total;
        if (change > 0) {
          message += `\nChange due: $${change.toFixed(2)}`;
        }
      }

      setAlertMessage(message);
      setCart({});
    } catch (err) {
      console.error("Transaction failed:", err);
      setAlertMessage(`Transaction failed: ${err.message}\nPlease try again.`);
    }
  };

  const handleKioskLoginSuccess = (userInfo) => {
    console.log("[App] Kiosk login success, user:", userInfo);
    setKioskUser(userInfo);
    navigate("/customer", { replace: true });
  };

  const handleKioskLogout = () => {
    localStorage.removeItem("kiosk_user");
    setKioskUser(null);
    setCart({});
  };

  const handleEmployeeLoginSuccess = (employeeInfo) => {
    console.log("[App] Employee login success:", employeeInfo);
    setEmployee(employeeInfo);
    localStorage.setItem("employee", JSON.stringify(employeeInfo));
    
    // Redirect based on where they came from
    if (location.pathname === "/cashier/login") {
      navigate("/cashier", { replace: true });
    } else if (location.pathname === "/manager/login") {
      if (employeeInfo.authLevel === "Manager") {
        navigate("/manager", { replace: true });
      } else {
        alert("Access denied. Only managers can access this view.");
      }
    }
  };

  const handleEmployeeLogout = () => {
    localStorage.removeItem("employee");
    setEmployee(null);
    setCart({});
    navigate("/");
  };

  const handleManagerClick = () => {
    if (!employee) {
      navigate("/cashier/login");
      return;
    }
    if (employee.authLevel !== "Manager") {
      navigate("/manager/login");
      return;
    }
    navigate("/manager");
  };

  // Shared modals and components
  const sharedModals = (
    <>
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
    </>
  );

  // Landing Page Component
  const LandingPageRoute = () => (
    <LandingPage
      onSelectSelfService={() => navigate("/customer")}
      onSelectCashier={() => navigate("/cashier")}
      onSelectManager={() => navigate("/manager")}
    />
  );

  // Customer Login Component
  const CustomerLoginRoute = () => (
    <div className="app">
      <KioskLoginPage 
        onLoginSuccess={handleKioskLoginSuccess}
        onCancel={() => navigate("/customer")}
      />
    </div>
  );

  // Customer View Component
  const CustomerViewRoute = () => {
    if (loading) {
      return (
        <div className="app">
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
          onLoginClick={() => navigate("/customer/login")}
          onLogout={handleKioskLogout}
          isExpanded={isKioskExpanded}
          onToggleExpanded={() => setIsKioskExpanded(!isKioskExpanded)}
          onLanguageChange={setKioskLanguage}
          onBackToHome={() => navigate("/")}
        />
        {sharedModals}
      </div>
    );
  };

  // Cashier Login Component
  const CashierLoginRoute = () => (
    <div className="app">
      <EmployeeLoginPage
        onLoginSuccess={handleEmployeeLoginSuccess}
        onCancel={() => navigate("/")}
      />
    </div>
  );

  // Cashier View Component
  const CashierViewRoute = () => {
    if (!employee) {
      return <Navigate to="/cashier/login" replace />;
    }

    if (loading) {
      return (
        <div className="app">
          <Header
            onBackToHome={() => navigate("/")}
            onManagerClick={handleManagerClick}
            employee={employee}
            onLogout={handleEmployeeLogout}
          />
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
          <Header
            onBackToHome={() => navigate("/")}
            onManagerClick={handleManagerClick}
            employee={employee}
            onLogout={handleEmployeeLogout}
          />
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
          <Header
            onBackToHome={() => navigate("/")}
            onManagerClick={handleManagerClick}
            employee={employee}
            onLogout={handleEmployeeLogout}
          />
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

    return (
      <div className="app">
        <Header
          onBackToHome={() => navigate("/")}
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
  };

  // Manager Login Component
  const ManagerLoginRoute = () => (
    <div className="app">
      <EmployeeLoginPage
        title="Manager Login"
        subtitle="Enter your manager employee ID to access the manager view"
        onLoginSuccess={(employeeInfo) => {
          if (employeeInfo.authLevel === "Manager") {
            handleEmployeeLoginSuccess(employeeInfo);
          } else {
            alert("Access denied. Only managers can access this view.");
          }
        }}
        onCancel={() => navigate("/")}
      />
    </div>
  );

  // Manager View Component
  const ManagerViewRoute = () => {
    if (!employee) {
      return <Navigate to="/manager/login" replace />;
    }
    if (employee.authLevel !== "Manager") {
      return <Navigate to="/manager/login" replace />;
    }

    return <ManagerView onBack={() => navigate("/")} employee={employee} />;
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPageRoute />} />
      <Route path="/customer" element={<CustomerViewRoute />} />
      <Route path="/customer/login" element={<CustomerLoginRoute />} />
      <Route path="/cashier" element={<CashierViewRoute />} />
      <Route path="/cashier/login" element={<CashierLoginRoute />} />
      <Route path="/manager" element={<ManagerViewRoute />} />
      <Route path="/manager/login" element={<ManagerLoginRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return <AppContent />;
}

export default App;
