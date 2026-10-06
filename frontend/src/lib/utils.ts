import { format, formatDistanceToNow, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDatetime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy · h:mm a');
  } catch {
    return dateStr;
  }
}

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return '';
  }
}

export function isOverdue(dueDateStr: string | null | undefined): boolean {
  if (!dueDateStr) return false;
  try {
    return isPast(parseISO(dueDateStr + 'T23:59:59')) && !isToday(parseISO(dueDateStr));
  } catch {
    return false;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function getDeadlineCategory(dueDateStr: string | null | undefined): string {
  if (!dueDateStr) return 'later';
  try {
    const d = parseISO(dueDateStr);
    if (isPast(d) && !isToday(d)) return 'overdue';
    if (isToday(d)) return 'today';
    if (isTomorrow(d)) return 'tomorrow';
    const diffDays = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return 'this_week';
    if (diffDays <= 14) return 'next_week';
    return 'later';
  } catch {
    return 'later';
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getPriorityWeight(priority: string): number {
  const w: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
  return w[priority] ?? 0;
}

export function clsx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
