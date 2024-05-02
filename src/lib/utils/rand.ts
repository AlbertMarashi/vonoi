import Alea from "alea"

export const base_prng = Alea(200)
export const prng = Alea(200)
prng.importState(base_prng.exportState())