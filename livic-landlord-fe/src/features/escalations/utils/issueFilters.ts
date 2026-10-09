/** Issue list filters: the value the API uses, and the label people read (sentence case). */
export const ISSUE_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'RESOLVED', label: 'Resolved' },
] as const;

export const ISSUE_PRIORITY_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'LOW', label: 'Low' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
] as const;

export function issueFilterLabel(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
