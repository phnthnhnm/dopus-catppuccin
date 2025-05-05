import { JSDOM } from 'jsdom';

/**
 * Sanitizes a string for XML content by replacing special characters with their entities
 * @param {string} str - The string to sanitize
 * @returns {string} - Sanitized string
 */
function escapeXml(str) {
    if (typeof str !== 'string') {
        return String(str);
    }
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Sanitizes a name to be valid as an XML element name
 * XML element names cannot start with a digit, a period, or a hyphen
 * @param {string} name - The name to sanitize
 * @returns {string} - A valid XML element name
 */
export function sanitizeXmlElementName(name) {
    // If name starts with a number or other invalid character, prefix it
    if (/^[^a-zA-Z_:]/.test(name)) {
        return `x_${name}`;
    }
    
    // Replace any other invalid characters with underscores
    return name.replace(/[^a-zA-Z0-9_:.-]/g, '_');
}

/**
 * Convert JSON object to XML string
 * @param {Object} jsonObj - JSON object to convert
 * @param {string|null} nodeName - Optional node name for the root element
 * @param {number} indentLevel - Current indent level (for pretty printing)
 * @returns {string} - XML string
 */
function jsonToXmlString(jsonObj, nodeName = null, indentLevel = 0) {
    // Handle null and undefined
    if (jsonObj === null || jsonObj === undefined) {
        return '';
    }

    const indent = '  '.repeat(indentLevel);
    const childIndent = '  '.repeat(indentLevel + 1);
    let result = '';

    // Handle arrays
    if (Array.isArray(jsonObj)) {
        return jsonObj.map(item => 
            jsonToXmlString(item, sanitizeXmlElementName(nodeName || 'item'), indentLevel)
        ).join('');
    }

    // Handle objects
    if (typeof jsonObj === 'object') {
        // Start building the element
        const tagName = sanitizeXmlElementName(nodeName || 'root');
        result += `${indent}<${tagName}`;

        // Extract attributes first
        const attributes = jsonObj['@attributes'] || {};
        const children = { ...jsonObj };
        delete children['@attributes'];

        // Add attributes to the opening tag - key here is we preserve original attribute names
        // since XML attributes CAN start with numbers
        Object.entries(attributes).forEach(([attrName, attrValue]) => {
            result += ` ${attrName}="${escapeXml(attrValue)}"`;
        });

        // Check if there are child elements or content
        const hasChildren = Object.keys(children).length > 0;

        if (hasChildren) {
            result += '>\n';
            
            // Add child elements
            Object.entries(children).forEach(([key, value]) => {
                result += jsonToXmlString(value, key, indentLevel + 1);
            });
            
            // Close tag
            result += `${indent}</${tagName}>\n`;
        } else {
            // Self-closing tag if no children
            result += ' />\n';
        }
    } else {
        // Handle primitive values
        const tagName = sanitizeXmlElementName(nodeName || 'item');
        const content = escapeXml(jsonObj);
        result += `${indent}<${tagName}>${content}</${tagName}>\n`;
    }

    return result;
}

/**
 * Convert JSON object to XML
 * This is the main entry point for XML conversion
 * @param {Object} jsonObj - The JSON object to convert to XML
 * @param {string|null} rootName - Optional name for the root element
 * @returns {string} - XML document as string with XML declaration
 */
export function jsonObjectToXml(jsonObj, rootName = null) {
    const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>\n';
    
    // Get the root element name
    const actualRootName = rootName || (jsonObj ? Object.keys(jsonObj)[0] : 'root');
    
    // Generate XML content
    let xmlContent;
    if (jsonObj && actualRootName && jsonObj[actualRootName]) {
        // If the root name is in the JSON object, use its value
        xmlContent = jsonToXmlString(jsonObj[actualRootName], actualRootName, 0);
    } else {
        // Otherwise, use the whole object
        xmlContent = jsonToXmlString(jsonObj, actualRootName, 0);
    }
    
    return xmlDeclaration + xmlContent;
}
