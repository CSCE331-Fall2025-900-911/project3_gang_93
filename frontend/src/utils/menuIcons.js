// Map menu item names to image URLs
export const getMenuIcon = (menuItemName) => {
  if (!menuItemName) {
    return null;
  }
  
  // Generate the image path relative to public folder
  // Images are stored in frontend/icons/ and served as static assets
  return `/icons/${menuItemName}.png`;
};

