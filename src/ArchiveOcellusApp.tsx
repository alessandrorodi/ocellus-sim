import React, { useState } from "react";
import { CacheRender, Settings, TrainerInstance, TrainerLoadingState } from "osrs-sdk";
import { GameOverlay, TrainerApp, TrainerLoadingSplash } from "osrs-sdk-react";
import { OcellusRegion } from "./content/ocellus/js/OcellusRegion";
import type { DrillConfig } from "./content/ocellus/js/OcellusTimings";
import { OCELLUS_P4, parseDrillRequest } from "./content/ocellus/js/OcellusTimings";
import type { FightLog, FightSnapshot } from "./content/ocellus/js/P4Types";

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
}>;

function exposeVerificationProbe(trainer: TrainerInstance, region: OcellusRegion, rejected: readonly string[]) {
  window.__archiveOcellusProbe = Object.freeze({
    snapshot(): VerificationProbeSnapshot {
      const { player, world } = trainer.getSnapshot();
      return {
        ticking: !world.isPaused,
        tick: world.globalTickCounter,
        player: player ? { x: player.location.x, y: player.location.y } : null,
        destination: player?.destinationLocation ? { x: player.destinationLocation.x, y: player.destinationLocation.y } : null,
        fight: region.snapshot(),
        rejected,
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
  return { trainer, config };
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
        Seed <input id="seed" inputMode="numeric" value={seed} onChange={(event) => setSeed(event.target.value)} />
      </label>
      <button id="restart" type="submit">Restart</button>
    </form>
  );
}

export function ArchiveOcellusApp() {
  const [{ trainer, config }] = useState(createTrainer);
  const [loading, setLoading] = useState<TrainerLoadingState>();

  return (
    <TrainerApp trainer={trainer} onLoadingStateChange={setLoading}>
      <GameOverlay>
        <TrainerLoadingSplash state={loading} />
        <DrillControls config={config} />
        <p id="credit_line">{CREDIT_LINE}</p>
      </GameOverlay>
    </TrainerApp>
  );
}
