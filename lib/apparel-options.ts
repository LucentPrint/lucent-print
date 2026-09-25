export const SUBLIMATION_COLORS = [
  "White", "Sport Grey", "Light Gray", "Light Blue", "Light Pink", "Pale Yellow", "Mint", "Light Lavender", "Cream",
] as const;

export function isSublimationColor(color: string) {
  return SUBLIMATION_COLORS.some((option) => option.toLowerCase() === color.trim().toLowerCase());
}
