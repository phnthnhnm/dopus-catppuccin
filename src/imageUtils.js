import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

/**
 * Gets the appropriate preview image path for a flavor
 * @param {string} assetsPath - Path to the assets directory
 * @param {string} flavorName - Name of the Catppuccin flavor
 * @returns {string} - Path to the preview image
 */
export function getPreviewImagePath(assetsPath, flavorName) {
  // Check for a flavor-specific preview image first
  const flavorPreviewPath = path.join(assetsPath, 'preview', `preview-${flavorName}.jpg`);
  const defaultPreviewPath = path.join(assetsPath, 'preview', 'preview-fallback.jpg');
  
  // Return the flavor-specific preview if it exists, otherwise use default
  if (fs.existsSync(flavorPreviewPath)) {
    return flavorPreviewPath;
  } else {
    console.log(chalk.yellow(`No flavor-specific preview found for ${flavorName}, using default`));
    return defaultPreviewPath;
  }
}