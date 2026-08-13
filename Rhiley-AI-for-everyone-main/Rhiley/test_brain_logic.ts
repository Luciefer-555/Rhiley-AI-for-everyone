// Manual test script — run in terminal to verify brain logic

import { addSkill, buildBrainContext, getBrain, rollbackBrain, resetBrain } from "./chat/lib/brainManager";
import { isRewireCommand } from "./chat/lib/rewireDetector";

function assert(condition: boolean, label: string) {
    if (condition) {
        console.log(`  ✅ ${label}`);
    } else {
        console.log(`  ❌ FAIL: ${label}`);
        process.exit(1);
    }
}

async function runTests() {
    console.log("\n🧠 RHILEY BRAIN TESTS\n");
    resetBrain();

    // Test 1 — Add new skill
    console.log("Test 1: Add new skill");
    const { skill, wasReinforced } = addSkill({
        name: "GSAP Expert",
        trigger: ["gsap", "scroll", "greensock"],
        systemInject: "Use GSAP ScrollTrigger for scroll animations",
        codePatterns: [],
        libraries: ["gsap"]
    });
    assert(!wasReinforced, "New skill — wasReinforced should be false");
    assert(skill.trainCount === 1, "New skill — trainCount should be 1");
    assert(getBrain().skills.length === 1, "Brain should have 1 skill");

    // Test 2 — Reinforce same skill
    console.log("\nTest 2: Reinforce same skill");
    const { skill: r, wasReinforced: wr } = addSkill({
        name: "GSAP Expert",
        trigger: ["gsap"],
        systemInject: "Updated instructions",
        codePatterns: [],
        libraries: ["gsap"]
    });
    assert(wr, "Reinforce — wasReinforced should be true");
    assert(r.trainCount === 2, "Reinforce — trainCount should be 2");
    assert(getBrain().skills.length === 1, "Brain should still have 1 skill");

    // Test 3 — Context injection
    console.log("\nTest 3: Context injection");
    const ctx = buildBrainContext("build a gsap scroll animation");
    // console.log("Context output:", ctx);
    assert(ctx.includes("GSAP Expert"), "Context should include GSAP skill");
    assert(ctx.includes("RHILEY CORE"), "Context should include core rules");

    // Test 4 — No injection for unrelated message
    console.log("\nTest 4: No injection for unrelated message");
    const ctx2 = buildBrainContext("what is the weather today");
    // console.log("Unrelated Context output:", ctx2);
    const includesGSAP = ctx2.includes("GSAP Expert");
    if (includesGSAP) {
        console.log("Error: Context unexpectedly included 'GSAP Expert'");
        console.log("Context was:", ctx2);
    }
    assert(!includesGSAP, "GSAP skill should NOT inject for unrelated message");

    // Test 5 — Max 3 skills injected
    console.log("\nTest 5: Max 3 skills injected");
    ["Skill A", "Skill B", "Skill C", "Skill D"].forEach((name, i) => {
        addSkill({ name, trigger: [`keyword${i}`, "common"], systemInject: `Instructions for ${name}`, codePatterns: [], libraries: [] });
    });
    const ctx3 = buildBrainContext("common keyword0 keyword1 keyword2 keyword3");
    const matches = ctx3.match(/###/g);
    const skillMatches = matches ? matches.length : 0;
    console.log(`Found ${skillMatches} skill matches`);
    assert(skillMatches <= 3, `Max 3 skills injected — got ${skillMatches}`);

    // Test 6 — Rollback
    console.log("\nTest 6: Rollback");
    const beforeCount = getBrain().skills.length;
    console.log(`Skills before adding temp: ${beforeCount}`);
    addSkill({ name: "Temp Skill", trigger: ["temp"], systemInject: "temp", codePatterns: [], libraries: [] });
    console.log(`Skills after adding temp: ${getBrain().skills.length}`);
    const { success, message } = rollbackBrain();
    console.log(`Rollback result: ${success} - ${message}`);
    assert(success, "Rollback should succeed");
    const afterCount = getBrain().skills.length;
    console.log(`Skills after rollback: ${afterCount}`);
    assert(afterCount === beforeCount, "Skills count should be restored");

    // Test 7 — Rewire detection
    console.log("\nTest 7: Rewire detection");
    assert(isRewireCommand("rewire yourself to be better at 3D"), "Detects 'rewire yourself'");
    assert(isRewireCommand("train yourself to write better animations"), "Detects 'train yourself'");
    assert(isRewireCommand("get better at glassmorphism"), "Detects 'get better at'");
    assert(!isRewireCommand("build me a landing page"), "Normal message not detected");
    assert(!isRewireCommand("what is framer motion"), "Question not detected");

    // Test 8 — systemInject trimmed to 800 chars
    console.log("\nTest 8: systemInject trimmed");
    const longInject = "x".repeat(2000);
    const { skill: trimmed } = addSkill({ name: "Long Skill", trigger: ["long"], systemInject: longInject, codePatterns: [], libraries: [] });
    console.log(`Trimmed length: ${trimmed.systemInject.length}`);
    assert(trimmed.systemInject.length <= 800, "systemInject trimmed to max 800 chars");

    console.log("\n✅ ALL TESTS PASSED\n");
}

runTests().catch(err => {
    console.error("Unhandle test error:", err);
    process.exit(1);
});
