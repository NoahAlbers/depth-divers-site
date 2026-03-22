/**
 * Calculate a difficulty multiplier based on a player's skill bonus.
 *
 * Range: 0.8 (easiest, very high bonus) to 1.2 (hardest, very low bonus)
 * Baseline: 1.0 at bonus +3 (average adventurer)
 * 3% adjustment per point of difference from baseline.
 */
export function getDifficultyMultiplier(skillBonus: number): number {
  const baseline = 3;
  const adjustment = (baseline - skillBonus) * 0.03;
  return Math.max(0.8, Math.min(1.2, 1.0 + adjustment));
}

/**
 * Calculate the ability modifier from a score.
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Calculate proficiency bonus from level.
 */
export function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

/**
 * Calculate a player's total skill bonus.
 */
export function getSkillBonus(
  abilityScore: number,
  level: number,
  proficient: boolean,
  expertise: boolean
): number {
  const mod = getAbilityModifier(abilityScore);
  const prof = getProficiencyBonus(level);
  return mod + (proficient ? prof : 0) + (expertise ? prof : 0);
}

/**
 * All D&D skills + raw ability scores for the skill override dropdown.
 */
export const ALL_SKILL_OPTIONS: { value: string; label: string }[] = [
  { value: "default", label: "Default (game standard)" },
  // STR
  { value: "Athletics", label: "STR / Athletics" },
  // DEX
  { value: "Acrobatics", label: "DEX / Acrobatics" },
  { value: "Sleight of Hand", label: "DEX / Sleight of Hand" },
  { value: "Stealth", label: "DEX / Stealth" },
  // CON (no skills)
  // INT
  { value: "Arcana", label: "INT / Arcana" },
  { value: "History", label: "INT / History" },
  { value: "Investigation", label: "INT / Investigation" },
  { value: "Nature", label: "INT / Nature" },
  { value: "Religion", label: "INT / Religion" },
  // WIS
  { value: "Animal Handling", label: "WIS / Animal Handling" },
  { value: "Insight", label: "WIS / Insight" },
  { value: "Medicine", label: "WIS / Medicine" },
  { value: "Perception", label: "WIS / Perception" },
  { value: "Survival", label: "WIS / Survival" },
  // CHA
  { value: "Deception", label: "CHA / Deception" },
  { value: "Intimidation", label: "CHA / Intimidation" },
  { value: "Performance", label: "CHA / Performance" },
  { value: "Persuasion", label: "CHA / Persuasion" },
  // Raw abilities
  { value: "raw_strength", label: "STR (raw)" },
  { value: "raw_dexterity", label: "DEX (raw)" },
  { value: "raw_constitution", label: "CON (raw)" },
  { value: "raw_intelligence", label: "INT (raw)" },
  { value: "raw_wisdom", label: "WIS (raw)" },
  { value: "raw_charisma", label: "CHA (raw)" },
];

/**
 * Default skill mappings for each game.
 * Maps game ID to { skill, ability } where skill is the D&D skill name
 * and ability is the parent ability score field.
 */
export const DEFAULT_SKILL_MAPPINGS: Record<
  string,
  { skill: string | null; ability: string }
> = {
  "arcane-conduit": { skill: "Arcana", ability: "intelligence" },
  "rune-echoes": { skill: "History", ability: "intelligence" },
  "glyph-race": { skill: "Investigation", ability: "intelligence" },
  "stalactite-storm": { skill: "Acrobatics", ability: "dexterity" },
  "spider-swat": { skill: "Perception", ability: "wisdom" },
  "lockpicking": { skill: "Sleight of Hand", ability: "dexterity" },
  "stealth-sequence": { skill: "Stealth", ability: "dexterity" },
  "drinking-contest": { skill: null, ability: "constitution" }, // raw ability, no skill
  "defuse-the-glyph": { skill: "Arcana", ability: "intelligence" },
};
