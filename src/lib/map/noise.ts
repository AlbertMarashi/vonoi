import { prng } from "$lib/utils/rand"
import { createNoise2D } from "simplex-noise"

export const noise = createNoise2D(prng)

// controls the scale of the noise
const scale = 0.008
const continentialness_scale = 0.001
export function get_noise(x: number, y: number): number {
    return ((noise(x * scale, y * scale) + 1) / 2)
        * ((noise(x * continentialness_scale, y * continentialness_scale) + 1) / 2)
        * ((noise(x * continentialness_scale - 20, y * continentialness_scale - 20) + 1) / 2)
        * ((noise(x * continentialness_scale - 40, y * continentialness_scale - 40) + 1) / 2)

}
//     const base_noise = noise(x * base_scale, y * base_scale) + 1
//     const continentialness = noise(x * continentialness_scale, y * continentialness_scale) + 1
//     const continentualness_two = noise(x * continentialness_scale - 20, y * continentialness_scale - 20) + 1

//     return base_noise / 2
//         * continentialness ** 2
// }

export function render_noise(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
            const value = get_noise(x, y)
            const color = value * 255
            data[4 * (x + y * canvas.width)] = color
            data[4 * (x + y * canvas.width) + 1] = color
            data[4 * (x + y * canvas.width) + 2] = color
            data[4 * (x + y * canvas.width) + 3] = 255
        }
    }

    ctx.putImageData(imageData, 0, 0)
}