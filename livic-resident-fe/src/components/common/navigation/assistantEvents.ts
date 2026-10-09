// Lets the top bar's Livi button (used on narrow screens and with large text) open the assistant's chat,
// which FloatingAIAssistant owns.
const listeners = new Set<() => void>();

export function requestOpenAssistant(): void {
  listeners.forEach((listener) => listener());
}

export function onOpenAssistantRequest(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
