export const MIN_CONTRACT = 500
/** Business-plan model: <$3,000 → $200 flat; ≥$3,000 → $200 + 2.5%. Must be confirmed before operations. */
export function smeFee(amount: number): number { return amount < 3000 ? 200 : 200 + amount * 0.025 }
export function effectiveRate(amount: number): number { return amount > 0 ? (smeFee(amount) / amount) * 100 : 0 }
export function realEstate(budget: number, participants: number, pct: number) {
  const each = budget / participants, fee = each * pct / 100
  return { each, fee, total: fee * participants }
}
