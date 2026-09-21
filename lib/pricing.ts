export type MarketComparison = {
  label: string;
  range: string;
  note: string;
};

export function getMarketComparison(collection: string): MarketComparison {
  if (collection.toLowerCase().includes("apparel")) {
    return {
      label: "Typical one-off custom shirt",
      range: "$20–$40",
      note: "Typical U.S. online pricing varies by garment, artwork, print locations, and quantity.",
    };
  }

  return {
    label: "Typical handmade clicker",
    range: "$6–$15",
    note: "Comparable 3D-printed mechanical-switch clickers vary by size, detail, and number of switches.",
  };
}
