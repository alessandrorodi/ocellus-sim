import { Settings, SoundCache } from "osrs-sdk";
import type { DrillSelection } from "../js/OcellusTimings";
import { startDrill } from "./drill";
import { loadPage } from "./page";

const LIFEFORCE_CHAT = "Ocellus manipulates your lifeforce!";
const SAVED_SETTINGS = "osrs-sdk:settings";

function cuesThrough(lastTick: number, selection: DrillSelection) {
  const drill = startDrill({ selection });
  // SoundCache.play is the SDK's audio output. jsdom has no AudioContext, so the spy reads each sound as it reaches that output.
  const play = jest.spyOn(SoundCache, "play");
  const sounds: [number, string][] = [];
  const chat: [number, string][] = [];
  for (let t = 0; t <= lastTick; t++) {
    const [played, said] = [play.mock.calls.length, drill.region.chat().length];
    drill.tickTo(t);
    sounds.push(...play.mock.calls.slice(played).flatMap(([sound]): [number, string][] => (String(sound.src).startsWith("cache-sound:") ? [[t, sound.src]] : [])));
    chat.push(...drill.region.chat().slice(said).map((line): [number, string] => [t, line]));
  }
  play.mockRestore();
  drill.dispose();
  return { sounds, chat };
}

describe("timing cues", () => {
  test('the "End..." shout plays 12490 at 5, and each flood plays 12497 as it forms, at 39 and 99', () => {
    expect(cuesThrough(100, { focus: "lifeforce-orb" }).sounds).toEqual([
      [5, "cache-sound:12490"],
      [39, "cache-sound:12497"],
      [99, "cache-sound:12497"],
    ]);
  });

  test("the lifeforce tell posts its chat line at 11 and 42, and a drill without the lifeforce posts none", () => {
    expect([cuesThrough(43, { focus: "lifeforce-orb" }).chat, cuesThrough(43, { focus: "explosions" }).chat]).toEqual([
      [[11, LIFEFORCE_CHAT], [42, LIFEFORCE_CHAT]],
      [],
    ]);
  });

  test("the sound toggles load unchecked, turn on the SDK's sound effects and area sounds, and stay on after a reload", () => {
    localStorage.setItem(SAVED_SETTINGS, JSON.stringify({ version: 1, values: { use3dView: false } }));
    const first = loadPage("/?seed=1");
    const loaded = [first.checked("sound"), first.checked("area_sound")];
    first.click("area_sound");
    first.click("sound");
    const saved = JSON.parse(localStorage.getItem(SAVED_SETTINGS) ?? "{}").values;
    first.close();

    Settings.playsAudio = false;
    Settings.playsAreaAudio = false;
    const reloaded = loadPage("/?seed=1");
    const afterReload = [reloaded.checked("sound"), reloaded.checked("area_sound")];
    reloaded.close();

    expect({ loaded, saved: [saved.playsAudio, saved.playsAreaAudio], afterReload }).toEqual({ loaded: [false, false], saved: [true, true], afterReload: [true, true] });
  });
});
