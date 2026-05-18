export const KAOMOJI = [
  '(^w^)7',
  '(>﹏<)ゝ',
  'ᓚ₍⑅^..^₎',
  '/(-3-)',
  "_( '/3\\' )_",
  '<❪❪꒰˶ᵔ ᵕ ᵔ˶꒱❫❫>',
  '@(@~@)@',
  "++(' _ ')++",
  '(\\/) ( ;,,;)(\\/)',
];

export const randKaomoji = (): string => KAOMOJI[Math.floor(Math.random() * KAOMOJI.length)];
