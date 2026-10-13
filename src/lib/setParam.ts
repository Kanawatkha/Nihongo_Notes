/** `ch3-4` and `quiz2-ch3-4` both become `3-4`: the value of `?set=` on the vocabulary and exam pages. */
export function setParamOf(key: string): string {
  return key.replace(/^.*ch/, '');
}
