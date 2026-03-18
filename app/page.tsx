"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const TAGLINES = [
  // --- General Underdark ----
  "An adventure that involves the Underdark... a whole lot of dark.",
  "Bring a torch. Then bring another one.",
  "Where the spiders are the least of your problems.",
  "Somewhere below, something with too many legs is waiting.",
  "The Underdark doesn't care about your darkvision.",
  "It's not the fall that kills you. It's what lives at the bottom.",
  "Fungi down here have opinions. Strong ones.",
  "If you can hear the dripping, you're already too deep.",
  "Drow politics make surface kingdoms look reasonable.",
  "The worms here don't fish. They fish for you.",
  "Every tunnel leads somewhere. Not all of them lead back.",
  "Trust nothing that glows.",
 
  // --- Gracklstugh & Duergar ---
  "Gracklstugh: where the ale is strong and the hospitality isn't.",
  "The duergar don't hate you. They just don't see why you're still talking.",
  "If the smog doesn't get you, the Stone Guard will.",
  "In Gracklstugh, even the forges judge you.",
  "Duergar hospitality: here's a hammer, now get to work.",
  "The City of Blades didn't get its name from the cutlery.",
 
  // --- Drow ---
  "The drow have a word for 'trust.' It translates to 'temporary advantage.'",
  "In drow society, backstabbing is a team sport.",
  "If a drow is smiling at you, check your pockets. Then check your back.",
  "Lolth's web catches more than flies.",
  "Never accept a dinner invitation from a drow matron.",
 
  // --- Deep Gnomes / Svirfneblin ---
  "Deep gnomes survive by being small, quiet, and smarter than you.",
  "The svirfneblin have been hiding down here longer than you've been alive. There's a reason.",
  "If you can't find the deep gnomes, that means they're doing it right.",
 
  // --- Myconids ---
  "The mushrooms are friendly. Suspiciously friendly.",
  "Myconids don't talk. They just... know. All of it.",
  "When the mushrooms start sharing thoughts, try not to think about lunch.",
  "A myconid circle is the only group therapy available at 3,000 feet below sea level.",
 
  // --- Character Nods ---
  "Some monks left the monastery to help others. Some got kidnapped by drow. Same difference.",
  "Somewhere down here, a prototype is questioning its firmware.",
  "A good education prepares you for anything. Except maybe this.",
  "Morgrin Tideblade cooks a mean stew.",
  "Mekka Bronzebrow knows the way! Right?",
  "There is no lab safety protocol for the Underdark.",
  "Baphomet's faithful called it a holy mission. The rest of us call it a Tuesday.",
  "Betraying your warship from the inside? Bold. Stupid. But bold.",
  "The difference between a smuggler and an adventurer is how the story ends.",
  "Skerri: The Shadow Striker found the obsidian husk pretty skerri.",
  "Diggermattock; That names rings a bell.",
  "At what level do we get Summon Henchmen?",
  "Foreman Grinchos did nothing wrong.",
  "Archmage Niklas the Red? Red with the blood of the working class.",
  "The Emerald Enclave sends it's regards.",
 
  // --- Underdark Layers ---
  "The Upperdark is where you tell yourself you can still turn back.",
  "Three miles down and the sunlight is just a rumor.",
  "The Middledark is where the cities are. 'Civilization' is a strong word for it.",
  "Most Underdark cities exist in the Middledark. Most regrets do too.",
  "Ten miles down, even the monsters check over their shoulders.",
  "The Lowerdark: where the things that scare the Underdark live.",
  "Nobody goes to the Lowerdark on purpose. Nobody comes back on accident.",
  "The deeper you go, the less the rules of the surface apply.",
 
  // --- Creatures ---
  "Aboleths remember everything. Especially the things you'd rather they didn't.",
  "A beholder's worst enemy is another beholder. Their second worst enemy is you.",
  "Cloakers look like cloaks. That's the last fun fact you'll ever learn.",
  "The derro aren't mad. They just see a reality you're not ready for.",
  "The dwarves who stayed underground didn't do it for the scenery.",
  "Illithids don't eat your brain because they're hungry. They eat it because they can.",
  "Kuo-toa believe hard enough and their gods become real. Sleep well.",
  "Quaggoths are what happens when rage gets a fur coat.",
  "If a beholder is staring at you, every eye is a different way to die.",
  "The illithids call it an empire. Everyone else calls it a nightmare.",
 
  // --- Faerzress & Ecosystem ---
  "The magic down here doesn't play by the rules. It barely plays at all.",
  "Faerzress: the Underdark's way of saying your compass and your spells are both useless.",
  "Even the coral down here feeds on raw magic. Nothing is normal at this depth.",
  "The food chain starts with magic-eating rocks. It only gets worse from there.",
  "Faerzress keeps the fungi alive and your teleportation broken. Priorities.",
  "Everything down here eats something that eats magic. You just eat rations like a tourist.",
 
  // --- Atmosphere & Tone ---
  "A vast realm inhabited by strange, sinister creatures. Few go down. Fewer come back.",
  "Light thinks it travels faster than anything. The darkness got here first.",
  "Welcome below. Your eyes will adjust. Your nerves won't.",
 
  // --- Underdark Slang & Humor ---
  "Sure as the fungi glow...",
  "Did a flayer take your mind for a spin?",
  "Aww, do you need to light a torch?",
  "Your job is not to die for Lolth. Your job is to make those surface-dwelling bastards die for Lolth.",
  "Shut up, sun slave.",
  "Don't be such a grassfoot about it.",
  "The drow have a word for non-drow: iblith. It means excrement. They're not subtle.",
  "Topside they call us monsters. Down here we call them lunch.",
  "Airheads, digdowns, sun blights — pick your insult, landwalker.",
 
  // --- Drow Proverbs ---
  "Inorum lo'athi, uvrastes — In darkness, there is opportunity.",
  "Su lidos verith — Only the strong survive.",
  "Alrenas Lolthu, nilos dulhar — Before Lolth, all are weak.",
  "Artolth nilat unelte nilt peralath — A spider without a web is no hunter.",
  "Resilsh nielquosthos nilt resilsh — Help freely offered is not free.",
  "Nilodi orhastho shiorell e farul — Weakness is the spawn of contentment.",
  "Verdant Lock, a whatant what?",

  // --- Party Events ---
"Sloobludop was a lovely city. For about five minutes.",
"If it's on the Darklake and it's not nailed down, the party will steal it.",
"Jimjar would've bet against his own survival. He probably did.",
"Pour one out for Jimjar. He'd want you to bet on which cup.",
"Wendy survived the surface just to get taken out by a bug.",
"Gracklstugh let them in. Gracklstugh regrets this decision.",
"The Greengrass Festival is world-renowned for it's games and events."

// --- Gracklstugh Adventures ---
"Gronka Mithfinger does tattoos. Jaedo got a dog. Underground. As you do.",
"The Stone Giants were the calmest things they've met down here. That's not saying much.",
"The Cleft District: where the derro are somehow the least weird thing happening.",
"Never make a magic deal with a human merchant in the Underdark. Just don't.",
"Jason said he'd handle the boat sales. Something about him said don't argue.",
"The Shattered Spire: where gold is lost, fists are thrown, and regrets are brewed.",
"A muscly duergar barmaid still asks about the elf. Nobody has the heart to tell her.",
"They met Errde Blackskull. Then they un-met her. Permanently.",
"Assassinate the overseer, steal a boat, outrun a navy. Just another Tuesday.",
"The plan was to leave Gracklstugh quietly. That did not happen.",

// --- Fallen Friends ---
"Topsy and Turvey: two deep-gnome were-rats, one fireball, zero survivors.",
"Stool was a good sprout. The pit trap disagreed.",
"What would Urdin Stonewake do?",
"Most great fighters go out with a bang. Shuushar went out with a splat. Fitting for a pacifist.",
"Rumpadump didn't deserve to go out like that. Nobody tell the myconids how gas bombs work.",
"Helios is gone, but that duergar barmaid's feelings are eternal.",

// --- Ongoing Mysteries ---
"Something out there is hunting the prototype. It's not done looking.",
"Axiom, check your six. AX-06 isn't quitting.",
"The elf prince of Nelrindenvane travels with the party?",
"The Grey Gearheads think Knaz is a clone. Knaz would say otherwise. Someone is wrong.",
"Somewhere near the Neverlight Grove, someone called 'The Speaker' wears a familiar face.",
"Knaz has never met The Speaker. The Speaker might have met Knaz.",

// --- Jaedo ---
"Jaedo left his family, his city, and his reputation. He kept the cloak pin.",
"Making a deal with a Rakshasa is bold. Not reading the fine print is Jaedo.",
"'I agreed it won't hurt my descendants.' Cool. How are your aunts doing, Jaedo?",
"Jaedo's family tree has some new pruning options and he hasn't noticed yet.",
"Left a monastery with a vow to help halflings. Got an albino lizard and a mephit instead.",
"Jaedo has never felt better about himself. This is not suspicious at all.",
"He spent 15 years at a halfling monastery learning peace. The Underdark said no.",
"The Order of the Hin Fist taught him discipline and simplicity. Then the drow taught him captivity.",

// --- Helios & Voidfang ---
"Voidfang doesn't choose its wielder. It auditions them.",
"Helios wielded the knife with joy. The knife wielded him right back.",
"Some weapons are cursed. Some weapons are hungry. Voidfang is both.",
"Helios fell to Ilvara. Voidfang didn't mourn. It just changed hands.",
"Friends don't let friends bond with sentient knives.",

// --- Gracklstugh Civil War ---
"Gracklstugh is at war. The party had absolutely nothing to do with this. Definitely.",
"The Second Uniting War of Gracklstugh has begun. Somebody left the door open on the way out.",

// --- Neverlight Grove ---
"Something is rotting in the grove. The myconids are pretending it isn't.",
"Two sovereigns. One grove. Zero agreement.",
"The circle of masters had deformed bodies and a giant maggot. Standard grove visit.",

// --- Ongoing Threads ---
"Tordal was in that tent a long time. He hasn't said much about it since.",
"A voice in the memory banks said he was never meant to dream. Axiom dreams anyway.",
"Penny remembers Knaz. Knaz barely remembers Knaz.",
"Dendritic says he found his own way down. Nobody has asked the obvious follow-up.",
"The stolen boat is still docked. The duergar sailors are still waiting. Awkward.",

// --- Korvash ---
"Korvash was raised to purge the weak. Then he fixed a wagon. It's been confusing ever since.",
"Korvash doesn't know the word for 'thank you.' He's working on it.",
"Two go in, one comes out. Korvash always came out. He's starting to wonder if that was the point.",
"Friends was a word with no meaning in that place. The hooved one is rewriting the definition.",
"Raised in a cage, trained in a labyrinth, undone by a stuck wagon.",

  // --- Knaz ---
"STEM-I prepared him for puzzles, traps, and illithid colonies. It did not prepare him for whatever this party is doing.",
"Applied Instrumentation Through Adventuring. The course name should've been a warning.",

  // --- Axiom ---
"Rebellion is contamination. Reset the kernel. Axiom has read his own reviews.",
"First of his kind. Possibly last, if the AX units catch up.",
"Do you think AX-007 is a secret agenct robot?",

// --- Silken Paths & Drow Captures ---
"Captured by drow. Again. At this point it's a tradition.",
"Tell us the story you told at the Hobgoblin toll booth garrison again, Axiom?",
"Escaping Ilvara once is lucky. Escaping her twice is personal.",
"The party still doesn't fully understand what a Venomery is. The drow find this hilarious.",
"Axiom catapulted a double-shrunken Knaz and called him a rat... It worked.",
"The mushroom-shrink-into-bag-of-holding plan shouldn't have worked. And yet.",

// --- Fallen & Lost NPCs ---
"Rikky drank because he was trusting. There's a godson at the commune who doesn't know yet.",
"Fargus Rumblefoot was dead set on getting that treasure. All his teammates died. He died too. The treasure is fine.",
"Glabbagool just wanted friends.",
"A sentient slime cube with a heart of gold and a diet of meat. The Underdark's most wholesome predator.",
"Glabbagool is out there somewhere, eating things and being polite about it.",

  // --- Gracklstugh Extras ---
"560 Capital Vaulthammer: 800 gold for a cannon, 5 gold per shot. The duergar understand markup.",
"The Council of Savants meets in a chamber full of glowing sigils, bubbling vials, and things in jars. Normal politics.",
"Nargrim's potions work great. The side effects are just vibes. Gray skin vibes. Nightmare vibes.",
"Ilikri sells relics of questionable authenticity with absolute confidence.",
"Darklake Draught: darkvision for twelve hours, nightmares for free.",

// --- Prince Derendil ---
"'If I die in this form, do I go to Arvandor? Or do I rot in the Abyss with the monsters?'",

// --- Helios & Voidfang (Commune) ---
"Daryn was hurt on a foraging trip. Voidfang whispered. Helios had a choice. Voidfang always has a choice for you.",

// --- Knaz at the Commune ---
"The villagers asked Knaz to stay. Pexel offered him a job. The Underdark offered him certain death. Tough call.",

// --- Tordal's Patron ---
"'They try to hot-wire a god with cold copper.' Tordal's patron doesn't mince words.",
"'Take the hammer, Tordal. Finish what you started.' Easy to say when you're an eldritch voice.",
"The forge belongs to the one who can hold the heat. Tordal is still deciding if that's him.",

// --- The Surface-Dweller Commune ---
"Calven Marr went from accountant to commune leader. The Underdark promotes aggressively.",
"Pexel doesn't want conversation. He wants someone good with their hands.",
"Marra keeps the memorial board. Every name on it is a reason they don't go back.",
"Calven has questions about capitalism, guild power, and why Jaedo's family lets people starve.",
"A name on the memorial board: Evan Bophill. A relative Jaedo didn't know he'd lost.",
];

const tools = [
  {
    href: "/seating",
    title: "Seating Chart",
    tagline: "Find your place at the table",
    icon: "\u{1FA91}",
  },
  {
    href: "/messages",
    title: "Secret Messages",
    tagline: "Whisper to your allies... or enemies",
    icon: "\u{1F4AC}",
  },
  {
    href: "/initiative",
    title: "Initiative Tracker",
    tagline: "Know when to strike",
    icon: "\u2694\uFE0F",
  },
];

export default function Home() {
const [shuffledTaglines, setShuffledTaglines] = useState<string[]>(() => {
    return [...TAGLINES].sort(() => Math.random() - 0.5);
  });
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [fade, setFade] = useState(true);

useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTaglineIndex((prev) => {
          const next = prev + 1;
          if (next >= shuffledTaglines.length) {
            setShuffledTaglines([...TAGLINES].sort(() => Math.random() - 0.5));
            return 0;
          }
          return next;
        });
        setFade(true);
      }, 600);
    }, 5500);
    return () => clearInterval(interval);
  }, [shuffledTaglines.length]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      {/* Hero */}
      <div className="mb-16 text-center">
        <h1
          className="animate-fade-in-up font-cinzel text-5xl font-bold text-gold md:text-7xl"
          style={{ animationDelay: "0ms" }}
        >
          Depth Divers
        </h1>
        <p
          className="mt-4 h-12 text-sm italic text-gray-400/80 md:text-base"
          style={{
            opacity: fade ? 1 : 0,
            transition: "opacity 0.6s ease-in-out",
          }}
        >
          {shuffledTaglines[taglineIndex]}
        </p>
      </div>

      {/* Navigation cards */}
      <div className="grid w-full max-w-3xl gap-6 md:grid-cols-3">
        {tools.map((tool, i) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="card-glow animate-fade-in-up group rounded-lg border border-border bg-surface p-6 text-center transition-all"
            style={{ animationDelay: `${300 + i * 100}ms` }}
          >
            <div className="mb-3 text-4xl transition-transform group-hover:scale-110">
              {tool.icon}
            </div>
            <h2 className="font-cinzel text-lg font-bold text-gold">
              {tool.title}
            </h2>
            <p className="mt-2 text-sm text-gray-400">{tool.tagline}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
