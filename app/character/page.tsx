"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePlayer } from "@/lib/player-context";
import { getPlayerColor } from "@/lib/players";

const ABILITIES = [
  { key: "strength", label: "STR", full: "Strength" },
  { key: "dexterity", label: "DEX", full: "Dexterity" },
  { key: "constitution", label: "CON", full: "Constitution" },
  { key: "intelligence", label: "INT", full: "Intelligence" },
  { key: "wisdom", label: "WIS", full: "Wisdom" },
  { key: "charisma", label: "CHA", full: "Charisma" },
] as const;

type AbilityKey = (typeof ABILITIES)[number]["key"];

const SKILLS: { name: string; ability: AbilityKey }[] = [
  { name: "Athletics", ability: "strength" },
  { name: "Acrobatics", ability: "dexterity" },
  { name: "Sleight of Hand", ability: "dexterity" },
  { name: "Stealth", ability: "dexterity" },
  { name: "Arcana", ability: "intelligence" },
  { name: "History", ability: "intelligence" },
  { name: "Investigation", ability: "intelligence" },
  { name: "Nature", ability: "intelligence" },
  { name: "Religion", ability: "intelligence" },
  { name: "Animal Handling", ability: "wisdom" },
  { name: "Insight", ability: "wisdom" },
  { name: "Medicine", ability: "wisdom" },
  { name: "Perception", ability: "wisdom" },
  { name: "Survival", ability: "wisdom" },
  { name: "Deception", ability: "charisma" },
  { name: "Intimidation", ability: "charisma" },
  { name: "Performance", ability: "charisma" },
  { name: "Persuasion", ability: "charisma" },
];

interface SkillState {
  proficient: boolean;
  expertise: boolean;
}

interface CharacterData {
  characterName: string;
  race: string;
  class: string;
  level: number;
  movementSpeed: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  skills: Record<string, SkillState>;
}

function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export default function CharacterPage() {
  const { currentPlayer, effectivePlayer } = usePlayer();
  const playerName = effectivePlayer;
  const playerColor = playerName ? getPlayerColor(playerName) : "#888";

  const [data, setData] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchSheet = useCallback(async () => {
    if (!playerName) return;
    try {
      const res = await fetch(`/api/character?player=${playerName}`);
      if (res.ok) {
        const json = await res.json();
        setData({
          characterName: json.sheet.characterName,
          race: json.sheet.race || "",
          class: json.sheet.class || "",
          level: json.sheet.level,
          movementSpeed: json.sheet.movementSpeed,
          strength: json.sheet.strength,
          dexterity: json.sheet.dexterity,
          constitution: json.sheet.constitution,
          intelligence: json.sheet.intelligence,
          wisdom: json.sheet.wisdom,
          charisma: json.sheet.charisma,
          skills: json.sheet.skills || {},
        });
      }
    } catch {}
    setLoading(false);
  }, [playerName]);

  useEffect(() => {
    fetchSheet();
  }, [fetchSheet]);

  const saveSheet = useCallback(
    async (newData: CharacterData) => {
      if (!playerName) return;
      setSaving(true);
      await fetch("/api/character", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName, ...newData }),
      });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    [playerName]
  );

  const updateField = (updates: Partial<CharacterData>) => {
    if (!data) return;
    const newData = { ...data, ...updates };
    setData(newData);
    // Debounced auto-save
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveSheet(newData), 2000);
  };

  const updateSkill = (skillName: string, field: "proficient" | "expertise", value: boolean) => {
    if (!data) return;
    const skills = { ...data.skills };
    const current = skills[skillName] || { proficient: false, expertise: false };
    skills[skillName] = { ...current, [field]: value };
    // If unchecking proficiency, also uncheck expertise
    if (field === "proficient" && !value) {
      skills[skillName].expertise = false;
    }
    updateField({ skills });
  };

  if (!currentPlayer) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Log in to view your character.</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading character sheet...</p>
      </div>
    );
  }

  const profBonus = getProficiencyBonus(data.level);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-cinzel text-3xl font-bold text-gold">
        My Character
      </h1>

      {/* Character Name */}
      <div className="mb-6">
        <input
          value={data.characterName}
          onChange={(e) => updateField({ characterName: e.target.value })}
          placeholder="Character Name"
          className="w-full rounded border border-gray-700 bg-background px-4 py-3 font-cinzel text-2xl font-bold placeholder-gray-600 focus:border-gold focus:outline-none"
          style={{ color: playerColor }}
        />
        <p className="mt-1 text-xs text-gray-600">
          Player: {playerName}
        </p>
      </div>

      {/* Race & Class */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-surface p-3">
          <label className="mb-1 block text-xs font-bold text-gray-400">Race</label>
          <input
            value={data.race}
            onChange={(e) => updateField({ race: e.target.value })}
            placeholder="e.g. Half-Elf"
            className="w-full rounded border border-gray-700 bg-background px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gold focus:outline-none"
          />
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <label className="mb-1 block text-xs font-bold text-gray-400">Class</label>
          <input
            value={data.class}
            onChange={(e) => updateField({ class: e.target.value })}
            placeholder="e.g. Rogue"
            className="w-full rounded border border-gray-700 bg-background px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      {/* Level + Movement Speed */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-surface p-3">
          <label className="mb-1 block text-xs font-bold text-gray-400">Level</label>
          <input
            type="number"
            min={1}
            max={20}
            value={data.level}
            onChange={(e) => updateField({ level: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
            className="w-full rounded border border-gray-700 bg-background px-3 py-2 text-center text-lg font-bold text-white focus:border-gold focus:outline-none"
          />
          <p className="mt-1 text-center text-[10px] text-gray-600">
            Prof. Bonus: {formatModifier(profBonus)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <label className="mb-1 block text-xs font-bold text-gray-400">Speed (ft)</label>
          <input
            type="number"
            min={0}
            value={data.movementSpeed}
            onChange={(e) => updateField({ movementSpeed: Number(e.target.value) || 30 })}
            className="w-full rounded border border-gray-700 bg-background px-3 py-2 text-center text-lg font-bold text-white focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      {/* Ability Scores */}
      <div className="mb-6">
        <h2 className="mb-3 font-cinzel text-lg font-bold text-gold">Ability Scores</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {ABILITIES.map((ab) => {
            const score = data[ab.key];
            const mod = getModifier(score);
            return (
              <div
                key={ab.key}
                className="rounded-lg border border-border bg-surface p-2 text-center"
              >
                <p className="text-[10px] font-bold text-gray-500">{ab.label}</p>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={score}
                  onChange={(e) =>
                    updateField({ [ab.key]: Math.max(1, Math.min(30, Number(e.target.value) || 10)) } as Partial<CharacterData>)
                  }
                  className="mt-1 w-full rounded border border-gray-700 bg-background px-1 py-1 text-center text-lg font-bold text-white focus:border-gold focus:outline-none"
                />
                <p
                  className={`mt-1 text-sm font-bold ${mod >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {formatModifier(mod)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div className="mb-6">
        <h2 className="mb-3 font-cinzel text-lg font-bold text-gold">Skills</h2>
        <div className="flex flex-col gap-1">
          {SKILLS.map((skill) => {
            const abilityMod = getModifier(data[skill.ability]);
            const skillState = data.skills[skill.name] || { proficient: false, expertise: false };
            const total =
              abilityMod +
              (skillState.proficient ? profBonus : 0) +
              (skillState.expertise ? profBonus : 0);

            return (
              <div
                key={skill.name}
                className="flex items-center gap-2 rounded border border-border bg-surface px-3 py-1.5"
              >
                {/* Total */}
                <span
                  className={`w-8 text-center text-sm font-bold ${total >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {formatModifier(total)}
                </span>

                {/* Proficiency */}
                <label className="flex items-center gap-0.5" title="Proficient">
                  <input
                    type="checkbox"
                    checked={skillState.proficient}
                    onChange={(e) => updateSkill(skill.name, "proficient", e.target.checked)}
                    className="rounded"
                  />
                </label>

                {/* Expertise */}
                <label
                  className={`flex items-center gap-0.5 ${!skillState.proficient ? "opacity-30" : ""}`}
                  title="Expertise"
                >
                  <input
                    type="checkbox"
                    checked={skillState.expertise}
                    disabled={!skillState.proficient}
                    onChange={(e) => updateSkill(skill.name, "expertise", e.target.checked)}
                    className="rounded"
                  />
                </label>

                {/* Skill name */}
                <span className="flex-1 text-sm text-gray-300">{skill.name}</span>

                {/* Ability tag */}
                <span className="text-[10px] text-gray-600">
                  {ABILITIES.find((a) => a.key === skill.ability)?.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => saveSheet(data)}
          disabled={saving}
          className="rounded bg-gold px-6 py-2 text-sm font-bold text-background hover:bg-[#f0d090] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Character"}
        </button>
        {saved && (
          <span className="text-sm text-green-400">Character saved!</span>
        )}
        <span className="text-[10px] text-gray-600">Auto-saves after 2s</span>
      </div>
    </div>
  );
}
