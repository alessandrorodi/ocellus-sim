import type { UnitEquipment } from "osrs-sdk";

type Slot = keyof UnitEquipment;
type SlotItem<S extends Slot> = NonNullable<UnitEquipment[S]>;
type Misfits = { [A in Slot]: { [B in Exclude<Slot, A>]: SlotItem<A> extends SlotItem<B> ? `${A} fits ${B}` : never }[Exclude<Slot, A>] }[Slot];
const eachSlotTakesOnlyItsOwnItems: [Misfits] extends [never] ? true : Misfits = true;
