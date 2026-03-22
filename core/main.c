#include <stdio.h>
#include <stdlib.h>
#include "simulator.h"
#include "model.h"
#include "math_utils.h"

int main(int argc, char *argv[]){
    if (argc != 7) {
        fprintf(stderr, "Usage: %s <distance_km> <temp_c> <bandwidth_hz> <levels> <input_power_dbw> <medium_idx>\n", argv[0]);
        return 1;
    }

    double distance = atof(argv[1]);
    double temp_c = atof(argv[2]);
    double bandwidth = atof(argv[3]);
    int levels = atoi(argv[4]);
    double input_power_db = atof(argv[5]);
    int medium_idx = atoi(argv[6]);

    SimulationInput input = {
        .distance = distance,
        .temperature = cel_to_kel(temp_c),
        .bandwidth = bandwidth,
        .levels = levels,
        .input_power = db_to_power(input_power_db),
        .medium = (medium_idx == 0) ? &TWISTED_PAIR : &FIBER_OPTIC
    };

    SimulationOutput output = run_simulation(&input);

    printf("{\n");
    printf("  \"receivedPower\": %e,\n", output.received_power);
    printf("  \"noisePower\": %e,\n", output.noise_power);
    printf("  \"snr\": %e,\n", output.snr);
    printf("  \"snrDb\": %f,\n", output.snr_db);
    printf("  \"nyquistRate\": %f,\n", output.nyquist_rate);
    printf("  \"shannonCapacity\": %f\n", output.shannon_capacity);
    printf("}\n");

    return 0;
}