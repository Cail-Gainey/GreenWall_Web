/**
 * @file 字母贡献图的布尔矩阵模板。
 */

/**
 * @description 单个字母的 7x5 像素网格。
 */
export type PatternGrid = boolean[][];

/**
 * @description A-Z 字母模板集合。
 */
export const PATTERNS = {
  A: [
    [false, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, true, true, true, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true]
  ],
  B: [
    [true, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, true, true, true, false]
  ],
  C: [
    [false, true, true, true, true],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [false, true, true, true, true]
  ],
  D: [
    [true, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, true, true, true, false]
  ],
  E: [
    [true, true, true, true, true],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, true, true, true, false],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, true, true, true, true]
  ],
  F: [
    [true, true, true, true, true],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, true, true, true, false],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, false, false, false, false]
  ],
  G: [
    [false, true, true, true, true],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, false, true, true, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [false, true, true, true, true]
  ],
  H: [
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, true, true, true, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true]
  ],
  I: [
    [true, true, true, true, true],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [true, true, true, true, true]
  ],
  J: [
    [false, false, false, false, true],
    [false, false, false, false, true],
    [false, false, false, false, true],
    [false, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [false, true, true, true, false]
  ],
  K: [
    [true, false, false, false, true],
    [true, false, false, true, false],
    [true, false, true, false, false],
    [true, true, false, false, false],
    [true, false, true, false, false],
    [true, false, false, true, false],
    [true, false, false, false, true]
  ],
  L: [
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, true, true, true, true]
  ],
  M: [
    [true, false, false, false, true],
    [true, true, false, true, true],
    [true, false, true, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true]
  ],
  N: [
    [true, false, false, false, true],
    [true, true, false, false, true],
    [true, false, true, false, true],
    [true, false, false, true, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true]
  ],
  O: [
    [false, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [false, true, true, true, false]
  ],
  P: [
    [true, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, true, true, true, false],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, false, false, false, false]
  ],
  Q: [
    [false, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, true, false, true],
    [true, false, false, true, false],
    [false, true, true, false, true]
  ],
  R: [
    [true, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, true, true, true, false],
    [true, false, true, false, false],
    [true, false, false, true, false],
    [true, false, false, false, true]
  ],
  S: [
    [false, true, true, true, true],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [false, true, true, true, false],
    [false, false, false, false, true],
    [false, false, false, false, true],
    [true, true, true, true, false]
  ],
  T: [
    [true, true, true, true, true],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false]
  ],
  U: [
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [false, true, true, true, false]
  ],
  V: [
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [false, true, false, true, false],
    [false, false, true, false, false]
  ],
  W: [
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, true, false, true],
    [true, false, true, false, true],
    [true, true, false, true, true],
    [true, false, false, false, true]
  ],
  X: [
    [true, false, false, false, true],
    [true, false, false, false, true],
    [false, true, false, true, false],
    [false, false, true, false, false],
    [false, true, false, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true]
  ],
  Y: [
    [true, false, false, false, true],
    [true, false, false, false, true],
    [false, true, false, true, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false]
  ],
  Z: [
    [true, true, true, true, true],
    [false, false, false, false, true],
    [false, false, false, true, false],
    [false, false, true, false, false],
    [false, true, false, false, false],
    [true, false, false, false, false],
    [true, true, true, true, true]
  ],
  '0': [
    [false, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [false, true, true, true, false]
  ],
  '1': [
    [false, false, true, false, false],
    [false, true, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, true, true, true, false]
  ],
  '2': [
    [false, true, true, true, false],
    [true, false, false, false, true],
    [false, false, false, false, true],
    [false, false, true, true, false],
    [false, true, false, false, false],
    [true, false, false, false, false],
    [true, true, true, true, true]
  ],
  '3': [
    [false, true, true, true, false],
    [true, false, false, false, true],
    [false, false, false, false, true],
    [false, false, true, true, false],
    [false, false, false, false, true],
    [true, false, false, false, true],
    [false, true, true, true, false]
  ],
  '4': [
    [false, false, false, true, false],
    [false, false, true, true, false],
    [false, true, false, true, false],
    [true, false, false, true, false],
    [true, true, true, true, true],
    [false, false, false, true, false],
    [false, false, false, true, false]
  ],
  '5': [
    [true, true, true, true, true],
    [true, false, false, false, false],
    [true, true, true, true, false],
    [false, false, false, false, true],
    [false, false, false, false, true],
    [true, false, false, false, true],
    [false, true, true, true, false]
  ],
  '6': [
    [false, true, true, true, false],
    [true, false, false, false, false],
    [true, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [false, true, true, true, false]
  ],
  '7': [
    [true, true, true, true, true],
    [false, false, false, false, true],
    [false, false, false, true, false],
    [false, false, true, false, false],
    [false, true, false, false, false],
    [false, true, false, false, false],
    [false, true, false, false, false]
  ],
  '8': [
    [false, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [false, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [false, true, true, true, false]
  ],
  '9': [
    [false, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [false, true, true, true, true],
    [false, false, false, false, true],
    [false, true, true, true, false]
  ],
  'a': [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, true, true, true, false],
    [false, false, false, true, false],
    [false, true, true, true, false],
    [true, false, false, true, false],
    [false, true, true, true, true]
  ],
  'b': [
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, true, true, true, false]
  ],
  'c': [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, true, true, true, false],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [false, true, true, true, false]
  ],
  'd': [
    [false, false, false, true, false],
    [false, false, false, true, false],
    [false, true, true, true, false],
    [true, false, false, true, false],
    [true, false, false, true, false],
    [true, false, false, true, false],
    [false, true, true, true, false]
  ],
  'e': [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, true, true, true, false],
    [true, false, false, false, true],
    [true, true, true, true, true],
    [true, false, false, false, false],
    [false, true, true, true, false]
  ],
  'f': [
    [false, false, true, true, false],
    [false, true, false, false, false],
    [true, true, true, false, false],
    [false, true, false, false, false],
    [false, true, false, false, false],
    [false, true, false, false, false],
    [false, true, false, false, false]
  ],
  'g': [
    [false, false, false, false, false],
    [false, true, true, true, false],
    [true, false, false, true, false],
    [true, false, false, true, false],
    [false, true, true, true, false],
    [false, false, false, true, false],
    [false, true, true, false, false]
  ],
  'h': [
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, true, true, false, false],
    [true, false, false, true, false],
    [true, false, false, true, false],
    [true, false, false, true, false],
    [true, false, false, true, false]
  ],
  'i': [
    [false, false, true, false, false],
    [false, false, false, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, true, true, true, false]
  ],
  'j': [
    [false, false, true, false, false],
    [false, false, false, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, true, true, false, false],
    [false, true, false, false, false]
  ],
  'k': [
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, false, false, true, false],
    [true, false, true, false, false],
    [true, true, false, false, false],
    [true, false, true, false, false],
    [true, false, false, true, false]
  ],
  'l': [
    [false, true, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, false, true, false, false],
    [false, true, true, true, false]
  ],
  'm': [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [true, true, false, true, false],
    [true, false, true, false, true],
    [true, false, true, false, true],
    [true, false, true, false, true],
    [true, false, true, false, true]
  ],
  'n': [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [true, true, true, false, false],
    [true, false, false, true, false],
    [true, false, false, true, false],
    [true, false, false, true, false],
    [true, false, false, true, false]
  ],
  'o': [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, true, true, true, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [false, true, true, true, false]
  ],
  'p': [
    [false, false, false, false, false],
    [true, true, true, false, false],
    [true, false, false, true, false],
    [true, false, false, true, false],
    [true, true, true, false, false],
    [true, false, false, false, false],
    [true, false, false, false, false]
  ],
  'q': [
    [false, false, false, false, false],
    [false, true, true, true, false],
    [true, false, false, true, false],
    [true, false, false, true, false],
    [false, true, true, true, false],
    [false, false, false, true, false],
    [false, false, false, true, false]
  ],
  'r': [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [true, true, true, false, false],
    [true, false, false, true, false],
    [true, false, false, false, false],
    [true, false, false, false, false],
    [true, false, false, false, false]
  ],
  's': [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [false, true, true, true, false],
    [true, false, false, false, false],
    [false, true, true, false, false],
    [false, false, false, true, false],
    [true, true, true, false, false]
  ],
  't': [
    [false, true, false, false, false],
    [false, true, false, false, false],
    [true, true, true, false, false],
    [false, true, false, false, false],
    [false, true, false, false, false],
    [false, true, false, false, false],
    [false, false, true, true, false]
  ],
  'u': [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [true, false, false, true, false],
    [true, false, false, true, false],
    [true, false, false, true, false],
    [true, false, false, true, false],
    [false, true, true, true, false]
  ],
  'v': [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [true, false, false, false, true],
    [true, false, false, false, true],
    [false, true, false, true, false],
    [false, true, false, true, false],
    [false, false, true, false, false]
  ],
  'w': [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [true, false, true, false, true],
    [true, false, true, false, true],
    [true, false, true, false, true],
    [false, true, false, true, false],
    [false, true, false, true, false]
  ],
  'x': [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [true, false, false, false, true],
    [false, true, false, true, false],
    [false, false, true, false, false],
    [false, true, false, true, false],
    [true, false, false, false, true]
  ],
  'y': [
    [false, false, false, false, false],
    [true, false, false, true, false],
    [true, false, false, true, false],
    [true, false, false, true, false],
    [false, true, true, true, false],
    [false, false, false, true, false],
    [true, true, true, false, false]
  ],
  'z': [
    [false, false, false, false, false],
    [false, false, false, false, false],
    [true, true, true, true, false],
    [false, false, false, true, false],
    [false, false, true, false, false],
    [false, true, false, false, false],
    [true, true, true, true, false]
  ]
};
