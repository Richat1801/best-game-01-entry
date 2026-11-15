// Wave table: what marches down the road each wave.
// Each entry is [enemyType, count, gapSeconds]. Wave 12 is the Gloom Titan.
export const WAVES = {
  1: [['mite', 8, 1.1]],
  2: [['mite', 10, 0.9], ['runner', 4, 1.4]],
  3: [['mite', 12, 0.8], ['runner', 8, 1.0], ['shell', 2, 2.2]],
  4: [['runner', 12, 0.7], ['shell', 4, 1.8], ['spitter', 4, 1.6]],
  5: [['mite', 16, 0.55], ['runner', 10, 0.7], ['shell', 5, 1.5], ['wisp', 5, 1.2]],
  6: [['shell', 8, 1.2], ['spitter', 8, 1.1], ['wisp', 8, 0.9], ['brute', 1, 0.5]],
  7: [['runner', 18, 0.5], ['wisp', 12, 0.8], ['shell', 6, 1.3], ['spitter', 6, 1.2]],
  8: [['mite', 22, 0.4], ['shell', 10, 1.0], ['brute', 2, 3.0], ['wisp', 10, 0.7]],
  9: [['runner', 20, 0.45], ['spitter', 12, 0.9], ['shell', 10, 1.0], ['wisp', 12, 0.6]],
  10: [['shell', 14, 0.9], ['brute', 3, 2.5], ['spitter', 14, 0.8], ['runner', 16, 0.5]],
  11: [['wisp', 20, 0.5], ['runner', 22, 0.4], ['shell', 14, 0.8], ['brute', 4, 2.2], ['spitter', 12, 0.7]],
  12: [['mite', 16, 0.4], ['runner', 14, 0.45], ['shell', 8, 1.0], ['brute', 2, 2.0], ['titan', 1, 0.5]],
};

// Gold bonus for clearing a wave with the keep untouched, plus a flat bonus.
export function waveClearBonus(wave, leaked) {
  return 40 + wave * 12 + (leaked === 0 ? 25 : 0);
}
