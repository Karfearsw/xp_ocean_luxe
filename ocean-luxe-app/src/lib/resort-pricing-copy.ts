import { formatCurrency } from "./formatters";

export function fromRateCopy(params: { from_rate_reference?: number | null; from_rate_currency?: string | null }) {
  const amount = params.from_rate_reference;
  if (amount == null || !Number.isFinite(amount) || amount <= 0) {
    return {
      label: "Rates vary by dates and unit type — request dates to get a quote.",
      tooltip: null as string | null,
      hasReference: false,
    };
  }

  return {
    label: `From ${formatCurrency(amount)}/night*`,
    tooltip: "Based on recent public reference rates; final total depends on dates and unit type.",
    hasReference: true,
  };
}

