export type FirstDayOfWeek = 'monday' | 'sunday'

/** Понедельник = 1, Вторник = 2, ... Воскресенье = 7 (ISO). При firstDay=sunday: Вс=1, Пн=2, ... Сб=7. */
export function getWeekdayNumber(d: Date, firstDay: FirstDayOfWeek): number {
  const iso = d.getDay() === 0 ? 7 : d.getDay() // Пн=1 ... Вс=7
  if (firstDay === 'monday') return iso
  return iso === 7 ? 1 : iso + 1 // Вс=1, Пн=2, ... Сб=7
}

const DAY_LABELS_MON = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
const DAY_LABELS_SUN = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

export function getDayLabels(firstDay: FirstDayOfWeek): string[] {
  return firstDay === 'sunday' ? DAY_LABELS_SUN : DAY_LABELS_MON
}

/** Дата понедельника текущей недели (или воскресенья если firstDay=sunday). */
export function getWeekStart(date: Date, firstDay: FirstDayOfWeek): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon, ... 6=Sat
  if (firstDay === 'monday') {
    const mondayOffset = (day + 6) % 7
    d.setDate(d.getDate() - mondayOffset)
  } else {
    d.setDate(d.getDate() - day)
  }
  d.setHours(0, 0, 0, 0)
  return d
}

/** Добавить дни к дате. */
export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function formatDateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}
