<script lang="ts">
import { onMount } from "svelte"
// import { WeightedVoronoi, type Site } from "$lib/gpt2"
import { computePowerDiagram, render_weighted_voronoi, type Site } from "$lib/power_diagram"

let canvas: HTMLCanvasElement

const width = 800
const height = 800

const boundingPolygon = [
    { x: 0, y: 0 },
    { x: 0, y: height },
    { x: width, y: height },
    { x: width, y: 0 },
]
// const boundingPolygon = [
//     [0, 0],
//     [0, height],
//     [width, height],
//     [width, 0],
// ]

const sites: Site[] = [
    { x: 50, y: 200, weight: 100 },
    { x: 100, y: 100, weight: 10 },
    { x: 400, y: 200, weight: 4000 },
    { x: 400, y: 400, weight: 100 },
    { x: 400, y: 400, weight: 100 },
    { x: 100, y: 500, weight: 200 },
    { x: 200, y: 200, weight: 400 },
    { x: 500, y: 500, weight: 600 },
]

// console.log("Sites:", sites)
// console.log("Bounding Polygon:", boundingPolygon)

computePowerDiagram(sites)


onMount(() => {
    render_weighted_voronoi(sites, boundingPolygon, canvas)
})


// let voronoi = new WeightedVoronoi(
//     [
//         { x: 0, y: 0, weight: 1 },
//         { x: 100, y: 100, weight: 1 },
//         { x: 400, y: 200, weight: 1 },
//         { x: 300, y: 300, weight: 1 },
//         { x: 400, y: 400, weight: 1 },
//         { x: 100, y: 500, weight: 1 },
//     ], width, height)

// const sites: Site[] = [
//     { x: 0, y: 0, weight: 1 },
//     { x: 100, y: 100, weight: 1 },
//     { x: 200, y: 200, weight: 1 },
//     { x: 300, y: 300, weight: 1 },
//     { x: 400, y: 400, weight: 1 },
//     { x: 500, y: 500, weight: 1 },
// // ...
// ]
// let voronoi = new WeightedVoronoi(
//     [[0, 0], [0, height], [width, height], [width, 0]],
//     sites)
// let voronoi = new PowerDiagram(sites, [
//     new Point(0, 0),
//     new Point(0, height),
//     new Point(width, height),
//     new Point(width, 0)
// ])

// voronoi.compute()

// onMount(() => {
//     voronoi.render(canvas)
// })
</script>

<canvas
    bind:this={ canvas }
    height={height}
    width={width}
/>