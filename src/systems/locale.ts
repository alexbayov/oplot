import { GameState } from "../state/GameState";

const ruRegistry: Record<string, string> = {
  cloud_save_error: "Ошибка сохранения",
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
