export function formatCurrency(amount: number | undefined | null, includePerMonth: boolean = false): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

  return includePerMonth ? `${formatted}/mo` : formatted;
}
