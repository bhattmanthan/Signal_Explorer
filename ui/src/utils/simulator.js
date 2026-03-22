export const EPSILON = 1e-12;
export const K_BOLTZMAN = 1.38064852e-23;

export const TWISTED_PAIR = { name: "Twisted Pair", attenuationDbPerKm: 0.2, maxBandwidth: 100e6 };
export const FIBER_OPTIC = { name: "Fiber Optic", attenuationDbPerKm: 0.05, maxBandwidth: 10e9 };
export const MEDIUMS = [TWISTED_PAIR, FIBER_OPTIC];

export function dbToLinear(db) {
    return Math.pow(10, db / 10);
}

export function linearToDb(val) {
    if (val < EPSILON) val = EPSILON;
    return 10 * Math.log10(val);
}

export function celToKel(c) {
    return c + 273.15;
}

export function calcAttenuation(P0, alphaDb, distance) {
    const totalLossDb = alphaDb * distance;
    if (P0 < EPSILON) return 0;
    return P0 * Math.pow(10, -totalLossDb / 10);
}

export function calcThermalNoise(bandwidth, temperature) {
    return K_BOLTZMAN * temperature * bandwidth;
}

export function calcSnr(signal, noise) {
    if (noise < EPSILON) return 1e12;
    return signal / noise;
}

export function calcSnrDb(snr) {
    return 10 * Math.log10(snr);
}

export function calcNyquist(bandwidth, levels) {
    return 2 * bandwidth * Math.log2(levels);
}

export function calcShannon(bandwidth, snr) {
    if (snr < EPSILON) snr = EPSILON;
    return bandwidth * Math.log2(1 + snr);
}
