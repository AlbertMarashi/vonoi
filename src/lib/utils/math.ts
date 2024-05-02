import type { Point2D } from "$lib/types/point"


export function round_to_nearest(value: number, nearest: number): number {
    return Math.round(value / nearest) * nearest
}

export function euclidean_distance(p1: Point2D, p2: Point2D): number {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
}

export function sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x))
}

export function log_with_base(x: number, base: number): number {
    return Math.log(x) / Math.log(base)
}