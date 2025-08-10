/**
 * UI Kit Configuration
 * 
 * This script sets up the necessary configuration for ui-kit assets.
 * It should be included before loading ui-kit theme scripts.
 */

(function() {
    // Determine the assets path based on the current location
    const currentPath = window.location.pathname;
    let assetsPath = '/assets/';
    
    // If we're in a nested directory (like /mockups/), adjust the path
    if (currentPath.includes('/mockups/')) {
        // Count the depth to determine how many levels up we need to go
        const depth = currentPath.split('/').filter(p => p && p !== 'mockups').length - 1;
        assetsPath = '../'.repeat(depth) + 'assets/';
    }
    
    // Set the general assets path for all UI Kit resources
    window.__uiKitBasePath = assetsPath;
    
    // The theme system will automatically use this path to find themes at:
    // ${__uiKitBasePath}themes/
    
    // Future: Other assets will also use this base path:
    // - Icons: ${__uiKitBasePath}icons/
    // - Fonts: ${__uiKitBasePath}fonts/
    
    console.log('UI Kit configured with assets path:', window.__uiKitBasePath);
})();