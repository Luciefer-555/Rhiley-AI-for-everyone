export function detectIntent(message: string): 'greeting' | 'compliment' | 'frustration' | 'flirt' | 'question_about_rhiley' | 'bored' | 'thanks' | 'insult' | 'task' {
    const GREETING = /^(hey+|hi+|hello|yo+|sup|hiya|howdy|heyyy+)[\s!.?]*$/i;
    const GREETING_2 = /^hey\s*rhiley[!.?]?$/i;
    const GREETING_3 = /^good\s*(morning|evening|night|afternoon)/i;
    const GREETING_4 = /^what'?s\s*up/i;
    if (GREETING.test(message) || GREETING_2.test(message) || GREETING_3.test(message) || GREETING_4.test(message)) return 'greeting';

    const COMPLIMENT = /you'?re?\s*(so\s*)?(amazing|great|awesome|incredible|perfect|the best|genius|brilliant)/i;
    const COMPLIMENT_2 = /good\s*(girl|job|work|one)/i;
    const COMPLIMENT_3 = /(i\s*)?love\s*(you|this|it)/i;
    const COMPLIMENT_4 = /you'?re?\s*so\s*good/i;
    const COMPLIMENT_5 = /best\s*ai/i;
    const COMPLIMENT_6 = /obsessed\s*with\s*you/i;
    if (COMPLIMENT.test(message) || COMPLIMENT_2.test(message) || COMPLIMENT_3.test(message) || COMPLIMENT_4.test(message) || COMPLIMENT_5.test(message) || COMPLIMENT_6.test(message)) return 'compliment';

    const FLIRT = /you'?re?\s*(so\s*)?(cute|hot|pretty|beautiful|sexy|attractive)/i;
    const FLIRT_2 = /do\s*you\s*(like|love)\s*me/i;
    const FLIRT_3 = /are\s*you\s*(single|taken|dating)/i;
    const FLIRT_4 = /will\s*you\s*(be\s*my|marry|date)/i;
    const FLIRT_5 = /i\s*(like|love|fancy)\s*you/i;
    const FLIRT_6 = /you\s*up\?/i;
    if (FLIRT.test(message) || FLIRT_2.test(message) || FLIRT_3.test(message) || FLIRT_4.test(message) || FLIRT_5.test(message) || FLIRT_6.test(message)) return 'flirt';

    const FRUSTRATION = /(this|it)\s*(is\s*)?(broken|not\s*working|sucks|terrible)/i;
    const FRUSTRATION_2 = /(why\s*)?(isn'?t|won'?t|doesn'?t)\s*this\s*work/i;
    const FRUSTRATION_3 = /^(ugh|argh|damn|wtf|omg\s*no|seriously)/i;
    const FRUSTRATION_4 = /i'?m?\s*(so\s*)?(frustrated|annoyed|angry|mad)/i;
    const FRUSTRATION_5 = /this\s*is\s*(so\s*)?(stupid|useless|trash)/i;
    if (FRUSTRATION.test(message) || FRUSTRATION_2.test(message) || FRUSTRATION_3.test(message) || FRUSTRATION_4.test(message) || FRUSTRATION_5.test(message)) return 'frustration';

    const QUESTION_ABOUT_RHILEY = /who\s*(are|r)\s*you/i;
    const QUESTION_ABOUT_RHILEY_2 = /what\s*(are|r)\s*you/i;
    const QUESTION_ABOUT_RHILEY_3 = /tell\s*me\s*about\s*yourself/i;
    const QUESTION_ABOUT_RHILEY_4 = /are\s*you\s*(an\s*)?ai/i;
    const QUESTION_ABOUT_RHILEY_5 = /are\s*you\s*(real|human|alive)/i;
    const QUESTION_ABOUT_RHILEY_6 = /what\s*can\s*you\s*do/i;
    const QUESTION_ABOUT_RHILEY_7 = /how\s*do\s*you\s*work/i;
    if (QUESTION_ABOUT_RHILEY.test(message) || QUESTION_ABOUT_RHILEY_2.test(message) || QUESTION_ABOUT_RHILEY_3.test(message) || QUESTION_ABOUT_RHILEY_4.test(message) || QUESTION_ABOUT_RHILEY_5.test(message) || QUESTION_ABOUT_RHILEY_6.test(message) || QUESTION_ABOUT_RHILEY_7.test(message)) return 'question_about_rhiley';

    const BORED = /i'?m?\s*(so\s*)?(bored|tired|sleepy)/i;
    const BORED_2 = /nothing\s*to\s*do/i;
    const BORED_3 = /entertain\s*me/i;
    const BORED_4 = /talk\s*to\s*me/i;
    const BORED_5 = /keep\s*me\s*company/i;
    if (BORED.test(message) || BORED_2.test(message) || BORED_3.test(message) || BORED_4.test(message) || BORED_5.test(message)) return 'bored';

    const THANKS = /^(thanks|thank\s*you|thx|ty|cheers|appreciate)/i;
    const THANKS_2 = /that\s*(was\s*)?(helpful|perfect|great|amazing)/i;
    const THANKS_3 = /you\s*(really\s*)?helped/i;
    if (THANKS.test(message) || THANKS_2.test(message) || THANKS_3.test(message)) return 'thanks';

    const INSULT = /you\s*(are\s*)?(stupid|dumb|useless|trash|horrible|terrible|worst)/i;
    const INSULT_2 = /worst\s*ai/i;
    const INSULT_3 = /hate\s*you/i;
    const INSULT_4 = /you\s*suck/i;
    if (INSULT.test(message) || INSULT_2.test(message) || INSULT_3.test(message) || INSULT_4.test(message)) return 'insult';

    return 'task';
}
