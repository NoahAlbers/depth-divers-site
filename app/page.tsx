"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const TAGLINES = [
  // --- General Underdark ---
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
  "There is no lab safety protocol for the Underdark.",
  "Baphomet's faithful called it a holy mission. The rest of us call it a Tuesday.",
  "Betraying your warship from the inside? Bold. Stupid. But bold.",
  "The difference between a smuggler and an adventurer is how the story ends.",
 
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
  const [taglineIndex, setTaglineIndex] = useState(() =>
  Math.floor(Math.random() * TAGLINES.length)
);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTaglineIndex((prev) => {
  let next;
  do {
    next = Math.floor(Math.random() * TAGLINES.length);
  } while (next === prev);
  return next;
});
        setFade(true);
      }, 600);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

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
          {TAGLINES[taglineIndex]}
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
