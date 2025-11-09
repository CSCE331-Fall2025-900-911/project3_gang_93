import { useState } from "react";
import { Header, MenuGrid, OrderPanel } from "./components";
import { menuItems } from "./constants/menuItems";
import "./App.css";

function App() {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    setCart([...cart, { ...item, cartId: Date.now() }]);
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter((item) => item.cartId !== cartId));
  };

  const completeTransaction = () => {
    if (cart.length === 0) return;
    alert("Transaction completed!");
    setCart([]);
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
