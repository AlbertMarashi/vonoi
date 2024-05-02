
export type Point = { x: number, y: number };
export type Site = Point & { weight: number };
export type Edge = { start: Point, end: Point };
export type Cell = { site: Site, edges: Edge[] };

export class WeightedVoronoi {
    private sites: Site[]
    private bounds: { width: number, height: number }

    constructor(sites: Site[], width: number, height: number) {
        this.sites = sites
        this.bounds = { width, height }
    }

    public computeDiagram(): Cell[] {
        const cells: Cell[] = this.sites.map(site => ({ site: site, edges: [] }))

        for (let i = 0; i < this.sites.length; i++) {
            const site1 = this.sites[i]
            for (let j = i + 1; j < this.sites.length; j++) {
                const site2 = this.sites[j]

                const dx = site2.x - site1.x
                const dy = site2.y - site1.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                const aw = (site2.weight - site1.weight) / dist

                // Midpoint adjusted by weight difference
                const mx = (site1.x + site2.x) / 2 + aw * dx
                const my = (site1.y + site2.y) / 2 + aw * dy

                const perpendicularSlope = -dx / dy
                const b = my - perpendicularSlope * mx

                // Extend the line to bounds
                const start = { x: 0, y: b }
                const end = { x: this.bounds.width, y: perpendicularSlope * this.bounds.width + b }

                cells[i].edges.push({ start: start, end: end })
                cells[j].edges.push({ start: start, end: end })
            }
        }

        return cells
    }

    public render(canvas: HTMLCanvasElement): void {
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        this.sites.forEach(site => {
            ctx.beginPath()
            ctx.arc(site.x, site.y, 5, 0, 2 * Math.PI, false)
            ctx.fill()
        })

        const cells = this.computeDiagram()
        cells.forEach(cell => {
            cell.edges.forEach(edge => {
                ctx.beginPath()
                ctx.moveTo(edge.start.x, edge.start.y)
                ctx.lineTo(edge.end.x, edge.end.y)
                ctx.stroke()
            })
        })
    }
}
