const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const enDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Converts Bengali digits to English digits
 * @param {string|number} input 
 * @returns {string}
 */
export const toEnDigits = (input) => {
    if (!input) return '0';
    return input.toString().replace(/[০-৯]/g, (match) => enDigits[bnDigits.indexOf(match)]);
};

/**
 * Converts English digits to Bengali digits
 * @param {string|number} input 
 * @returns {string}
 */
export const toBnDigits = (input) => {
    if (input === undefined || input === null) return '';
    return input.toString().replace(/[0-9]/g, (match) => bnDigits[enDigits.indexOf(match)]);
};

/**
 * Parses a numeric string that might contain Bengali digits
 * @param {string} input 
 * @returns {number}
 */
export const parseBnInt = (input) => {
    return parseInt(toEnDigits(input)) || 0;
};
