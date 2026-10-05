/**
 * Format amount as USD currency.
 * @param {number|null|undefined} amount
 * @returns {string} e.g. "$1,234.56" or "$0.00"
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
