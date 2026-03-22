#ifndef SIMULATOR_H
#define SIMULATOR_H

#include "model.h"

typedef struct {
    double distance;
    double temperature;
    double bandwidth;
    int levels;
    double input_power;
    const Medium *medium;
} SimulationInput;

typedef struct{
    double received_power;
    double noise_power;
    double snr;
    double snr_db;
    double nyquist_rate;
    double shannon_capacity;
} SimulationOutput;

SimulationOutput run_simulation(const SimulationInput *input);

#endif