/**
 * Represents a point with x, y coordinates and an associated weight.
 */
export class Point {
    x: number
    y: number
    weight: number

    constructor(x: number, y: number, weight: number = 0) {
        this.x = x
        this.y = y
        this.weight = weight
    }
}

/**
 * Represents an event in the event queue, which can be either a site event or a circle event.
 */
export class DiagramEvent {
    type: string
    site: Point | null
    arc: Arc | null
    center: Point | null
    radius: number

    constructor(type: string, site: Point | null = null, arc: Arc | null = null, center: Point | null = null, radius: number = 0) {
        this.type = type
        this.site = site
        this.arc = arc
        this.center = center
        this.radius = radius
    }
}

/**
   * Represents a parabolic arc in the beach line.
   */
class Arc {
    site: Point
    prev: Arc | null
    next: Arc | null
    circleEvent: DiagramEvent | null
    edge: Edge | null

    constructor(site: Point, prev: Arc | null = null, next: Arc | null = null) {
        this.site = site
        this.prev = prev
        this.next = next
        this.circleEvent = null
        this.edge = null
    }
}

/**
   * Represents an edge in the Voronoi diagram.
   */
class Edge {
    start: Point
    end: Point | null
    twin: Edge | null

    constructor(start: Point, end: Point | null = null) {
        this.start = start
        this.end = end
        this.twin = null
    }
}

/**
   * Represents a Weighted Voronoi Diagram computed using Fortune's algorithm.
   */
export class WeightedVoronoiDiagram {
    sites: Point[]
    beachLine: Arc[]
    events: DiagramEvent[]
    voronoiVertices: Point[]
    voronoiEdges: Edge[]

    constructor(sites: Point[]) {
        this.sites = sites
        this.beachLine = []
        this.events = []
        this.voronoiVertices = []
        this.voronoiEdges = []
    }

    /**
     * Calculates the weighted distance between two points.
     * @param p1 The first point.
     * @param p2 The second point.
     * @returns The weighted distance between the points.
     */
    weightedDistance(p1: Point, p2: Point): number {
        const dx = p1.x - p2.x
        const dy = p1.y - p2.y
        return Math.sqrt(dx * dx + dy * dy) - p1.weight + p2.weight
    }

    /**
 * Finds the intersection point between two parabolas.
 * @param site1 The site of the first parabola.
 * @param site2 The site of the second parabola.
 * @returns The intersection point between the parabolas.
 */
    findIntersection(site1: Point, site2: Point): Point {
    // Calculate the intersection point between two parabolas
        const h1 = site1.x
        const k1 = site1.y
        const h2 = site2.x
        const k2 = site2.y
        const d = (k1 + k2) / 2
        const p1 = (k1 - d) / 2
        const p2 = (k2 - d) / 2

        const a = 1 / (4 * p1) - 1 / (4 * p2)
        const b = -h1 / (2 * p1) + h2 / (2 * p2)
        const c = (h1 * h1) / (4 * p1) - (h2 * h2) / (4 * p2) + d

        const discriminant = b * b - 4 * a * c
        const x1 = (-b + Math.sqrt(discriminant)) / (2 * a)
        const x2 = (-b - Math.sqrt(discriminant)) / (2 * a)
        const y1 = (x1 - h1) * (x1 - h1) / (4 * p1) + k1
        const y2 = (x2 - h1) * (x2 - h1) / (4 * p1) + k1

        const dist1 = Math.sqrt((x1 - h1) * (x1 - h1) + (y1 - k1) * (y1 - k1))
        const dist2 = Math.sqrt((x2 - h1) * (x2 - h1) + (y2 - k1) * (y2 - k1))

        return dist1 < dist2 ? new Point(x1, y1) : new Point(x2, y2)
    }

    /**
     * Finds the intersection point between a parabola and a line.
     * @param site The site of the parabola.
     * @param line The line represented as an object with 'a', 'b', and 'c' properties.
     * @returns The intersection point between the parabola and the line.
     */
    findParabolaLineIntersection(site: Point, line: { a: number, b: number, c: number }): Point {
        // Calculate the intersection point between a parabola and a line
        const a = line.a
        const b = line.b
        const c = line.c
        const x = site.x
        const y = site.y
        const discriminant = b * b - 4 * a * (c - y)
        const x1 = (-b + Math.sqrt(discriminant)) / (2 * a)
        const x2 = (-b - Math.sqrt(discriminant)) / (2 * a)
        const y1 = a * x1 * x1 + b * x1 + c
        const y2 = a * x2 * x2 + b * x2 + c
        const dist1 = Math.sqrt((x1 - x) * (x1 - x) + (y1 - y) * (y1 - y))
        const dist2 = Math.sqrt((x2 - x) * (x2 - x) + (y2 - y) * (y2 - y))
        return dist1 < dist2 ? new Point(x1, y1) : new Point(x2, y2)
    }

    /**
     * Adds a new parabolic arc to the beach line.
     * @param site The site of the new parabolic arc.
     * @returns The newly added parabolic arc.
     */
    addParabolicArc(site: Point): Arc {
        const newArc = new Arc(site)

        if (this.beachLine.length === 0) {
            this.beachLine.push(newArc)
            console.log("Beach line after adding arc:", this.beachLine)
        } else {
            let i = this.beachLine.length - 1
            while (i >= 0 && this.weightedDistance(this.beachLine[i].site, site) < 0) {
                i--
            }
            this.beachLine.splice(i + 1, 0, newArc)
            newArc.prev = this.beachLine[i]
            newArc.next = this.beachLine[i + 2]
            if (newArc.prev) newArc.prev.next = newArc
            if (newArc.next) newArc.next.prev = newArc
        }

        return newArc
    }

    /**
     * Removes a parabolic arc from the beach line.
     * @param arc The parabolic arc to remove.
     */
    removeParabolicArc(arc: Arc): void {
        console.log("Beach line before removing arc:", this.beachLine)
        console.log("Arc to remove:", arc)
        const index = this.beachLine.indexOf(arc)
        this.beachLine.splice(index, 1)


        if (arc.prev) arc.prev.next = arc.next
        if (arc.next) arc.next.prev = arc.prev
    }

    /**
     * Handles a site event by adding a new parabolic arc to the beach line.
     * @param event The site event to handle.
     */
    handleSiteEvent(event: DiagramEvent): void {
        const site = event.site
        if (site) {
            const newArc = this.addParabolicArc(site)

            const prevArc = newArc.prev
            const nextArc = newArc.next

            if (prevArc) {
                this.checkForCircleEvent(prevArc)
            }
            if (nextArc) {
                this.checkForCircleEvent(nextArc)
            }
        }
    }

    /**
     * Checks for circle events and adds them to the event queue.
     * @param arc The parabolic arc to check for circle events.
     */
    checkForCircleEvent(arc: Arc): void {
        if (!arc || !arc.prev || !arc.next) return

        const site1 = arc.prev.site
        const site2 = arc.site
        const site3 = arc.next.site

        const intersection = this.findIntersection(site1, site3)
        const distanceToSite2 = this.weightedDistance(site2, intersection)

        if (distanceToSite2 > 0) {
            const center = new Point(intersection.x, intersection.y)
            const radius = distanceToSite2
            const event = new DiagramEvent("circle", null, arc, center, radius)
            arc.circleEvent = event // Store the circle event in the arc
            this.events.push(event)
            this.events.sort((a, b) => a.radius - b.radius)
        }

        console.log("Checking circle event for sites:", site1, site2, site3)
        console.log("Intersection:", intersection)
        console.log("Distance to site2:", distanceToSite2)
    }

    /**
   * Handles a circle event by removing the corresponding parabolic arc from the beach line
   * and creating a new Voronoi vertex and edges.
   * @param event The circle event to handle.
   */
    handleCircleEvent(event: DiagramEvent): void {
        const arc = event.arc
        const vertex = event.center

        if (arc && vertex) {
            this.voronoiVertices.push(vertex)

            const prevArc = arc.prev
            const nextArc = arc.next

            if (prevArc) {
                const edge = new Edge(vertex)
                this.voronoiEdges.push(edge)
                prevArc.edge = edge
            }

            if (nextArc) {
                const edge = new Edge(vertex)
                this.voronoiEdges.push(edge)
                nextArc.edge = edge
            }

            this.removeParabolicArc(arc)

            if (prevArc) {
                this.checkForCircleEvent(prevArc)
            }
            if (nextArc) {
                this.checkForCircleEvent(nextArc)
            }
        }

        console.log("Handling circle event:", event)
        console.log("Parabolic arc:", arc)
        console.log("Voronoi vertex:", vertex)
    }

    /**
     * Computes the Weighted Voronoi diagram using Fortune's algorithm.
     */
    computeDiagram(): void {
        this.sites.sort((a, b) => a.y - b.y)

        console.log("Sorted sites:", this.sites)
        console.log("Initial events:", this.events)

        for (const site of this.sites) {
            const event = new DiagramEvent("site", site)
            this.events.push(event)
        }

        console.log("After site event creation:", this.events)

        while (this.events.length > 0) {
            const event = this.events.shift()

            if (event) {
                if (event.type === "site") {
                    this.handleSiteEvent(event)
                } else if (event.type === "circle") {
                    if (event === event.arc?.circleEvent) {
                        this.handleCircleEvent(event)
                    }
                }
            }
        }

        // Extend the edges to infinity
        for (const edge of this.voronoiEdges) {
            if (!edge.end) {
                const start = edge.start
                const direction = edge.twin && edge.start.x < edge.twin.start.x ? 1 : -1
                const endX = start.x + direction * 1e9
                const endY = edge.twin
                    ? start.y + (endX - start.x) * (edge.twin.start.y - start.y) / (edge.twin.start.x - start.x)
                    : start.y
                edge.end = new Point(endX, endY)
            }
            if (edge.twin && !edge.twin.end) {
                edge.twin.end = edge.start
            }
        }

        console.log("Voronoi vertices:", this.voronoiVertices)
        console.log("Voronoi edges:", this.voronoiEdges)
    }

    /**
     * Renders the Weighted Voronoi diagram on the provided canvas.
     * @param canvas The canvas element to render the diagram on.
     */
    render(canvas: HTMLCanvasElement): void {
        const ctx = canvas.getContext("2d")!

        console.log("Canvas width:", JSON.stringify(canvas.width))
        console.log("Canvas height:", JSON.stringify(canvas.height))
        console.log("Voronoi vertices:", JSON.stringify(this.voronoiVertices))
        console.log("Voronoi edges:", JSON.stringify(this.voronoiEdges))
        console.log("Sites:", JSON.stringify(this.sites))

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw the Voronoi edges
        ctx.strokeStyle = "black"
        ctx.lineWidth = 2
        for (const edge of this.voronoiEdges) {
            ctx.beginPath()
            ctx.moveTo(edge.start.x, edge.start.y)
            if (edge.end) {
                ctx.lineTo(edge.end.x, edge.end.y)
            }
            ctx.stroke()
        }

        // Draw the Voronoi vertices
        ctx.fillStyle = "red"
        for (const vertex of this.voronoiVertices) {
            ctx.beginPath()
            ctx.arc(vertex.x, vertex.y, 3, 0, 2 * Math.PI)
            ctx.fill()
        }

        // Draw the sites
        ctx.fillStyle = "blue"
        for (const site of this.sites) {
            ctx.beginPath()
            ctx.arc(site.x, site.y, 5, 0, 2 * Math.PI)
            ctx.fill()
        }
    }
}