import type {
  LifelineEvent,
  LifelineLegendItem,
  LifelineMarker,
} from "./types"

export const LIFELINE_CURRENT_YEAR = 2026

export type LifelineMilestone = Omit<LifelineMarker, "year">
export type LifelineMilestones = Record<number, LifelineMilestone>

export type LifelineGranularity = "years" | "months"

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

/** YYYYMM → absolute month index (consecutive months differ by 1). */
function monthIndex(key: number): number {
  const year = Math.floor(key / 100)
  const month = key % 100
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month key ${key}: use YYYYMM (e.g. 202405)`)
  }
  return year * 12 + (month - 1)
}

/** Absolute month index → YYYYMM. */
function monthKey(index: number): number {
  return Math.floor(index / 12) * 100 + (index % 12) + 1
}

function currentMonthKey(): number {
  const now = new Date()
  return now.getFullYear() * 100 + now.getMonth() + 1
}

export interface LifelineRecord {
  slug: string
  name: string
  birthYear: number
  /** Last year on the timeline. Omit for living people. */
  endYear?: number
  description: string
  /** People-legend labels; defaults to Mentors / Met in person. */
  legend?: LifelineLegendItem[]
  markers: LifelineMarker[]
}

interface DefineLifelineInput {
  slug: string
  name: string
  birthYear: number
  endYear?: number
  /** Axis unit. "months" expects YYYYMM milestone keys (e.g. 202405). */
  granularity?: LifelineGranularity
  /**
   * Founding month (1-12) for the Age row in months mode. When set, the
   * age shows at each founding-month column (0 at May 2024, 1 at May
   * 2025…). Defaults to January columns.
   */
  birthMonth?: number
  /** Last month on the timeline (YYYYMM). Defaults to the current month. */
  endMonth?: number
  description: string
  legend?: LifelineLegendItem[]
  milestones: LifelineMilestones
}

/**
 * Translated event texts keyed by year, aligned by index with the
 * source milestone's events. Only the text is swapped; images,
 * effects, mentors, and structure stay single-sourced.
 */
export type LifelineTextOverrides = Record<number, string[]>

export function localizeLifelineMarkers(
  markers: LifelineMarker[],
  texts: LifelineTextOverrides,
): LifelineMarker[] {
  return markers.map((marker) => {
    const translated = texts[marker.year]
    if (!translated) return marker

    const events: LifelineEvent[] = marker.events.map((event, index) => {
      const text = translated[index]
      if (text === undefined) return event
      if (typeof event === "string") return text
      if (Array.isArray(event)) return event
      return { ...event, text }
    })

    return { ...marker, events }
  })
}

export function defineLifeline(input: DefineLifelineInput): LifelineRecord {
  const { milestones, granularity = "years", ...record } = input

  const markers: LifelineMarker[] =
    granularity === "months"
      ? buildMonthMarkers(input, milestones)
      : buildYearMarkers(input, milestones)

  return { ...record, markers }
}

function buildYearMarkers(
  input: DefineLifelineInput,
  milestones: LifelineMilestones,
): LifelineMarker[] {
  const lastYear = input.endYear ?? LIFELINE_CURRENT_YEAR
  const markers: LifelineMarker[] = []

  for (let year = input.birthYear; year <= lastYear; year++) {
    const milestone = milestones[year]

    markers.push(
      milestone
        ? { year, ...milestone }
        : { id: `year-${year}`, year, events: [] },
    )
  }

  return markers
}

/**
 * Months mode: the rail is one column per month. `year` carries the
 * absolute month index (so gaps and widths work in months), while
 * `label` ("May 2024", then "Jun", "Jul"…, year repeated each January)
 * and `age` (company age, shown at January columns) carry the display.
 */
function buildMonthMarkers(
  input: DefineLifelineInput,
  milestones: LifelineMilestones,
): LifelineMarker[] {
  const keys = Object.keys(milestones)
    .map(Number)
    .sort((a, b) => a - b)
  const startIndex =
    keys.length > 0 ? monthIndex(keys[0]) : input.birthYear * 12
  const endIndex = monthIndex(input.endMonth ?? currentMonthKey())
  const markers: LifelineMarker[] = []

  for (let index = startIndex; index <= endIndex; index++) {
    const key = monthKey(index)
    const year = Math.floor(key / 100)
    const month = key % 100
    const isFirst = index === startIndex
    const isJanuary = month === 1
    const label =
      isFirst || isJanuary
        ? `${MONTH_NAMES[month - 1]} ${year}`
        : MONTH_NAMES[month - 1]
    const birthMonth = input.birthMonth
    const isFoundingMonth =
      birthMonth !== undefined && month === birthMonth && year >= input.birthYear
    const age: number | string =
      birthMonth !== undefined
        ? isFoundingMonth
          ? year - input.birthYear
          : ""
        : isFirst
          ? 0
          : isJanuary
            ? year - input.birthYear
            : ""
    const milestone = milestones[key]

    markers.push(
      milestone
        ? { year: index, label, age, ...milestone }
        : { id: `month-${key}`, year: index, label, age, events: [] },
    )
  }

  return markers
}
