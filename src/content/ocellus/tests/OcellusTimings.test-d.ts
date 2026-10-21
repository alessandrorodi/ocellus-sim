import type { ResolvedChoices } from "../js/OcellusTimings";
import { OCELLUS_P4 } from "../js/OcellusTimings";
import type { FightEvent, HitReceipt, Ordinal, Special, Style, Tick } from "../js/P4Types";

// Assignability ignores readonly, so this compares the two types for identity instead.
type Same<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type WritablePaths<T, Path extends string> = T extends string | number | boolean | bigint | symbol | null | undefined
  ? never
  : T extends unknown[]
    ? Path | WritablePaths<T[number], `${Path}[]`>
    : T extends readonly unknown[]
      ? WritablePaths<T[number], `${Path}[]`>
      : {
          [K in keyof T & string]: (Same<Pick<T, K>, Readonly<Pick<T, K>>> extends true ? never : `${Path}.${K}`) | WritablePaths<T[K], `${Path}.${K}`>;
        }[keyof T & string];

type TimingWrites = WritablePaths<typeof OCELLUS_P4, "OCELLUS_P4">;
const timingTablesAreReadonly: [TimingWrites] extends [never] ? true : TimingWrites = true;

type LooseChoice<K extends keyof ResolvedChoices> = Readonly<{ key: ResolvedChoices[K]["key"]; option: ResolvedChoices[K]["option"] }>;
type ConstructibleChoices = { [K in keyof ResolvedChoices]: LooseChoice<K> extends ResolvedChoices[K] ? K : never }[keyof ResolvedChoices];
const resolvedChoicesComeOnlyFromTheResolver: [ConstructibleChoices] extends [never] ? true : ConstructibleChoices = true;

type RecipeStyle<V extends Special> = (typeof OCELLUS_P4.special.styles)[V]["value"];
type IsUnion<T, U = T> = T extends unknown ? ([U] extends [T] ? false : true) : never;
type VariantsWithSeveralStyles = { [V in Special]: true extends IsUnion<RecipeStyle<V>> ? V : never }[Special];
const eachTransitionVariantHasOneStyle: [VariantsWithSeveralStyles] extends [never] ? true : VariantsWithSeveralStyles = true;

type Told<V extends Special, S extends Style> = Readonly<{ kind: "special-told"; at: Tick; ordinal: Ordinal; variant: V; style: S }>;
type Hit<V extends Special, S extends Style> = Readonly<{ kind: "special-hit"; at: Tick; ordinal: Ordinal; variant: V; style: S; receipt: HitReceipt }>;
type ToldStyles<V extends Special> = { [S in Style]: [Told<V, S>] extends [FightEvent] ? S : never }[Style];
type HitStyles<V extends Special> = { [S in Style]: [Hit<V, S>] extends [FightEvent] ? S : never }[Style];
type StylesOffRecipe = {
  [V in Special]: (Same<ToldStyles<V>, RecipeStyle<V>> extends true ? never : `special-told ${V}`) | (Same<HitStyles<V>, RecipeStyle<V>> extends true ? never : `special-hit ${V}`);
}[Special];
const transitionEventsLogTheRecipeStyle: [StylesOffRecipe] extends [never] ? true : StylesOffRecipe = true;

type Contradicted<E> = E extends { style: infer S; protected: infer P; receipt: { prayer: infer Prayer } }
  ? (true extends P ? ([Exclude<Prayer, S>] extends [never] ? never : E) : never) | (false extends P ? ([Extract<Prayer, S>] extends [never] ? never : E) : never)
  : never;
type ContradictedHits = Contradicted<Extract<FightEvent, { kind: "special-hit" }>>;
const transitionProtectionComesFromTheReceipt: [ContradictedHits] extends [never] ? true : ContradictedHits = true;
