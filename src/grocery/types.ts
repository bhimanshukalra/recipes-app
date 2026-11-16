/** One line on the grocery list. */
export type GroceryItem = {
  id: number;
  /** What to buy: "eggs", "all-purpose flour". */
  name: string;
  /** Amount to buy. Missing for lines with no amount ("salt", "extra-virgin olive oil"). */
  qty?: number;
  unit?: string;
  checked: boolean;
};

/** An item on its way to the list. */
export type GroceryDraft = Pick<GroceryItem, "name" | "qty" | "unit">;
