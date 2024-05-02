import { default as QH } from "quickhull3d"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const qh = (QH as any as { default: typeof QH }).default

function polygonClip(clip: Point[], subject: Point[]): Point[] {
    let input: Point[]
    const closed: boolean = polygonClosed(subject)
    let i: number = -1
    const n: number = clip.length - (polygonClosed(clip) ? 1 : 0)
    let j: number
    let m: number
    let a: Point = clip[n - 1]
    let b: Point
    let c: Point
    let d: Point
    let intersection: Point

    while (++i < n) {
        input = subject.slice()
        subject = []
        b = clip[i]
        c = input[(m = input.length - (closed ? 1 : 0)) - 1]
        j = -1
        while (++j < m) {
            d = input[j]
            if (polygonInside(d, a, b)) {
                if (!polygonInside(c, a, b)) {
                    intersection = polygonIntersect(c, d, a, b)
                    if (isFinite(intersection[0])) {
                        subject.push(intersection)
                    }
                }
                subject.push(d)
            } else if (polygonInside(c, a, b)) {
                intersection = polygonIntersect(c, d, a, b)
                if (isFinite(intersection[0])) {
                    subject.push(intersection)
                }
            }
            c = d
        }
        if (closed) subject.push(subject[0])
        a = b
    }

    return subject
}

function polygonInside(p: Point, a: Point, b: Point): boolean {
    return (b[0] - a[0]) * (p[1] - a[1]) < (b[1] - a[1]) * (p[0] - a[0])
}

function polygonIntersect(c: Point, d: Point, a: Point, b: Point): Point {
    const x1: number = c[0]
    const x3: number = a[0]
    const x21: number = d[0] - x1
    const x43: number = b[0] - x3
    const y1: number = c[1]
    const y3: number = a[1]
    const y21: number = d[1] - y1
    const y43: number = b[1] - y3
    const ua: number = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21)
    return [x1 + ua * x21, y1 + ua * y21]
}

function polygonClosed(coordinates: Point[]): boolean {
    const a: Point = coordinates[0]
    const b: Point = coordinates[coordinates.length - 1]
    return !(a[0] - b[0] || a[1] - b[1])
}




const IMAX = 50 // Maximum number of iterations

export class WeightedVoronoi {
    private omega: Point[] // Convex polygon (bounding the diagram)
    private sites: Site[] // Set of points with coordinates and weights
    private ethreshold: number // Convergence error threshold

    constructor(omega: Point[], sites: Site[], ethreshold: number = 0.001) {
        this.omega = omega
        this.sites = sites
        this.ethreshold = ethreshold
    }

    compute(): Point[][] {
        let error = Infinity
        let diagram = this.initializeDiagram()

        for (let i = 0; i < IMAX; i++) {
            const adaptedSites = this.adaptPositionsAndWeights(this.sites, diagram)
            diagram = this.computePowerDiagram(adaptedSites, this.omega)
            error = this.calculateTotalError(adaptedSites, diagram)

            if (error < this.ethreshold) {
                break
            }
        }

        return diagram
    }

    private initializeDiagram(): Point[][] {
        const initialSites: Site[] = this.sites.map(_ => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            weight: 1,
        }))

        return this.computePowerDiagram(initialSites, this.omega)
    }

    private computePowerDiagram(sites: Site[], omega: Point[]): Point[][] {
        if (sites.length < 4) {
            // Directly compute by intersecting bisectors and return intersection with omega.
            return []
        }

        const transformedSites: Vector3[] = sites.map(site => [
            site.x,
            site.y,
            site.x ** 2 + site.y ** 2 - site.weight,
        ])

        const convexHull: number[][] = qh(transformedSites, { skipTriangulation: false })
        const cells: Point[][] = convexHull.map(face => {
            const vertices: Vector3[] = face.map(index => transformedSites[index])
            const lowerEnvelopeFace: Point[] = vertices.map(vertex => [vertex[0], vertex[1]])
            return polygonClip(lowerEnvelopeFace, omega)
        })

        return cells
    }

    private adaptPositionsAndWeights(sites: Site[], diagram: Point[][]): Site[] {
        return sites.map((site, index) => {
            const cell = diagram[index]
            const centroid = this.computeCentroid(cell)
            const distanceToBoundary = this.distanceToClosestEdge(centroid, cell)
            const targetArea = 1 / sites.length
            const areaRatio = cell.length / (Math.PI * distanceToBoundary ** 2)
            const newWeight = site.weight * (1 - targetArea / areaRatio)

            return {
                x: centroid[0],
                y: centroid[1],
                weight: newWeight,
            }
        })
    }

    private computeCentroid(polygon: Point[]): Point {
        let centroidX = 0
        let centroidY = 0
        const area = this.computePolygonArea(polygon)

        for (let i = 0; i < polygon.length; i++) {
            const p1 = polygon[i]
            const p2 = polygon[(i + 1) % polygon.length]
            const factor = p1[0] * p2[1] - p2[0] * p1[1]
            centroidX += (p1[0] + p2[0]) * factor
            centroidY += (p1[1] + p2[1]) * factor
        }

        const scale = 1 / (6 * area)
        centroidX *= scale
        centroidY *= scale

        return [centroidX, centroidY]
    }

    private computePolygonArea(polygon: Point[]): number {
        let area = 0

        for (let i = 0; i < polygon.length; i++) {
            const p1 = polygon[i]
            const p2 = polygon[(i + 1) % polygon.length]
            area += p1[0] * p2[1] - p2[0] * p1[1]
        }

        return Math.abs(area) / 2
    }

    private distanceToClosestEdge(point: Point, polygon: Point[]): number {
        let minDistance = Infinity

        for (let i = 0; i < polygon.length; i++) {
            const p1 = polygon[i]
            const p2 = polygon[(i + 1) % polygon.length]
            const distance = this.distanceToLine(point, p1, p2)
            minDistance = Math.min(minDistance, distance)
        }

        return minDistance
    }

    private distanceToLine(point: Point, p1: Point, p2: Point): number {
        const dx = p2[0] - p1[0]
        const dy = p2[1] - p1[1]
        const t = ((point[0] - p1[0]) * dx + (point[1] - p1[1]) * dy) / (dx ** 2 + dy ** 2)
        const closestPoint: Point = [p1[0] + t * dx, p1[1] + t * dy]
        const dx2 = point[0] - closestPoint[0]
        const dy2 = point[1] - closestPoint[1]
        return Math.sqrt(dx2 ** 2 + dy2 ** 2)
    }

    private calculateTotalError(sites: Site[], diagram: Point[][]): number {
        let totalError = 0

        for (let i = 0; i < sites.length; i++) {
            const cell = diagram[i]
            const area = this.computePolygonArea(cell)
            const targetArea = 1 / sites.length
            totalError += Math.abs(area - targetArea)
        }

        return totalError
    }

    render(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext("2d")
        if (!ctx) {
            throw new Error("Failed to get 2D rendering context")
        }

        const width = canvas.width
        const height = canvas.height
        const scale = Math.min(width, height) / 200 // Adjust the scale factor as needed

        ctx.clearRect(0, 0, width, height)
        ctx.save()
        ctx.translate(width / 2, height / 2)
        ctx.scale(scale, -scale) // Invert the y-axis

        // Render the bounding polygon (omega)
        ctx.beginPath()
        for (const [x, y] of this.omega) {
            ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.strokeStyle = "black"
        ctx.stroke()

        // Render the sites
        ctx.fillStyle = "red"
        for (const { x, y } of this.sites) {
            ctx.beginPath()
            ctx.arc(x, y, 2, 0, 2 * Math.PI)
            ctx.fill()
        }

        // Render the Power Diagram
        const diagram = this.compute()
        ctx.fillStyle = "rgba(0, 0, 255, 0.2)"
        for (const cell of diagram) {
            ctx.beginPath()
            for (const [x, y] of cell) {
                ctx.lineTo(x, y)
            }
            ctx.closePath()
            ctx.fill()
            ctx.strokeStyle = "blue"
            ctx.stroke()
        }

        ctx.restore()
    }

}

export type Vector3 = [number, number, number];
export type Point = [number, number];
export type Site = { x: number; y: number; weight: number };