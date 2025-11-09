import { useState } from "react";
import { Header, MenuGrid, OrderPanel } from "./components";
import { menuItems } from "./constants/menuItems";
import "./App.css";

function App() {
  const [cart, setCart] = useState({});

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

  const completeTransaction = () => {
    if (Object.keys(cart).length === 0) return;
    alert("Transaction completed!");
    setCart({});
  };

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
    </div>
  );
}

export default App;
