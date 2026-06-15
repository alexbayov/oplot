import { GameState } from "../state/GameState";

const ruRegistry: Record<string, string> = {
  cloud_save_error: "Ошибка сохранения",
  // M13 PR-6b-2 — assembly invalid reasons (frozen Model C contract: 3 кода).
  assembly_invalid_empty_parts: "Выберите хотя бы одну деталь",
  assembly_invalid_duplicate_part: "Нельзя ставить одну и ту же деталь дважды",
  assembly_invalid_no_structural_part:
    "Нужна основа: рамка или ствольная коробка",
  // M13 PR-6b-3 — Verstak energy gate + generator status.
  not_enough_energy_for_assembly: "Не хватает энергии для сборки",
  generator_status: "Генератор: производит ⚡{rate}/{cycleMin}мин, потребляет ⛽{cost}/{cycleMin}мин",
};

export const t = (key: string): string => {
  return ruRegistry[key] ?? key;
};

// ─── Radio sender display names ─────────────────────────────────
const RADIO_SENDER_RU: Record<string, string> = {
  caravan: "Караван",
  relic_drone: "Дрон-разведчик",
  unknown: "Неизвестный",
  survivor_group_a: "Группа выживших «Альфа»",
  survivor_group_b: "Группа выживших «Бета»",
  survivor_group_c: "Группа выживших «Гамма»",
  hospital_remnant: "Остатки персонала больницы",
  metro_dispatcher: "Диспетчер метро",
};

export const radioSenderName = (from: string): string =>
  RADIO_SENDER_RU[from] ?? from;

// ─── Zone display names (via GameState) ─────────────────────────
export const zoneName = (zoneId: string): string => {
  const zone = GameState.data.zones[zoneId];
  return zone?.name_ru ?? zoneId;
};
