<script lang="ts">
import { init_random_towns } from "$lib/map/town"
import { onMount, tick } from "svelte"
import { Map } from "$lib/map/map"


let canvas: HTMLCanvasElement
let width: number
let height: number
onMount(async () => {
    width = canvas.clientWidth
    height = canvas.clientHeight
    await tick()


    const map = new Map()
    let towns = init_random_towns(
        20,
        20,
        map.width,
        map.height
    )
    towns[0].population = 10000
    towns.map(town => map.add_town(town))

    map.render(canvas)
    map.render(canvas)
})
</script>
<canvas
    bind:this={ canvas }
    height={height}
    width={width}/>
<style>
canvas {
    flex: 1;
    width: calc(100% - 0px);
    height: calc(100% - 0px);
}
</style>