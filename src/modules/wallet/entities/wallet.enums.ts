export enum WalletOwnerType {
  HUB = 'hub',
  RIDER = 'rider',
}

export enum WalletTransactionType {
  HOLD = 'hold',
  RELEASE = 'release',
  CREDIT = 'credit',
  DEBIT = 'debit',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
}

export enum WalletReferenceType {
  TOP_UP = 'top_up',
  ORDER = 'order',
  PAYOUT = 'payout',
  ADJUSTMENT = 'adjustment',
}
