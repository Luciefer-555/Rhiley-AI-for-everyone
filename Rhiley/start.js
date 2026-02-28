#!/usr/bin/env node

const { spawn, exec } = require("child_process");
const http = require("http");
const path = require("path");
const os = require("os");

// ── ROOT of the Rhiley monorepo ──────────────────────────
const ROOT = __dirname;

// ── CONFIG ───────────────────────────────────────────────
const CONFIG = {
    ollama: {
        host: "localhost",
        port: 11434,
    },
    models: [
        { id: "llava", label: "LLaVA Vision", emoji: "👁️ " },
        { id: "llama3", label: "LLaMA 3", emoji: "🦙" },
        { id: "deepseek-coder", label: "DeepSeek Coder", emoji: "🐋" },
        { id: "qwen2", label: "Qwen 2", emoji: "🌟" },
    ],
    services: [
        {
            name: "Blueprint API",
            emoji: "🔧",
            cwd: path.join(ROOT, "Backend", "engine"),
            cmd: "node",
            args: ["server.js"],
            port: 3000,
            node: true,   // pure node, no npm run needed
            check: "/health",
        },
        {
            name: "Design Engine API",
            emoji: "⚙️ ",
            cwd: path.join(ROOT, "Backend", "design-engine"),
            cmd: "node",
            args: ["server.js"],
            port: 3002,
            node: true,
            check: "/health",
        },
        {
            name: "Backend Vite UI",
            emoji: "⚡",
            cwd: path.join(ROOT, "Backend"),
            cmd: "npm",
            args: ["run", "dev"],
            port: 5173,
            check: "/",
        },

        {
            name: "Chat (Next.js)",
            emoji: "💬",
            cwd: path.join(ROOT, "chat"),
            cmd: "npm",
            args: ["run", "dev", "--", "--port", "3003"],
            port: 3003,
            check: "/",
        },
        {
            name: "Frontend (Next.js)",
            emoji: "🎨",
            cwd: path.join(ROOT, "Frontend"),
            cmd: "npm",
            args: ["run", "dev", "--", "--port", "3004"],
            port: 3004,
            check: "/",
        },
    ],
    browser: {
        url: "http://localhost:3004",   // ✅ CHANGED: Start strictly at the 3004 Landing page
        auto: true,
    },
    timeouts: {
        ollama: 30000,
        service: 90000,   // Next.js can take a while on first run
        poll: 800,
    },
};

// ── ANSI COLORS ───────────────────────────────────────────
const C = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    violet: "\x1b[35m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    white: "\x1b[97m",
    blue: "\x1b[34m",
    pink: "\x1b[95m",
    gray: "\x1b[90m",
};

const ok = (msg) => console.log(`${C.green}  ✓${C.reset}  ${msg}`);
const fail = (msg) => console.log(`${C.red}  ✗${C.reset}  ${msg}`);
const wait = (msg) => console.log(`${C.yellow}  ◌${C.reset}  ${msg}`);
const info = (msg) => console.log(`${C.cyan}  →${C.reset}  ${msg}`);
const dim = (msg) => console.log(`${C.gray}     ${msg}${C.reset}`);
const fatal = (msg) => console.log(`\n${C.red}${C.bold}  FATAL:${C.reset} ${msg}\n`);
const phase = (n, label) => console.log(`\n  ${C.violet}${C.bold}[Phase ${n}]${C.reset} ${C.bold}${label}${C.reset}\n  ${"─".repeat(44)}`);
const sep = () => console.log(`  ${"─".repeat(48)}`);

// ── BANNER ────────────────────────────────────────────────
function printBanner() {
    console.clear();
    console.log(`
${C.violet}${C.bold}
  ██████╗ ██╗  ██╗██╗██╗     ███████╗██╗   ██╗
  ██╔══██╗██║  ██║██║██║     ██╔════╝╚██╗ ██╔╝
  ██████╔╝███████║██║██║     █████╗   ╚████╔╝
  ██╔══██╗██╔══██║██║██║     ██╔══╝    ╚██╔╝
  ██║  ██║██║  ██║██║███████╗███████╗   ██║
  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝   ╚═╝
${C.reset}
  ${C.cyan}${C.bold}AI-Powered Frontend Studio${C.reset}  ${C.gray}v1.0.0  •  Master Launcher${C.reset}
  ${C.gray}Powered by LLaVA · LLaMA · DeepSeek · Qwen${C.reset}
  ${"═".repeat(50)}
`);
}

// ── PROCESS REGISTRY ─────────────────────────────────────
const procs = [];

function killAll() {
    procs.forEach(p => {
        try { p.kill("SIGTERM"); } catch (_) { }
    });
}

process.on("SIGINT", () => {
    console.log(`\n\n${C.yellow}${C.bold}  Shutting down Rhiley — stopping all servers...${C.reset}\n`);
    killAll();
    process.exit(0);
});
process.on("SIGTERM", () => { killAll(); process.exit(0); });
process.on("uncaughtException", (err) => {
    fatal(err.message);
    killAll();
    process.exit(1);
});

// ── SPINNER ───────────────────────────────────────────────
function spinner(label) {
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let i = 0;
    const iv = setInterval(() => {
        process.stdout.write(`\r  ${C.cyan}${frames[i++ % frames.length]}${C.reset}  ${label}   `);
    }, 80);
    return () => {
        clearInterval(iv);
        process.stdout.write("\r" + " ".repeat(72) + "\r");
    };
}

// ── HTTP POLL ─────────────────────────────────────────────
function waitForServer(host, port, checkPath, timeoutMs, label) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const iv = setInterval(() => {
            const req = http.request(
                { host, port, path: checkPath, method: "GET", timeout: 1500 },
                (res) => { clearInterval(iv); resolve(); }
            );
            req.on("error", () => {
                if (Date.now() - start > timeoutMs) {
                    clearInterval(iv);
                    reject(new Error(`${label} did not respond within ${timeoutMs / 1000}s (port ${port})`));
                }
            });
            req.end();
        }, CONFIG.timeouts.poll);
    });
}

// ── RUN COMMAND → STDOUT STRING ───────────────────────────
function runCmd(cmd, args = []) {
    return new Promise((resolve, reject) => {
        const p = spawn(cmd, args, { shell: true });
        let out = "";
        p.stdout.on("data", d => out += d.toString());
        p.stderr.on("data", d => out += d.toString());
        p.on("close", code => code === 0 ? resolve(out.trim()) : reject(new Error(out.trim())));
    });
}

// ── OPEN BROWSER ──────────────────────────────────────────
function openBrowser(url) {
    const platform = os.platform();
    const cmd =
        platform === "win32" ? `start "" "${url}"` :
            platform === "darwin" ? `open "${url}"` :
                `xdg-open "${url}"`;
    exec(cmd);
}

// ── SPAWN A SERVICE ───────────────────────────────────────
function spawnService(svc) {
    const p = spawn(svc.cmd, svc.args, {
        cwd: svc.cwd,
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
    });
    procs.push(p);

    // Only surface real errors to avoid spamming
    p.stderr.on("data", (d) => {
        const line = d.toString().trim();
        if (line && (line.toLowerCase().includes("error") || line.toLowerCase().includes("failed"))) {
            dim(`[${svc.name}] ${line}`);
        }
    });
    return p;
}

// ── MAIN BOOT SEQUENCE ───────────────────────────────────
async function boot() {
    printBanner();

    // ── PHASE 1 already done (banner) ───────────────────────

    // ── PHASE 2: Node.js version ────────────────────────────
    phase(2, "Checking Environment");
    const nodeVer = parseInt(process.versions.node.split(".")[0], 10);
    if (nodeVer < 18) {
        fatal(`Node.js 18+ required. You have v${process.versions.node}. Please upgrade at https://nodejs.org`);
        process.exit(1);
    }
    ok(`Node.js v${process.versions.node} detected`);

    // ── PHASE 3: Check Ollama installed ─────────────────────
    phase(3, "Checking Ollama Installation");
    try {
        const ver = await runCmd("ollama", ["--version"]);
        ok(`Ollama installed — ${ver}`);
    } catch {
        fatal(
            "Ollama is not installed or not in PATH.\n" +
            "  Install it from: https://ollama.ai and restart this script."
        );
        process.exit(1);
    }

    // ── PHASE 4: Start ollama serve ─────────────────────────
    phase(4, "Starting Ollama Server");
    wait("Spawning ollama serve...");

    const ollamaProc = spawn("ollama", ["serve"], {
        stdio: ["ignore", "pipe", "pipe"],
        shell: os.platform() === "win32",
        detached: false,
    });
    procs.push(ollamaProc);
    ollamaProc.stderr.on("data", () => { }); // suppress noisy stderr

    // ── PHASE 5: Wait for Ollama ─────────────────────────────
    phase(5, "Waiting for Ollama on :11434");
    const stopOllama = spinner("Waiting for Ollama server...");
    try {
        await waitForServer("localhost", CONFIG.ollama.port, "/", CONFIG.timeouts.ollama, "Ollama");
        stopOllama();
        ok(`Ollama is live → http://localhost:${CONFIG.ollama.port}`);
    } catch (err) {
        stopOllama();
        fatal(`Phase 5 — ${err.message}`);
        killAll();
        process.exit(1);
    }

    // ── PHASE 6: Verify / Pull models ────────────────────────
    phase(6, "Verifying AI Models");

    let listedModels = "";
    try { listedModels = await runCmd("ollama", ["list"]); } catch { listedModels = ""; }

    for (const model of CONFIG.models) {
        const isPresent = listedModels.toLowerCase().includes(model.id.toLowerCase());
        if (isPresent) {
            ok(`${model.emoji}  ${model.label.padEnd(18)} ready`);
        } else {
            wait(`${model.emoji}  ${model.label.padEnd(18)} not found — pulling...`);
            const stopPull = spinner(`Pulling ${model.label} from Ollama registry...`);
            try {
                await runCmd("ollama", ["pull", model.id]);
                stopPull();
                ok(`${model.emoji}  ${model.label.padEnd(18)} pulled successfully`);
            } catch (err) {
                stopPull();
                fail(`${model.emoji}  ${model.label.padEnd(18)} pull failed → ${err.message.slice(0, 80)}`);
                dim(`Rhiley will continue — ${model.label} may be unavailable`);
            }
        }
    }

    // ── PHASE 7: Start all Rhiley services ───────────────────
    phase(7, "Launching Rhiley Services");

    for (const svc of CONFIG.services) {
        wait(`${svc.emoji}  Starting ${svc.name} on port ${svc.port}...`);
        spawnService(svc);
    }

    // ── PHASE 8: Wait for all services to be ready ───────────
    phase(8, "Waiting for Services to Come Online");

    for (const svc of CONFIG.services) {
        const stopSpin = spinner(`${svc.name} (port ${svc.port})...`);
        try {
            await waitForServer("localhost", svc.port, svc.check, CONFIG.timeouts.service, svc.name);
            stopSpin();
            ok(`${svc.emoji}  ${svc.name.padEnd(22)} → http://localhost:${svc.port}`);
        } catch (err) {
            stopSpin();
            fail(`Phase 8 — ${svc.name}: ${err.message}`);
            dim(`Skipping ${svc.name} — check logs above for errors`);
        }
    }

    // ── PHASE 9: Open browser ────────────────────────────────
    phase(9, "Opening Browser");
    if (CONFIG.browser.auto) {
        openBrowser(CONFIG.browser.url);
        ok(`Browser opened → ${CONFIG.browser.url}`);
    } else {
        info(`Open your browser to ${CONFIG.browser.url}`);
    }

    // ── PHASE 10: Live dashboard ──────────────────────────────
    console.log(`
${C.green}${C.bold}
  ╔══════════════════════════════════════════════════╗
  ║       🚀  RHILEY IS FULLY RUNNING                ║
  ╠══════════════════════════════════════════════════╣
  ║                                                  ║
  ║   MANDATORY USER FLOW:                           ║
  ║   1️⃣   Frontend      →  http://localhost:3004     ║
  ║   2️⃣   Chat          →  http://localhost:3003     ║
  ║                                                  ║
  ║   BACKEND SERVICES:                              ║
  ║   ⚡  Backend UI    →  http://localhost:5173     ║
  ║   🔧  Blueprint API →  http://localhost:3000     ║
  ║   ⚙️   Design Engine →  http://localhost:3002     ║
  ║   🤖  Ollama        →  http://localhost:11434    ║
  ║                                                  ║
  ║   👁️   LLaVA Vision   ·  🦙 LLaMA 3              ║
  ║   🐋  DeepSeek Coder ·  🌟 Qwen 2               ║
  ║                                                  ║
  ║   Press  Ctrl+C  to stop everything cleanly      ║
  ╚══════════════════════════════════════════════════╝
${C.reset}`);

    // Stream frontend logs so process stays alive
    for (const svc of CONFIG.services) {
        const p = procs.find(
            (_, i) => CONFIG.services[i] && CONFIG.services[i].name === svc.name
        );
    }

    // Keep alive — stream any stdout from all services
    procs.forEach((p, i) => {
        const label = i === 0 ? "ollama" : CONFIG.services[i - 1] ? CONFIG.services[i - 1].name : "service";
        p.stdout && p.stdout.on("data", (d) => {
            const line = d.toString().trim();
            if (line && process.env.RHILEY_VERBOSE) dim(`[${label}] ${line}`);
        });
    });
}

// ── FIRE ─────────────────────────────────────────────────
boot().catch((err) => {
    fatal(err.message);
    killAll();
    process.exit(1);
});
