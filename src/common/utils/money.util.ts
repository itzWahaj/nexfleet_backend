const MONEY_SCALE = 2;

export function formatMoney(value: number | string): string {
  return Number(value).toFixed(MONEY_SCALE);
}

export function addMoney(a: string, b: string): string {
  return formatMoney(Number(a) + Number(b));
}

export function subtractMoney(a: string, b: string): string {
  return formatMoney(Number(a) - Number(b));
}

export function isPositiveMoney(value: string): boolean {
  return Number(value) > 0;
}

export function hasSufficientBalance(balance: string, amount: string): boolean {
  return Number(balance) >= Number(amount);
}

export const MONEY_AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;
