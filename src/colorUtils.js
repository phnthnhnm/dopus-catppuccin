/**
 * Replaces CSS variables in theme.xml with hex color codes
 * @param {string} themeXml - The XML content with CSS variables
 * @param {object} flavor - The flavor object containing colorEntries
 * @param {string} [accentColor] - Optional accent color name (e.g., "peach")
 * @returns {string} - The XML with CSS variables replaced with hex color codes
 */
export function replaceColorVariables(themeXml, flavor, accentColor = "peach") {
  let modifiedXml = themeXml;
  
  // Helper function to apply alpha value to hex color
  const applyAlpha = (hex, alpha) => {
    if (alpha === undefined) return hex;
    
    // Convert alpha from 0-255 to two-digit hex
    const alphaHex = parseInt(alpha).toString(16).padStart(2, '0');
    return `${hex}${alphaHex}`;
  };
  
  // Replace all variables in format var(--ctp-<color>) or var(--ctp-<color>, <alpha>) with the hex value
  flavor.colorEntries.forEach(([colorName, { hex }]) => {
    // Match var(--ctp-color) with no alpha value
    const simpleRegex = new RegExp(`var\\(--ctp-${colorName}\\)`, 'g');
    modifiedXml = modifiedXml.replace(simpleRegex, hex);
    
    // Match var(--ctp-color, alpha) with alpha value
    const withAlphaRegex = new RegExp(`var\\(--ctp-${colorName},\\s*(\\d+)\\s*\\)`, 'g');
    modifiedXml = modifiedXml.replace(withAlphaRegex, (match, alpha) => applyAlpha(hex, alpha));
  });
  
  // Replace accent color variable if specified
  if (accentColor) {
    const accentEntry = flavor.colorEntries.find(([colorName]) => colorName === accentColor);
    if (accentEntry) {
      const accentHex = accentEntry[1].hex;
      
      // Match var(--ctp-accent-color) with no alpha value
      const simpleRegex = new RegExp(`var\\(--ctp-accent-color\\)`, 'g');
      modifiedXml = modifiedXml.replace(simpleRegex, accentHex);
      
      // Match var(--ctp-accent-color, alpha) with alpha value
      const withAlphaRegex = new RegExp(`var\\(--ctp-accent-color,\\s*(\\d+)\\s*\\)`, 'g');
      modifiedXml = modifiedXml.replace(withAlphaRegex, (match, alpha) => applyAlpha(accentHex, alpha));
    }
  }
  
  return modifiedXml;
}

/**
 * Determines if a flavor is dark or light
 * @param {object} flavor - The flavor object from the Catppuccin palette
 * @returns {string} - "dark" if dark, "light" if light
 */
export function getColorBank(flavor) {
  return flavor.dark ? "dark" : "light";
}
