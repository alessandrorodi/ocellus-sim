import { loadPage } from "./page";

function drawRandomSeeds(values: readonly number[]) {
  const queue = [...values];
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: {
      getRandomValues: (array: Uint32Array) => {
        array[0] = queue.shift() ?? 0;
        return array;
      },
    },
  });
}

function captureNavigation() {
  const real = window.location;
  const assigned: string[] = [];
  Object.defineProperty(window, "location", { configurable: true, value: { get href() { return real.href; }, assign: (url: string) => void assigned.push(url) } });
  return { assigned, restore: () => Object.defineProperty(window, "location", { configurable: true, value: real }) };
}

const runSeed = () => window.__archiveOcellusProbe?.log().header.seed ?? null;

describe("Seed per run", () => {
  beforeEach(() => localStorage.setItem("osrs-sdk:settings", JSON.stringify({ version: 1, values: { use3dView: false } })));

  test("a run without a typed seed draws a fresh one and shows it, and Restart replays a seed only when one is typed, even the one already shown", () => {
    drawRandomSeeds([4242, 77, 55]);
    const navigation = captureNavigation();

    const first = loadPage("/");
    const firstRun = [first.value("seed"), runSeed()];
    first.click("restart");
    first.close();

    const second = loadPage(navigation.assigned[0]);
    const secondRun = [second.value("seed"), runSeed()];
    second.type("seed", "4242");
    second.click("restart");
    second.close();

    const third = loadPage(navigation.assigned[1]);
    const thirdRun = [third.value("seed"), runSeed()];
    third.type("seed", "4242");
    third.click("restart");
    third.close();
    navigation.restore();

    expect({ firstRun, secondRun, thirdRun, navigation: navigation.assigned }).toEqual({
      firstRun: ["4242", 4242],
      secondRun: ["77", 77],
      thirdRun: ["4242", 4242],
      navigation: [
        "http://localhost/?setup=ranged&focus=full-fight",
        "http://localhost/?setup=ranged&focus=full-fight&seed=4242",
        "http://localhost/?setup=ranged&focus=full-fight&seed=4242",
      ],
    });
  });
});
