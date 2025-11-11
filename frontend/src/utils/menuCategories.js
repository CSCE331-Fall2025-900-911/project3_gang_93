// Utility function to categorize menu items
export const getItemCategory = (itemName) => {
  const name = itemName.toLowerCase();
  
  // Coffee items
  if (name.includes('coffee') || name.includes('latte') || name.includes('espresso') || name.includes('cappuccino')) {
    return 'coffee';
  }
  
  // Tea items
  if (name.includes('tea') || name.includes('matcha') || name.includes('taro') || name.includes('boba')) {
    return 'tea';
  }
  
  // Default to 'other' if not coffee or tea
  return 'other';
};

export const filterMenuItems = (items, category) => {
  if (category === 'all') {
    return items;
  }
  
  return items.filter(item => getItemCategory(item.name) === category);
};

