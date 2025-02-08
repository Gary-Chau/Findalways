/**
 * Get vector length from x and y components
 */
export function getVectorLength(vector: { x: number; y: number }) {
  return Math.sqrt(vector.x ** 2 + vector.y ** 2)
}

/**
 * Run tasks sequentially
 */
export async function runTasks(tasks: (() => Promise<any>)[]) {
  for (const task of tasks) {
    await task()
  }
}

/**
 * Map number from one range to another
 */
export function mapNumber(
  num: number,
  in_min: number,
  in_max: number,
  out_min = 0,
  out_max = 1,
) {
  return (
    ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
  )
} 