/** API values are upper case; people read sentence case ("IN_PROGRESS" -> "In progress"). */
export function toSentenceCase(value?: string | null): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase().replace(/_/g, ' ');
}
