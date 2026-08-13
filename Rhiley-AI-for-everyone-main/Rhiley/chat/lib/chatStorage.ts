// chat/lib/chatStorage.ts

const STORAGE_KEY = "rhiley_sessions";
const MAX_SESSIONS = 50;
const MAX_MESSAGES = 200;

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
    model?: "llava" | "llama3" | "deepseek-coder" | "qwen2";
    hasCode?: boolean;
    code?: string;
    language?: string;
    type?: "text" | "image" | "image-loading";
    imageData?: string;
    mimeType?: string;
    prompt?: string;
    userPrompt?: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
}

// ── READ ─────────────────────────────────────────────────
export function getSessions(): ChatSession[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function getSession(id: string): ChatSession | null {
    return getSessions().find(s => s.id === id) ?? null;
}

// ── WRITE ────────────────────────────────────────────────
export function saveSession(session: ChatSession): void {
    if (typeof window === "undefined") return;
    try {
        let sessions = getSessions().filter(s => s.id !== session.id);
        sessions = [session, ...sessions].slice(0, MAX_SESSIONS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
        console.warn("[Rhiley] Could not save chat history");
    }
}

export function createSession(firstMessage: string): ChatSession {
    return {
        id: crypto.randomUUID(),
        title: firstMessage.slice(0, 40) + (firstMessage.length > 40 ? "..." : ""),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}

export function addMessageToSession(
    sessionId: string,
    message: ChatMessage
): ChatSession | null {
    const session = getSession(sessionId);
    if (!session) return null;

    const updated: ChatSession = {
        ...session,
        messages: [...session.messages, message].slice(-MAX_MESSAGES),
        updatedAt: Date.now(),
    };

    saveSession(updated);
    return updated;
}

export function deleteSession(id: string): void {
    if (typeof window === "undefined") return;
    const sessions = getSessions().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function clearAllSessions(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
}

// ── HELPERS ──────────────────────────────────────────────
export function buildMessage(
    role: "user" | "assistant",
    content: string,
    model?: string,
    extra?: Partial<ChatMessage>
): ChatMessage {
    const codeBlock = extractCodeBlock(content);
    return {
        id: crypto.randomUUID(),
        role,
        content,
        timestamp: Date.now(),
        model: model as ChatMessage["model"],
        hasCode: !!codeBlock,
        code: codeBlock?.code,
        language: codeBlock?.language,
        ...extra
    };
}

function extractCodeBlock(content: string): { code: string; language: string } | null {
    if (typeof content !== 'string') return null;
    const match = content.match(/```(\w+)?\n([\s\S]*?)```/);
    if (!match) return null;
    return {
        language: match[1] ?? "tsx",
        code: match[2].trim(),
    };
}
