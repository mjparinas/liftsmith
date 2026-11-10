// Running costs for the admin Revenue tab (Gradelings' monthly costs, itemised): what the business pays each
// month (hosting, database, email, developer accounts, AI drafts), entered by an admin and kept in
// admin_settings ("running_costs"). Profit is net MRR (after store fees, refunds and VAT) minus their total.

export interface RunningCost {
  name: string;
  /** US dollars a month; a yearly fee is entered as a twelfth. */
  monthly: number;
}

export const COST_LIMITS = { count: 30, name: 60, monthly: 100_000 };

export function costsProblem(list: unknown): string | null {
  if (!Array.isArray(list)) return "Send a list of costs.";
  if (list.length > COST_LIMITS.count) return `Keep it to ${COST_LIMITS.count} costs.`;
  for (const c of list as Partial<RunningCost>[]) {
    if (!c || typeof c.name !== "string" || !c.name.trim() || c.name.length > COST_LIMITS.name)
      return `Give each cost a name under ${COST_LIMITS.name} characters.`;
    if (typeof c.monthly !== "number" || !Number.isFinite(c.monthly) || c.monthly < 0 || c.monthly > COST_LIMITS.monthly)
      return "Each cost needs an amount a month, in dollars.";
  }
  return null;
}

export const totalCosts = (list: RunningCost[]) => Math.round(list.reduce((t, c) => t + c.monthly, 0) * 100) / 100;

/** Profit a month and a year from net MRR, and the months of costs the revenue covers (null with no costs). */
export function profit(netMrr: number, list: RunningCost[]): { costs: number; monthly: number; yearly: number; covered: number | null } {
  const costs = totalCosts(list);
  const monthly = Math.round((netMrr - costs) * 100) / 100;
  return { costs, monthly, yearly: Math.round(monthly * 12 * 100) / 100, covered: costs > 0 ? netMrr / costs : null };
}
