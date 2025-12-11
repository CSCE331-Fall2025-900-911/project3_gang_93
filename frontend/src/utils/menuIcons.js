// Map menu item names to image URLs
export const getMenuIcon = (menuItemName) => {
  if (!menuItemName) {
    return null;
  }
  
  // Generate the image path relative to public folder
  // Images are stored in frontend/public/icons/ and served as static assets
  // Note: The browser will automatically encode spaces when used in img src
  // For deployment, ensure your server is configured to serve static files from /icons/
  return `/icons/${menuItemName}.png`;
};

