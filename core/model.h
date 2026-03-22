#ifndef MODEL_H
#define MODEL_H

#include <stddef.h>

double calc_attenuation(double P0,double alpha_db, double distance);
double calc_thermal_noise(double bandwidth,double temperature);
double calc_snr(double signal,double noise);
double calc_snr_db(double snr);
double calc_nyquist(double bandwidth,int levels);
double calc_shannon(double bandwidth,double snr);

typedef struct{
    const char name[50];
    double attenuation_db_per_km;
    double max_bandwidth;
}Medium;

extern Medium TWISTED_PAIR;
extern Medium FIBER_OPTIC;

#endif