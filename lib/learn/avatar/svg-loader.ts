/**
 * Fetches an avatar SVG asset and returns its inner markup (children of the
 * root <svg>), so it can be inlined into the compositor <svg> and inherit the
 * --skin / --hair CSS variables. Results are cached per path for the session.
 */
const cache = new Map<string, Promise<string | null>>();

export function loadAvatarAsset(path: string): Promise<string | null> {
  let pending = cache.get(path);
  if (!pending) {
    pending = fetch(path)
      .then((res) => (res.ok ? res.text() : null))
      .then((text) => {
        if (!text) return null;
        const match = text.match(/<svg[^>]*>([\s\S]*)<\/svg>\s*$/i);
        return match ? match[1] : null;
      })
      .catch(() => null);
    cache.set(path, pending);
  }
  return pending;
}
