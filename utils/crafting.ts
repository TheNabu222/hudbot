import { CraftingRecipe } from "../types";

export const getCraftingRequirements = (recipe: CraftingRecipe) => {
  if (recipe.requirements) return recipe.requirements;

  return [
    recipe.ingredient1Id
      ? {
          id: `${recipe.id}-ingredient-1`,
          itemId: recipe.ingredient1Id,
          consume: recipe.destroyIngredient1,
          role: "ingredient" as const,
        }
      : null,
    recipe.ingredient2Id
      ? {
          id: `${recipe.id}-ingredient-2`,
          itemId: recipe.ingredient2Id,
          consume: recipe.destroyIngredient2,
          role: "ingredient" as const,
        }
      : null,
    recipe.ingredient3Id
      ? {
          id: `${recipe.id}-ingredient-3`,
          itemId: recipe.ingredient3Id,
          consume: recipe.destroyIngredient3 ?? true,
          role: "ingredient" as const,
        }
      : null,
  ].filter((requirement): requirement is NonNullable<typeof requirement> =>
    Boolean(requirement),
  );
};

export const recipeMatchesSelection = (
  recipe: CraftingRecipe,
  selectedItemIds: string[],
) => {
  const selected = selectedItemIds.filter(Boolean).sort();
  const required = getCraftingRequirements(recipe)
    .filter((requirement) => requirement.itemId)
    .map((requirement) => requirement.itemId)
    .sort();

  if (selected.length === 0 || selected.length !== required.length) return false;
  return selected.every((itemId, index) => itemId === required[index]);
};

export const applyCraftingRecipeToInventory = (
  inventory: string[],
  recipe: CraftingRecipe,
) => {
  const next = [...inventory];

  getCraftingRequirements(recipe)
    .filter((requirement) => requirement.itemId)
    .forEach((requirement) => {
    if (!requirement.consume) return;
    const index = next.indexOf(requirement.itemId);
    if (index !== -1) next.splice(index, 1);
    });

  const itemOutcomes = (recipe.outcomes || []).filter(
    (outcome) => outcome.type === "give_item" && outcome.targetId,
  );
  if (itemOutcomes.length > 0) {
    itemOutcomes.forEach((outcome) => next.push(outcome.targetId));
  } else if (recipe.resultItemId) {
    next.push(recipe.resultItemId);
  }

  return next;
};

export const withCraftingRequirements = (
  recipe: CraftingRecipe,
  requirements: ReturnType<typeof getCraftingRequirements>,
): CraftingRecipe => {
  const normalized = requirements.map((requirement) => ({
    ...requirement,
    role: requirement.role || "ingredient",
  }));
  const populated = normalized.filter((requirement) => requirement.itemId);
  const [first, second, third] = populated;

  return {
    ...recipe,
    requirements: normalized,
    ingredient1Id: first?.itemId || "",
    ingredient2Id: second?.itemId || "",
    ingredient3Id: third?.itemId || undefined,
    destroyIngredient1: first?.consume ?? true,
    destroyIngredient2: second?.consume ?? true,
    destroyIngredient3: third?.consume,
  };
};
