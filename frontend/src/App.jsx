import { useState, useEffect } from "react";
import { Header, MenuGrid, OrderPanel } from "./components";
import { menuAPI, transactionAPI } from "./services/api";
import { TAX_RATE } from "./constants/menuItems";
import { API_BASE_URL } from "./config/api";
import PaymentSelector from "./components/PaymentSelector";
import "./App.css";

function App() {
  const [cart, setCart] = useState({});
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);

  // Fetch menu items from backend on component mount
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const items = await menuAPI.getAll();
        setMenuItems(items);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch menu:", err);
        setError(
          "Failed to load menu. Please make sure the backend server is running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart[item.id];
      if (existingItem) {
        return {
          ...prevCart,
          [item.id]: {
            ...existingItem,
            quantity: existingItem.quantity + 1,
          },
        };
      } else {
        return {
          ...prevCart,
          [item.id]: {
            ...item,
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

  const handlePaymentSelect = async (method, cashGiven = null) => {
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
      const total = subtotal + tax;

      if (method === "Cash") {
      if (cashGiven < total) {
        alert(`Insufficient cash! Total due is $${total.toFixed(2)}.`);
        return;
      }
      const change = cashGiven - total;
      alert(`Change due: $${change.toFixed(2)}`);
    }

      // Create transaction via API
      const result = await transactionAPI.create({
        items: cart,
        transactionType: method.toLowerCase(), // "card" or "cash"
        customerId: null, // You can add customer lookup later
      });

      // Show success message
      alert(
        `Transaction completed!\nPayment: ${
          method
        }\nTransaction ID: ${
          result.transactionId
        }`);

      // Clear cart
      setCart({});
    } catch (err) {
      console.error("Transaction failed:", err);
      alert(`Transaction failed: ${err.message}\nPlease try again.`);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <Header />
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
        <Header />
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
        <Header />
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
      <Header />
      <main className="main-content">
        <MenuGrid items={menuItems} onAddToCart={addToCart} />
        <OrderPanel
          cart={cart}
          onRemoveItem={removeFromCart}
          onCompleteTransaction={completeTransaction}
        />
      </main>
      <PaymentSelector
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        onSelect={handlePaymentSelect}
      />
    </div>
  );
}

export default App;
