import { messages } from './es-CO.ts'

export type MessageKey = keyof typeof messages

/** True when `key` has a text: the way to use a key built from API data (an error code, a tag). */
export function hasKey(key: string): key is MessageKey {
  return key in messages
}

/** The Spanish name of a catalog tag; a tag without text yet shows as it is. */
export function tagLabel(tag: string): string {
  const key = `tag.${tag}`
  return hasKey(key) ? t(key) : tag
}

/** The text for `key`, with each `{name}` replaced by the value of the same name. */
export function t(key: MessageKey, values: Record<string, string | number> = {}): string {
  return messages[key].replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    String(values[name] ?? placeholder),
  )
}
