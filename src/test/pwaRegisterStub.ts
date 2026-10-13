/** Test stand-in for `virtual:pwa-register`: registering does nothing. */
export function registerSW(): () => Promise<void> {
  return async () => {};
}
