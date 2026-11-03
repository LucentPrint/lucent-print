import { ADULT_SHIRT_SIZES, KIDS_SHIRT_SIZES } from "@/lib/catalog-shirts";
export function ShirtSizeOptions() {
  return <><optgroup label="Kids / youth — $20">{KIDS_SHIRT_SIZES.map(size => <option key={size} value={size}>{size} — $20</option>)}</optgroup><optgroup label="Adults — $25">{ADULT_SHIRT_SIZES.map(size => <option key={size} value={size}>{size} — $25</option>)}</optgroup></>;
}
