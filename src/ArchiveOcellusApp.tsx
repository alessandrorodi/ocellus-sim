import React, { useState } from "react";
import { CacheRender, Settings, TrainerInstance, TrainerLoadingState } from "osrs-sdk";
import { GameOverlay, TrainerApp, TrainerLoadingSplash } from "osrs-sdk-react";
import { OcellusRegion } from "./content/ocellus/js/OcellusRegion";

export const CREDIT_LINE =
  "Created using intellectual property belonging to Jagex Limited under the terms of Jagex's Fan Content Policy. This content is not endorsed by or affiliated with Jagex.";

declare global {
  interface Window {
    __archiveOcellus?: { snapshot(): ArchiveOcellusSnapshot };
  }
}

type ArchiveOcellusSnapshot = {
  ticking: boolean;
  tick: number;
  player: { x: number; y: number } | null;
  destination: { x: number; y: number } | null;
};

function exposeReadOnlyState(trainer: TrainerInstance) {
  window.__archiveOcellus = Object.freeze({
    snapshot(): ArchiveOcellusSnapshot {
      const { player, world } = trainer.getSnapshot();
      return {
        ticking: !world.isPaused,
        tick: world.globalTickCounter,
        player: player ? { x: player.location.x, y: player.location.y } : null,
        destination: player?.destinationLocation
          ? { x: player.destinationLocation.x, y: player.destinationLocation.y }
          : null,
      };
    },
  });
}

function createTrainer() {
  CacheRender.configure(new URL("osrs-assets/manifest.json", window.location.href).href);
  Settings.readFromStorage();
  const trainer = new TrainerInstance(new OcellusRegion());
  if (process.env.NODE_ENV !== "production") exposeReadOnlyState(trainer);
  return trainer;
}

export function ArchiveOcellusApp() {
  const [trainer] = useState(createTrainer);
  const [loading, setLoading] = useState<TrainerLoadingState>();

  return (
    <TrainerApp trainer={trainer} onLoadingStateChange={setLoading}>
      <GameOverlay>
        <TrainerLoadingSplash state={loading} />
        <p id="credit_line">{CREDIT_LINE}</p>
      </GameOverlay>
    </TrainerApp>
  );
}
