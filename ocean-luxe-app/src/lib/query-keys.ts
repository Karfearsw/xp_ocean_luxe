export const queryKeys = {
  resorts: ["resorts"] as const,
  resort: (slug: string) => ["resort", slug] as const,
  availability: (packageId: string) => ["availability", packageId] as const,
};
