import fs from 'fs';
import path from 'path';

/**
 * Gets the absolute path relative to the project root
 * @param {string} relativePath - Path relative to project root
 * @returns {string} - Absolute path
 */
export function getProjectPath(relativePath) {
    return path.join(process.cwd(), relativePath);
}

/**
 * Ensures a directory exists, creates it if it doesn't
 * @param {string} dirPath - Path to the directory
 */
export function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Ensures that the dist directory exists, creating it if necessary
 * @returns {string} - Path to the dist directory
 */
export function ensureDist() {
    const distPath = getProjectPath('dist');
    ensureDirectoryExists(distPath);
    return distPath;
}

/**
 * Returns the full path to the assets folder
 * @returns {string} The path to the assets folder
 */
export function getAssetsFolder() {
    return getProjectPath('assets');
}

/**
 * Returns the full path to the assets/fragments folder
 * @returns {string} The path to the fragments folder
 */
export function getFragmentsFolder() {
    return path.join(getAssetsFolder(), 'fragments');
}

/**
 * Returns the full path to the assets/preview folder
 * @returns {string} The path to the preview folder
 */
export function getPreviewFolder() {
    return path.join(getAssetsFolder(), 'preview');
}