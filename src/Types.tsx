export type PerformanceEvent = {
    month: string,
    division: string,
    line: string,
    day_type: number,
    category: string,
    count: number
}

export type Colors = Record<string, string>

export type ColorsAPI = {
  cmyk: string,
  hex_color: string,
  operator: string,
  service: string
}
