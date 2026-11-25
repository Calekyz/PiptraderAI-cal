// server/engine/inversion.ts
// Final-output inversion layer. Does NOT touch analysis.
// Supports both shapes used in this codebase:
//   - Engine signal: { direction: 'BUY'|'SELL', entry, stopLoss, takeProfit1/2, ... }
//   - Bridge payload: { side: 'buy'|'sell', sl, tp, entry?, action }

type Direction = "BUY" | "SELL" | "WAIT" | string;

export interface EngineSignal {
  direction: Direction;
  entry?: number;
  stopLoss?: number;
  takeProfit1?: number;
  takeProfit2?: number;
  slPips?: number;
  tp1Pips?: number;
  tp2Pips?: number;
  source?: string;
  meta?: Record<string, any>;
  [key: string]: any;
}

export interface BridgePayload {
  action?: "open" | "close" | "modify";
  side?: "buy" | "sell" | string;
  entry?: number;
  sl?: number;
  tp?: number;
  source?: string;
  meta?: Record<string, any>;
  [key: string]: any;
}

export interface InversionConfig {
  enabled: boolean;
  mode: "shadow" | "live";
  scope: string[];
  killSwitch: boolean;
}

export function getInversionConfig(): InversionConfig {
  const scopeRaw = (process.env.INVERSION_SCOPE || "source:news").trim();
  const scope = scopeRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^source:/i, "").toLowerCase());

  return {
    enabled:
      String(process.env.INVERT_NEWS_SIGNALS || "false").toLowerCase() === "true",
    mode:
      String(process.env.INVERSION_MODE || "shadow").toLowerCase() === "live"
        ? "live"
        : "shadow",
    scope,
    killSwitch:
      String(process.env.INVERSION_KILL_SWITCH || "false").toLowerCase() === "true",
  };
}

function inScope(src: string | undefined, cfg: InversionConfig): boolean {
  if (!cfg.scope.length) return false;
  const s = String(src || "").toLowerCase();
  return cfg.scope.some((x) => s.includes(x));
}

function mirror(entry: number, level: number): number {
  return 2 * entry - level;
}

function logShadow(tag: string, orig: any, inv: any) {
  console.log(`[inversion:shadow:${tag}]`, {
    original: orig,
    would_emit: inv,
  });
}

/** Invert an engine signal (from analyzeMarket / scanSymbols / news path). */
export function invertEngineSignal<T extends EngineSignal>(sig: T, sourceOverride?: string): T {
  const cfg = getInversionConfig();
  if (!cfg.enabled || cfg.killSwitch) return sig;

  const src = sourceOverride ?? sig.source;
  if (!inScope(src, cfg)) return sig;

  const dir = String(sig.direction || "").toUpperCase();
  if (dir !== "BUY" && dir !== "SELL") return sig;

  const entry = Number(sig.entry);
  if (!Number.isFinite(entry)) return sig;

  const newDirection = dir === "BUY" ? "SELL" : "BUY";

  const inverted: T = {
    ...sig,
    direction: newDirection,
    stopLoss: Number.isFinite(Number(sig.stopLoss)) ? mirror(entry, Number(sig.stopLoss)) : sig.stopLoss,
    takeProfit1: Number.isFinite(Number(sig.takeProfit1)) ? mirror(entry, Number(sig.takeProfit1)) : sig.takeProfit1,
    takeProfit2: Number.isFinite(Number(sig.takeProfit2)) ? mirror(entry, Number(sig.takeProfit2)) : sig.takeProfit2,
    // pips are unsigned distances — do NOT negate
    meta: {
      ...(sig.meta || {}),
      inversion_applied: true,
      original_direction: dir,
      original_sl: sig.stopLoss,
      original_tp1: sig.takeProfit1,
      original_tp2: sig.takeProfit2,
    },
  };

  if (cfg.mode === "shadow") {
    logShadow("engine", {
      direction: sig.direction, entry, sl: sig.stopLoss, tp1: sig.takeProfit1, tp2: sig.takeProfit2,
    }, {
      direction: inverted.direction, entry, sl: inverted.stopLoss, tp1: inverted.takeProfit1, tp2: inverted.takeProfit2,
    });
    return sig;
  }
  console.log(`[inversion:live:engine] ${sig.direction}->${newDirection} ${sig.symbol ?? ""}`);
  return inverted;
}

/** Invert a bridge payload going to the EA. Requires entry for correct SL/TP mirror. */
export function invertBridgePayload<T extends BridgePayload>(p: T, sourceOverride?: string): T {
  const cfg = getInversionConfig();
  if (!cfg.enabled || cfg.killSwitch) return p;

  // Never invert closes/modifies — only opens
  if (p.action && p.action !== "open") return p;

  const src = sourceOverride ?? p.source;
  if (!inScope(src, cfg)) return p;

  const side = String(p.side || "").toLowerCase();
  if (side !== "buy" && side !== "sell") return p;

  const newSide = side === "buy" ? "sell" : "buy";
  const entry = Number(p.entry);

  if (!Number.isFinite(entry)) {
    console.warn("[inversion] bridge payload missing entry — inverting side only, SL/TP untouched");
    return { ...p, side: newSide, meta: { ...(p.meta || {}), inversion_applied: true, warning: "no_entry" } } as T;
  }

  const inverted: T = {
    ...p,
    side: newSide,
    sl: Number.isFinite(Number(p.sl)) ? mirror(entry, Number(p.sl)) : p.sl,
    tp: Number.isFinite(Number(p.tp)) ? mirror(entry, Number(p.tp)) : p.tp,
    meta: {
      ...(p.meta || {}),
      inversion_applied: true,
      original_side: side,
      original_sl: p.sl,
      original_tp: p.tp,
    },
  };

  if (cfg.mode === "shadow") {
    logShadow("bridge", { side, entry, sl: p.sl, tp: p.tp }, { side: newSide, entry, sl: inverted.sl, tp: inverted.tp });
    return p;
  }
  console.log(`[inversion:live:bridge] ${side}->${newSide}`);
  return inverted;
}
