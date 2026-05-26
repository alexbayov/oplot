const ruRegistry: Record<string, string> = {
  cloud_save_error: "Ошибка сохранения",
};

export const t = (key: string): string => {
  return ruRegistry[key] ?? key;
};
