import type { Point2D } from "$lib/types/point"
import { render_noise } from "./noise"
import type { Town } from "./town"

export const GRID_RESOLUTION = 8

const diagonals = [
    { x: 1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 },
]
const axial = [
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: -1, y: 0 },
]

export const both_directions = [...diagonals, ...axial]

export class Map {
    grid: Node[][]
    towns: Town[]

    constructor() {
        const width = 150
        const height = 150

        this.grid = new Array(width).fill(null).map(() => new Array(height).fill(null))
        this.towns = []

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                this.grid[x][y] = new Node({ x, y })
            }
        }
    }

    get width(): number {
        return this.grid.length
    }

    get height(): number {
        return this.grid[0].length
    }

    add_town(town: Town) {
        this.towns.push(town)
    }

    node_neighbours(node: Node, diagonals: boolean = true): Node[] {
        const directions = diagonals ? both_directions : axial

        const nodes = directions
            .map(dir => this.grid?.[node.pos.x + dir.x]?.[node.pos.y + dir.y] as Node)
            .filter(n => n != undefined)
        return nodes
    }

    node_has_null_neighbours(node: Node, diagonals: boolean = true): boolean {
        const directions = diagonals ? both_directions : axial

        const nodes = directions
            .map(dir => this.grid?.[node.pos.x + dir.x]?.[node.pos.y + dir.y] as Node)

        return nodes.some(n => n === undefined || n.data === null)
    }

    node_has_foreign_neighbours(node: Node, diagonals: boolean = true): boolean {
        const directions = diagonals ? both_directions : axial

        const nodes = directions
            .map(dir => this.grid?.[node.pos.x + dir.x]?.[node.pos.y + dir.y] as Node)

        return nodes.some(n => n === undefined || n.data === null || n.data?.town !== node.data?.town)
    }

    render(canvas: HTMLCanvasElement) {
        // clear the canvas
        const ctx = canvas.getContext("2d")!
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        render_noise(canvas)

        this.towns.map(town => town.render(this, ctx))
        this.grid.map(row => row.map(node => node.render(ctx)))
    }
}

export class Node {
    data: null | {
        influence: number
        town: Town
    }
    pos: Point2D
    constructor(pos: Point2D) {
        this.pos = pos
        this.data = null
    }

    render(ctx: CanvasRenderingContext2D) {
        // render the point
        ctx.fillStyle = this.data === null ? "#ffffff22" : "#ffffff66"
        ctx.beginPath()
        ctx.arc(this.pos.x * GRID_RESOLUTION, this.pos.y * GRID_RESOLUTION, 1.5, 0, 2 * Math.PI)
        ctx.fill()
    }

}