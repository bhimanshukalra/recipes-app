export type CompactRecipe = {
  name: string;
  url?: string;
  image?: string;
  recipeYield?: string;
  totalTime?: string;
  ingredients: string[];
  steps: string[];
};

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecipe(node: unknown): node is JsonObject {
  if (!isObject(node)) return false;
  const type = node["@type"];
  return Array.isArray(type) ? type.includes("Recipe") : type === "Recipe";
}

export function findRecipe(value: unknown): JsonObject | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findRecipe(item);
      if (found) return found;
    }
    return undefined;
  }
  if (isRecipe(value)) return value;
  if (isObject(value)) return findRecipe(value["@graph"]);
  return undefined;
}

function toText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return toText(value[0]);
  return undefined;
}

function toImage(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return toImage(value[0]);
  if (isObject(value)) return toText(value.url) ?? toText(value.contentUrl);
  return undefined;
}

export function collectSteps(instructions: unknown): string[] {
  if (typeof instructions === "string") return [instructions];
  if (!Array.isArray(instructions)) return [];
  return instructions.flatMap((step) => {
    if (typeof step === "string") return [step];
    if (isObject(step)) {
      if ("itemListElement" in step) return collectSteps(step.itemListElement);
      const text = toText(step.text) ?? toText(step.name);
      return text ? [text] : [];
    }
    return [];
  });
}

export function extractRecipe(
  jsonld: string[],
  url?: string,
): { recipe?: CompactRecipe; parseErrors: number } {
  let node: JsonObject | undefined;
  let parseErrors = 0;
  for (const block of jsonld) {
    try {
      node ??= findRecipe(JSON.parse(block));
    } catch {
      parseErrors += 1;
    }
  }
  if (!node) return { parseErrors };

  const ingredients = Array.isArray(node.recipeIngredient)
    ? node.recipeIngredient.filter((i): i is string => typeof i === "string")
    : [];

  return {
    parseErrors,
    recipe: {
      name: toText(node.name) ?? "Untitled",
      url,
      image: toImage(node.image),
      recipeYield: toText(node.recipeYield),
      totalTime: toText(node.totalTime),
      ingredients,
      steps: collectSteps(node.recipeInstructions),
    },
  };
}

// Handoff encoding for the openHostApp() URL. Percent-encoding is not safe:
// the native layer re-encodes query values and expo-router decodes them again,
// and the payload ends up decoded one time too many, so a literal "&" in a
// recipe step splits the query string and truncates the JSON. base64url only
// uses [A-Za-z0-9_-], which no layer touches.
export function encodeRecipePayload(recipe: CompactRecipe): string {
  const utf8 = unescape(encodeURIComponent(JSON.stringify(recipe)));
  return btoa(utf8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeRecipePayload(payload: string | undefined): CompactRecipe | undefined {
  if (!payload) return undefined;
  try {
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(decodeURIComponent(escape(atob(padded)))) as CompactRecipe;
  } catch {
    return undefined;
  }
}
