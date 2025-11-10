// Map menu item names to icons
export const getMenuIcon = (menuItemName) => {
  const name = menuItemName.toLowerCase();
  
  // Tea-based drinks
  if (name.includes('milk tea') || name.includes('black tea') || name.includes('green tea') || name.includes('oolong tea')) {
    return '🥛';
  }
  
  // Latte
  if (name.includes('latte')) {
    return '☕';
  }
  
  // Fruit teas
  if (name.includes('fruit') || name.includes('passion') || name.includes('mango') || name.includes('strawberry') || name.includes('lychee') || name.includes('watermelon')) {
    return '💧';
  }
  
  // Coffee
  if (name.includes('coffee')) {
    return '☕';
  }
  
  // Matcha
  if (name.includes('matcha')) {
    return '🍵';
  }
  
  // Taro
  if (name.includes('taro')) {
    return '🟣';
  }
  
  // Default
  return '🥤';
};

