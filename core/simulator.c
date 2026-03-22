#include <stdio.h>
#include "simulator.h"
#include "math_utils.h"
#include "model.h"

SimulationOutput run_simulation(const SimulationInput *input){
    SimulationOutput output={0};
    output.received_power = calc_attenuation(input->input_power, input->medium->attenuation_db_per_km, input->distance);
    output.noise_power = calc_thermal_noise(input->bandwidth, input->temperature);
    output.snr = calc_snr(output.received_power, output.noise_power);
    output.snr_db = calc_snr_db(output.snr);
    output.nyquist_rate = calc_nyquist(input->bandwidth, input->levels);
    output.shannon_capacity = calc_shannon(input->bandwidth, output.snr);
    
    return output;
}