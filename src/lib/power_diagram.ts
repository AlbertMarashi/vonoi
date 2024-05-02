import quickhull3d from "quickhull3d"
import { clipPolygon } from "./poly_clip"
let qh = quickhull3d

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof quickhull3d !== "function") qh = (quickhull3d as any).default as typeof quickhull3d

export type Site = { weight: number } & Point2D
export type Point2D = { x: number; y: number }
export type Point3D = {
    z: number;
} & Point2D
export type Polygon = Array<{ x: number; y: number }>
export type Plane = { a: number; b: number; c: number, d: number}

// Transform 2D weighted sites into 3D points for convex hull computation
function transformSiteTo3D(site: Site): Point3D {
    const { x, y, weight } = site
    const r = Math.sqrt(weight) // radius based on the weight
    return {
        x: x,
        y: y,
        z: 2 * (x * y) - (x**2 + y**2) + r**2
    }
}

function delta(plane: Plane): Point3D {
    return {
        x: plane.a / 2,
        y: plane.b / 2,
        z: -plane.c
    }
}

function transformSiteToDualSpace(site: Site): Point3D {
    const { x, y, weight } = site
    const r = Math.sqrt(weight) // radius based on the weight
    return {
        x: x,
        y: y,
        z: x**2 + y**2 - r**2
    }
}


function computeNormal(p1: Point3D, p2: Point3D, p3: Point3D): Point3D {
    const v1 = p2.x - p1.x
    const v2 = p2.y - p1.y
    const v3 = p2.z - p1.z
    const w1 = p3.x - p1.x
    const w2 = p3.y - p1.y
    const w3 = p3.z - p1.z
    const nx = v2 * w3 - v3 * w2
    const ny = v3 * w1 - v1 * w3
    const nz = v1 * w2 - v2 * w1
    return { x: nx, y: ny, z: nz }
}

// function computePlane(p1: Point3D, p2: Point3D, p3: Point3D): Plane {
//     const v1 = p2.x - p1.x
//     const v2 = p2.y - p1.y
//     const v3 = p2.z - p1.z
//     const w1 = p3.x - p1.x
//     const w2 = p3.y - p1.y
//     const w3 = p3.z - p1.z
//     const nx = v2 * w3 - v3 * w2
//     const ny = v3 * w1 - v1 * w3
//     const nz = v1 * w2 - v2 * w1
//     return { a: nx, b: ny, c: nz }
// }

function mapTo2D(point: Point3D): Point2D {
    return {
        x: point.x,
        y: point.y
    }
}

/**
Input:
    Ω: Convex polygon
    S: Set of n unique sites
    W: Set of weights

Data:
    L: Double connected edge list (convex hull), derived from sequence of faces F(s*) for each s* in S*, where F(s*) = (f1, ..., fk)
    F: List of the triangulated faces in L

Output:
    Power diagram V(S) with n polygons

Begin:
    1. If n < 4 then
        - Compute V(S) by intersecting the bisectors
        - Return V(S) intersect Ω
    2. Else
        - S* ← Union over s in S of Δ(Π(s))
        - {F(s*) : s* ∈ S*} ← convexHull(S*)
        - V(S) ← {}
        - F ← {f ∈ F : normal nf = (x, y, z) with z < 0}
        - For each s* in S* do
            (f1, f2, ..., fk) ← F(s*) \ F
            P ← (∆(f1), ∆(f2), ..., ∆(fk))
            For each p = (x, y, z) in P do
                p ← (x, y)
            V(S) ← V(S) ∪ {P}
        - Return V(S) intersect Ω
End

 */
export function computePowerDiagram(sites: Site[]): Point2D[][] {
    const dualPoints = sites.map(site => transformSiteToDualSpace(site))
    const hull = qh(dualPoints.map(p => [p.x, p.y, p.z]))
    const hull_triangles = hull.map(f => f.map(i => dualPoints[i]))
    const lower_faces = hull_triangles.filter(f => computeNormal(...f as [Point3D, Point3D, Point3D]).z < 0)
    const cells: Point2D[][] = []
    for (const site of sites) {
        const relevantFaces = lower_faces.filter(f => f.some(p => p.x === site.x && p.y === site.y))
        const points = relevantFaces.map(([p1, p2, p3]) => delta(calculatePlaneCoefficients(p1, p2, p3)))
            .map(p => mapTo2D(p))

        cells.push(points)

        console.log("points", points)
    }

    return cells
}

// Compute the convex hull and extract the lower envelope (lower convex hull)
function computeConvexHull(sites: Site[]): Point3D[][] {
    // S∗ ← ⋃s∈S ∆(Π(s))
    // This is the set of all sites that have been transformed into 3D
    const points3D = sites.map(transformSiteTo3D)

    // {F(s∗) : s∗ ∈ S∗ } ← convexHull(S*)
    // This is the convex hull of the set of points transformed to 3D
    const hull = qh(points3D.map(p => [p.x, p.y, p.z]))
        .map(f => f.map(i => points3D[i]))

    return hull
}

function calculatePlaneCoefficients(P1: Point3D, P2: Point3D, P3: Point3D): Plane {

    const alpha = P1.y * (P2.z - P3.z) + P2.y * (P3.z - P1.z) + P3.y * (P1.z - P2.z)
    const beta = P1.z * (P2.x - P3.x) + P2.z * (P3.x - P1.x) + P3.z * (P1.x - P2.x)
    const gamma = P1.x * (P2.y - P3.y) + P2.x * (P3.y - P1.y) + P3.x * (P1.y - P2.y)
    const delta = P1.x * (P2.y * P3.z - P3.y * P2.z) + P2.x * (P3.y * P1.z - P1.y * P3.z) + P3.x * (P1.y * P2.z - P2.y * P1.z)

    return {
        a: -alpha / gamma,
        b: -beta / gamma,
        c: delta / gamma,
        d: delta / gamma
    }

}

export function render_weighted_voronoi(sites: Site[], boundingPolygon: Point2D[], canvas: HTMLCanvasElement): void {
    const diagram = computePowerDiagram(sites)

    // const powerDiagram = diagram.map(d => clipPolygon(d, boundingPolygon))
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw the bounding polygon
    ctx.beginPath()
    ctx.moveTo(boundingPolygon[0].x, boundingPolygon[0].y)
    for (let i = 1; i < boundingPolygon.length; i++) {
        ctx.lineTo(boundingPolygon[i].x, boundingPolygon[i].y)
    }
    ctx.closePath()
    ctx.strokeStyle = "black"
    ctx.stroke()

    // Draw the power diagram cells
    const colors = ["#FF000088", "#00FF0088", "#0000FF88", "#FFFF0088", "#FF00FF88", "#00FFFF88"]
    diagram.map(cell => {
        console.log("cell", cell)
    })


    diagram.map((cell, index) => {
        ctx.beginPath()
        cell.map(p => ctx.lineTo(p.x, p.y))
        ctx.moveTo(cell[0].x, cell[0].y)
        ctx.closePath()
        ctx.fillStyle = colors[index % colors.length]
        ctx.fill()
        ctx.strokeStyle = "blue"
        ctx.stroke()
    })



    // Draw the sites
    sites.forEach(site => {
        ctx.beginPath()
        ctx.arc(site.x, site.y, 6, 0, 2 * Math.PI)
        ctx.fillStyle = "black"
        ctx.fill()
    })

    // render a point at each cell vertex
    diagram.map(cell =>
        cell.map(p => {
            ctx.beginPath()
            ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI)
            ctx.fillStyle = "red"
            ctx.fill()
        })
    )
}