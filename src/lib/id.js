// Unique-enough id for notes, labels and checklist items (time + random part).
// Plain JS on purpose: no native module needed, so it works the same in Expo Go and on web.
export function newId() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 6)
  );
}
