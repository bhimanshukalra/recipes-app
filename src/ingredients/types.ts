/**
 * One ingredient line. `raw` is always the text as published and is the fallback
 * when the line could not be understood; the other fields are best effort.
 */
export type Ingredient = {
  raw: string;
  /** Amount, e.g. 1.5. For a range ("2-3") this is the lower end. */
  qty?: number;
  /** Upper end of a range ("2-3"), when there is one. */
  qtyMax?: number;
  /** Canonical unit: cup, tbsp, tsp, g, kg, mg, ml, l, oz, lb, fl oz, pt, qt, gal, or a count word (can, clove, pinch...). */
  unit?: string;
  /** The ingredient itself, without amount, unit, notes or preparation: "all-purpose flour". */
  name?: string;
  /** Anything else on the line: "14.5 ounce", "minced", "for the pan". */
  note?: string;
};
