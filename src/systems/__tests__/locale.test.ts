import { describe, expect, test } from "vitest";

describe("locale", () => {
  test("t() returns RU string for registered key", async () => {
    const { t } = await import("../locale");
    expect(t("cloud_save_error")).toBe("Ошибка сохранения");
  });

  test("t() returns key itself for unknown key", async () => {
    const { t } = await import("../locale");
    expect(t("nonexistent_key")).toBe("nonexistent_key");
  });
});
