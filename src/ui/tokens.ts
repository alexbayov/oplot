/**
 * ui/tokens — цветовая система «Оплот»
 * Единый источник правды для всех цветов. Сцены и компоненты
 * импортируют токены отсюда, а не хардкодят hex.
 */

// ── Семантические токены ──────────────────────────────────────

export const COLORS = {
  // Фоны
  bg: 0x111210,
  bgPanel: 0x252620,
  bgPanelLight: 0x323329,

  // Обводки
  border: 0x55513e,
  borderLight: 0x4a4a3a,

  // Текст
  textMain: "#D4C5A0",
  textMuted: "#8A8070",
  textDark: "#1a1a1a",

  // Акценты
  accent: 0xc5a267,
  accentText: "#1a1a1a",

  // Состояния
  danger: 0x8b0000,
  dangerBg: 0x3a0000,
  warning: 0xffb300,
  success: 0x4caf50,
  successBg: 0x1b3a1b,

  // Статы
  stamina: 0x4682b4,
  staminaBg: 0x1a2a3a,
  gas: 0x6f8a4d,
  gasBg: 0x1a2a1a,

  // Tier rarity
  tier: {
    1: 0x9e9e9e,
    2: 0x4caf50,
    3: 0x2196f3,
    4: 0x9c27b0,
    5: 0xff9800,
  },

  // UI элементы
  buttonBg: 0x2d2d2a,
  buttonHover: 0xc5a267,
  buttonDisabledBg: 0x3a3a35,
  buttonDisabledText: "#6a6a60",

  // Панель — тёмная с тактической обводкой
  panelBg: 0x2d2d2a,
  panelBorder: 0x4a4a3a,
  panelInnerBorder: 0xd4c5a0,
  panelInnerAlpha: 0.22,

  // HP-бар
  hpBarFill: 0x8b0000,
  hpBarBg: 0x3a0000,
  hpTickColor: 0x111111,
  hpTickAlpha: 0.45,

  // Floating text
  floatDamage: "#D32F2F",
  floatHeal: "#4CAF50",
  floatMiss: "#8A8070",
  floatCritical: "#FFB300",
} as const;

// ── Семантические имена (для сцен) ───────────────────────────

export const SEMANTIC = {
  /** Основной CTA — золотой акцент */
  action: { bg: COLORS.accent, text: "#1a1a1a" },
  /** Стандартная кнопка */
  button: { bg: COLORS.buttonBg, text: "#d4c5a0" },
  /** Отключённая кнопка */
  disabled: { bg: COLORS.buttonDisabledBg, text: COLORS.buttonDisabledText },
  /** Опасное действие */
  danger: { bg: COLORS.danger, text: "#f0e0d0" },
} as const;

// ── Шрифты ─────────────────────────────────────────────────────

export const FONTS = {
  title: "Oswald, Impact, Arial Black, sans-serif",
  body: "Roboto Condensed, Arial, sans-serif",
  mono: "Share Tech Mono, Roboto Mono, monospace",
} as const;

export const FONT_SIZES = {
  title: "30px",
  heading: "18px",
  button: "16px",
  buttonSmall: "14px",
  body: "14px",
  caption: "12px",
  log: "13px",
  float: "18px",
} as const;
