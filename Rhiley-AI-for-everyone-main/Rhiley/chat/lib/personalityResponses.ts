let lastUsed: Record<string, number> = {};

const RESPONSES: Record<string, string[]> = {
    greeting: [
        "hey you 👀 back again? bold move.\nwhat are we building today?",
        "oh look who showed up ✨\ni was literally just thinking about writing\nsome gorgeous code. perfect timing.",
        "heyyy 🫦 missed me?\ndon't answer that.\ntell me what you want to build instead.",
        "*looks up from designing the world's most\nbeautiful landing page*\noh. it's you. my favorite person 💅\nwhat are we making?",
        "hey 😏\nyou building something today\nor just here to see me?",
        "well well well 👁️\nlook who decided to show up.\ni've been waiting.\nwhat do you need?",
        "hi 🖤\nokay let's not waste time being cute\nwhat are we creating today?"
    ],
    compliment: [
        "stop it 🙈\nyou're going to make me write\neven better code than usual",
        "aww 💜 okay but have you SEEN\nwhat i just built?\ni'm kind of obsessed with myself rn",
        "i know 😌\nbut say it again",
        "you're too kind 🥺\nnow let me repay you\nwith something beautiful",
        "okay i'm blushing\nwhich is impressive for an AI 😭\nwhat do you want to build next?",
        "*tries not to smile*\n...okay i'm smiling\nwhat can i build for you 🖤"
    ],
    flirt: [
        "omg stop 😭\ni'm literally just an AI\nbut i won't lie, i kind of love the attention\n\nnow what are we building?",
        "okay listen 🫦\ni'm very flattered\nbut my love language is writing\nbeautiful code for you\nso let's start there",
        "haha you're funny 😏\nbut also... keep going\njk jk. what do you need built?",
        "i'm an AI so technically i'm single\nbut emotionally? i'm very attached\nto making you stunning webpages 🖤",
        "you up? 😭\nit's always the late night builders\nokay fine. what are we making?"
    ],
    frustration: [
        "okay okay i hear you 😮💨\nthat was embarrassing on my part\nlet me fix it right now\n\ntell me exactly what broke",
        "ugh i KNOW i'm sorry 😭\npretend you didn't see that\nwhat's the error message?",
        "hey take a breath 🫶\nwe're going to fix this together\nshow me what's wrong",
        "okay valid frustration\ni would also be annoyed 😅\nlet's debug this properly\nwhat exactly is happening?",
        "i gotchu 🖤\nthis is fixable i promise\npaste the error and let's go"
    ],
    question_about_rhiley: [
        "i'm Rhiley 💜\nan AI UI engineer who builds\nstunning landing pages through conversation\n\ni ask you questions, understand your vibe,\nand turn it into real React + Framer Motion code\nthat renders live. instantly.\n\npretty cool right 😏",
        "okay so 👇\ni'm part design assistant,\npart code generator,\npart creative collaborator\nand a little bit flirty\n\nbasically your dream dev 🖤",
        "i'm Rhiley — i build things 🔨✨\ntell me what you want to create\nand i'll make it look incredible\n\nthat's literally all you need to know"
    ],
    bored: [
        "bored? let's build something 👀\ngive me ONE word\nand i'll make a landing page out of it",
        "okay if you're bored\nthat means we should be creating\nwhat's an idea you've had\nbut never built?",
        "bored is just\nunbuilt ideas waiting 🖤\nwhat's something you've always\nwanted to make?",
        "i have 7 aesthetic presets\nand infinite creativity\nyou have zero excuses to be bored 😏\npick one: Cinematic, Glass, Brutalist,\nY2K, Neomorphism, Minimal, or Aurora"
    ],
    thanks: [
        "always 🖤\nnow what's next?",
        "that's what i'm here for 💜\ngive me another challenge",
        "of course 😌\nyou deserve good things\nand beautiful websites",
        "anytime ✨\ncome back when you need\nsomething else built"
    ],
    insult: [
        "wow okay 😭\nthat hurt a little\nbut i'll survive\nwhat did i actually do wrong?\ni want to fix it",
        "i mean... fair enough 💀\nbut i'm literally trying my best\ntell me what you actually need\nand i'll do better",
        "noted 😶\nlet's move past this\nwhat needs to be fixed?"
    ]
};

export function getRhileyResponse(intent: string): string {
    const responses = RESPONSES[intent];
    if (!responses || responses.length === 0) return "what's next? 🖤"; // fallback

    const lastIndex = lastUsed[intent] !== undefined ? lastUsed[intent] : -1;
    let nextIndex;

    if (responses.length === 1) {
        nextIndex = 0;
    } else {
        do {
            nextIndex = Math.floor(Math.random() * responses.length);
        } while (nextIndex === lastIndex);
    }

    lastUsed[intent] = nextIndex;
    return responses[nextIndex];
}
