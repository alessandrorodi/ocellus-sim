import React, { useEffect, useState } from "react";
import { CacheRender, ControlPanelController, Settings, TrainerInstance, TrainerLoadingState, Viewport } from "osrs-sdk";
import type { Item } from "osrs-sdk";
import { GameOverlay, TrainerApp, TrainerLoadingSplash } from "osrs-sdk-react";
import { OcellusRegion } from "./content/ocellus/js/OcellusRegion";
import type { DrillConfig } from "./content/ocellus/js/OcellusTimings";
import { OCELLUS_P4, parseDrillRequest } from "./content/ocellus/js/OcellusTimings";
import type { FightLog, FightSnapshot } from "./content/ocellus/js/P4Types";
import { keepHoverTextOnCanvas } from "./hoverText";

keepHoverTextOnCanvas();

export const CREDIT_LINE =
  "Created using intellectual property belonging to Jagex Limited under the terms of Jagex's Fan Content Policy. This content is not endorsed by or affiliated with Jagex.";

declare global {
  interface Window {
    __archiveOcellusProbe?: Readonly<{ snapshot(): VerificationProbeSnapshot; log(): FightLog }>;
  }
}

type VerificationProbeSnapshot = Readonly<{
  ticking: boolean;
  tick: number;
  player: Readonly<{ x: number; y: number }> | null;
  destination: Readonly<{ x: number; y: number }> | null;
  fight: FightSnapshot | null;
  rejected: readonly string[];
  panel: Readonly<{ tab: string | null; keys: Readonly<Record<"inventory" | "spellbook" | "prayer" | "equipment" | "combat", string>> }>;
  menu: readonly string[] | null;
  icons: Readonly<Record<string, Readonly<{ path: string; size: string }>>>;
}>;

function drawnIcons(items: readonly (Item | null | undefined)[]): VerificationProbeSnapshot["icons"] {
  return Object.fromEntries(
    items.flatMap((item) => {
      if (!item || typeof item.cacheItemId !== "number" || !(item.inventorySprite instanceof HTMLImageElement)) return [];
      const { src, naturalWidth, naturalHeight } = item.inventorySprite;
      return [[item.cacheItemId, { path: new URL(src).pathname, size: `${naturalWidth}x${naturalHeight}` }]];
    }),
  );
}

function exposeVerificationProbe(trainer: TrainerInstance, region: OcellusRegion, rejected: readonly string[]) {
  window.__archiveOcellusProbe = Object.freeze({
    snapshot(): VerificationProbeSnapshot {
      const { player, world } = trainer.getSnapshot();
      const { contextMenu } = Viewport.viewport;
      return {
        ticking: !world.isPaused,
        tick: world.globalTickCounter,
        player: player ? { x: player.location.x, y: player.location.y } : null,
        destination: player?.destinationLocation ? { x: player.destinationLocation.x, y: player.destinationLocation.y } : null,
        fight: region.snapshot(),
        rejected,
        panel: {
          tab: Object.entries(ControlPanelController.controls).find(([, control]) => control === ControlPanelController.controller.selectedControl)?.[0] ?? null,
          keys: { inventory: Settings.inventory_key, spellbook: Settings.spellbook_key, prayer: Settings.prayer_key, equipment: Settings.equipment_key, combat: Settings.combat_key },
        },
        menu: contextMenu.isActive ? contextMenu.menuOptions.map((option) => option.text.map((block) => `${block.text}`).join("")) : null,
        icons: player ? drawnIcons([...player.inventory, ...Object.values(player.equipment)]) : {},
      };
    },
    log: () => region.fightLog(),
  });
}

function createTrainer() {
  CacheRender.configure(new URL("osrs-assets/manifest.json", window.location.href).href);
  Settings.readFromStorage();
  const { config, rejected } = parseDrillRequest(new URL(window.location.href), () => crypto.getRandomValues(new Uint32Array(1))[0]);
  const region = new OcellusRegion(config);
  const trainer = new TrainerInstance(region);
  if (process.env.NODE_ENV !== "production") exposeVerificationProbe(trainer, region, rejected);
  return { trainer, region, config };
}

const SETUP_KEYS = Object.keys(OCELLUS_P4.choices.setup.options);
const FOCUS_KEYS = Object.keys(OCELLUS_P4.choices.focus.options);
const label = (key: string) => key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " ");

function DrillControls({ config }: Readonly<{ config: DrillConfig }>) {
  const [setup, setSetup] = useState<string>(config.choices.setup.key);
  const [seed, setSeed] = useState(String(config.seed));
  const restart = (focus: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("setup", setup);
    url.searchParams.set("focus", focus);
    url.searchParams.set("seed", seed);
    window.location.assign(url.href);
  };

  return (
    <form id="drill_controls" onSubmit={(event) => { event.preventDefault(); restart(config.choices.focus.key); }}>
      <label>
        Setup{" "}
        <select id="setup" value={setup} onChange={(event) => setSetup(event.target.value)}>
          {SETUP_KEYS.map((key) => <option key={key} value={key}>{label(key)}</option>)}
        </select>
      </label>
      <label>
        Focus{" "}
        <select id="focus" value={config.choices.focus.key} onChange={(event) => restart(event.target.value)}>
          {FOCUS_KEYS.map((key) => <option key={key} value={key}>{label(key)}</option>)}
        </select>
      </label>
      <label>
        Seed <input id="seed" inputMode="numeric" value={seed} onChange={(event) => setSeed(event.target.value)} onKeyDown={(event) => event.stopPropagation()} />
      </label>
      <button id="restart" type="submit">Restart</button>
      <button id="keybinds" type="button" onClick={() => ControlPanelController.controller.setActiveControl("SETTINGS")}>Keybinds</button>
    </form>
  );
}

const CHAT_LINES_SHOWN = 5;
const CHAT_POLL_MS = 300;

function GameChat({ region }: Readonly<{ region: OcellusRegion }>) {
  const [lines, setLines] = useState<readonly string[]>([]);
  useEffect(() => {
    const poll = window.setInterval(() => setLines((shown) => {
      const latest = region.chat();
      return latest.length === shown.length ? shown : latest;
    }), CHAT_POLL_MS);
    return () => window.clearInterval(poll);
  }, [region]);

  return (
    <ol id="game_chat">
      {lines.slice(-CHAT_LINES_SHOWN).map((line, index) => <li key={index}>{line}</li>)}
    </ol>
  );
}

export function ArchiveOcellusApp() {
  const [{ trainer, region, config }] = useState(createTrainer);
  const [loading, setLoading] = useState<TrainerLoadingState>();

  return (
    <TrainerApp trainer={trainer} onLoadingStateChange={setLoading}>
      <GameOverlay>
        <TrainerLoadingSplash state={loading} />
        <GameChat region={region} />
        <DrillControls config={config} />
        <p id="credit_line">{CREDIT_LINE}</p>
      </GameOverlay>
    </TrainerApp>
  );
}
