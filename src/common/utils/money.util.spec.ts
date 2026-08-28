import { addMoney, formatMoney, hasSufficientBalance } from './money.util';

describe('money.util', () => {
  it('formats values to two decimal places', () => {
    expect(formatMoney('10')).toBe('10.00');
    expect(formatMoney(10.5)).toBe('10.50');
  });

  it('adds and subtracts money without losing scale', () => {
    expect(addMoney('100.00', '25.50')).toBe('125.50');
    expect(addMoney('100.00', '-60.00')).toBe('40.00');
  });

  it('checks sufficient balance', () => {
    expect(hasSufficientBalance('100.00', '60.00')).toBe(true);
    expect(hasSufficientBalance('100.00', '100.01')).toBe(false);
  });
});
