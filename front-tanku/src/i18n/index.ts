import { messages } from './es-CO.ts'

export type MessageKey = keyof typeof messages

/** The text for `key`, with each `{name}` replaced by the value of the same name. */
export function t(key: MessageKey, values: Record<string, string | number> = {}): string {
  return messages[key].replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    String(values[name] ?? placeholder),
  )
}
