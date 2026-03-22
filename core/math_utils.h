#ifndef MATH_UTILS_H
#define MATH_UTILS_H

#define EPSILON 1e-12
#define K_BOLTZMAN 1.38064852e-23 // Boltzmann constant in J/K
#define REF_POWER 1e-3 //for dBm

double db_to_linear(double db);
double linear_to_db(double val);
double power_to_db(double power);
double db_to_power(double db);
double generate_noise(double noise_power);
double cel_to_kel(double c);

#endif
