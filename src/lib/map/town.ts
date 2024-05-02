import { euclidean_distance, log_with_base, sigmoid } from "$lib/utils/math"
import type { Point2D } from "$lib/types/point"
import { prng } from "$lib/utils/rand"
import { get_noise } from "./noise"
import { GRID_RESOLUTION, type Map, type Node } from "./map"

export class Town {
    population: number
    pos: Point2D
    color: string

    constructor(population: number, pos: Point2D, color: string) {
        this.population = population
        this.pos = pos
        this.color = color
    }

    render(map: Map, ctx: CanvasRenderingContext2D) {
        // draw a circle representing the town
        ctx.beginPath()
        ctx.arc(this.pos.x * GRID_RESOLUTION, this.pos.y * GRID_RESOLUTION, 5, 0, 2 * Math.PI)
        ctx.fillStyle = "#ffff00"
        ctx.fill()
        ctx.closePath()

        this.render_borders(map, ctx)
    }

    render_borders(map: Map, ctx: CanvasRenderingContext2D) {
        const border_points = expand_influence(map, this, ctx)

        if (border_points.length === 0) return

        ctx.beginPath()

        ctx.moveTo(border_points[0].x * GRID_RESOLUTION, border_points[0].y * GRID_RESOLUTION)
        // draw lines between the border points
        for (let i = 0; i < border_points.length; i++) {
            const point = border_points[i]
            ctx.lineTo(point.x * GRID_RESOLUTION, point.y * GRID_RESOLUTION)
        }

        // === Fill ===
        ctx.fillStyle = this.color
        ctx.fill()

        // === Stroke ===
        // ctx.strokeStyle = "#ffff00"
        // ctx.stroke()

        ctx.closePath()
    }

    get influence(): number {
        return Math.cbrt(this.population + 30)
    }
}

const colors = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
    "#ffffff",
    "#88ff88"
]

export function init_random_towns(
    count: number,
    max_population: number,
    max_x: number,
    max_y: number
): Town[] {
    const towns: Town[] = []
    for (let i = 0; i < count; i++) {
        // min pop of 200
        const population = Math.floor(prng() * max_population)
        const x = Math.floor(prng() * max_x)
        const y = Math.floor(prng() * max_y)
        const color = colors[i % colors.length] + "22"
        towns.push(new Town(population, { x, y }, color))
    }
    return towns
}

/**
 * Here we want to explore outwards from the town, creating
 * a virtual grid of influence of that town, extending in 8 directions
 * with a cost of travel. We use the initial influence as the budget
 * for how far the town's influence extends.
 *
 * This will be used to get the outer edges/nodes of the town's influence (Point2Ds)
 * From that, later we can use it to render the town's borders.
 */
export function expand_influence(map: Map, town: Town, ctx: CanvasRenderingContext2D): Point2D[] {
    const town_node = map.grid[Math.round(town.pos.x)][Math.round(town.pos.y)]

    const queue = [town_node]
    let last_node: Node = town_node
    town_node.data = { influence: town.influence, town }

    // console.log(town_node.data.influence)

    while (queue.length > 0) {
        const node = queue.shift()!
        last_node = node
        const neighbours = map.node_neighbours(node)

        for (const neighbour of neighbours) {
            const node_cost = get_noise(neighbour.pos.x * GRID_RESOLUTION, neighbour.pos.y * GRID_RESOLUTION)
            const neighbour_cost = get_noise(neighbour.pos.x * GRID_RESOLUTION, neighbour.pos.y * GRID_RESOLUTION)

            // calculate the difference in cost
            const steepness = Math.abs(neighbour_cost - node_cost) * 10
            const dist = euclidean_distance(neighbour.pos, town.pos)
            const cost = dist + dist * steepness

            const new_influence = node.data!.influence - cost * 0.1
            const old_influence = neighbour.data?.influence || 0

            if (new_influence > 0 && new_influence >= old_influence) {
                neighbour.data = { influence: new_influence, town }
                queue.push(neighbour)
            }
        }
    }

    return trace_boundary(town, last_node, map, ctx)
}

/**
 * Traces the boundary of the town's influence, starting from the last node (find nearest null influence node)
 *
 * Then
 */
export function trace_boundary(town: Town, initial_node: Node, map: Map, ctx: CanvasRenderingContext2D): Point2D[] {
    const explored = new Set<Node>()
    const exploration_path: Node[] = []

    while (true) {
        // while the node only has 1 neighbour, it's a dead end tunnel, so go to nearest influenced neighbour
        const neighbours = map.node_neighbours(initial_node, true)
            .filter(neighbour => neighbour.data !== null)
        if (neighbours.length > 1) break

        const neighbour = neighbours[0]
        initial_node = neighbour as Node
    }

    let node: Node | undefined = initial_node

    while (true) {
        if (node === undefined) break
        explored.add(node)

        ctx.beginPath()
        ctx.arc(node.pos.x * GRID_RESOLUTION, node.pos.y * GRID_RESOLUTION, 2, 0, 2 * Math.PI)
        ctx.fillStyle = node.pos === initial_node.pos ? "#ff0000" : "#ffff00"
        ctx.fill()
        ctx.closePath()

        exploration_path.push(node)

        const neighbours = map.node_neighbours(node)
            // filter out nodes that have no influence
            .filter(neighbour => neighbour.data !== null)
            // keep only this town's nodes
            .filter(neighbour => neighbour.data?.town === town)
            // filter out nodes that have been explored
            .filter(neighbour => !explored.has(neighbour) || neighbour === initial_node)
            // stick around the edges of the border, so we circle back around to the initial node
            .filter(neighbour => map.node_has_foreign_neighbours(neighbour, false) || neighbour === initial_node)
            // get the node furthest away from the initial node (so it forces us to circle back around)
            .sort((a, b) => euclidean_distance(b.pos, initial_node.pos) - euclidean_distance(a.pos, initial_node.pos))

        if (neighbours.length === 0) {
            // dead end tunnel node, backtrack
            exploration_path.pop()
            node = exploration_path.pop() // set to the node before this one
            continue
        }


        node = neighbours[0]
        if (node === initial_node) break
    }

    const points = exploration_path.map(node => node.pos)
    if (points.length === 0) console.error("traced boundary", points)

    return points
}
