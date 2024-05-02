import type { Point2D } from "./power_diagram"

// Sutherland-Hodgman polygon clipping algorithm
export function clipPolygon(polygon: Point2D[], clippingBoundary: Point2D[]): Point2D[] {
    let outputList = polygon

    function inside(p: Point2D, edgeStart: Point2D, edgeEnd: Point2D): boolean {
        // Calculate cross product to determine if the point is inside the boundary
        return (edgeEnd.x - edgeStart.x) * (p.y - edgeStart.y) > (edgeEnd.y - edgeStart.y) * (p.x - edgeStart.x)
    }

    function computeIntersection(start: Point2D, end: Point2D, edgeStart: Point2D, edgeEnd: Point2D): Point2D {
        const dx = end.x - start.x
        const dy = end.y - start.y
        const edgeDx = edgeEnd.x - edgeStart.x
        const edgeDy = edgeEnd.y - edgeStart.y
        const denom = dx * edgeDy - dy * edgeDx
        if (denom === 0) return { x: 0, y: 0 } // Lines are parallel
        const t = ((start.x - edgeStart.x) * edgeDy - (start.y - edgeStart.y) * edgeDx) / denom
        return { x: start.x + t * dx, y: start.y + t * dy }
    }

    // Process each edge of the clipping boundary
    for (let i = 0; i < clippingBoundary.length; i++) {
        const edgeStart = clippingBoundary[i]
        const edgeEnd = clippingBoundary[(i + 1) % clippingBoundary.length]

        const inputList = outputList
        outputList = []

        let S = inputList[inputList.length - 1] // Last point in the list

        for (const E of inputList) {
            if (inside(E, edgeStart, edgeEnd)) {
                if (!inside(S, edgeStart, edgeEnd)) {
                    outputList.push(computeIntersection(S, E, edgeStart, edgeEnd))
                }
                outputList.push(E)
            } else if (inside(S, edgeStart, edgeEnd)) {
                outputList.push(computeIntersection(S, E, edgeStart, edgeEnd))
            }
            S = E
        }
    }
    return outputList
}