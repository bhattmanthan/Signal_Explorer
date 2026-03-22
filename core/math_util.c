#include "math_utils.h"
#include <stdlib.h>
#include <math.h>
#include <time.h>

double db_to_linear(double db) {
    return pow(10, db / 10);
}

double linear_to_db(double val){
    if(val<EPSILON)val=EPSILON;
    return 10*log10(val);
}

double power_to_db(double power){
    if(power<EPSILON) power=EPSILON;
    return 10*log10(power/REF_POWER);
}

double db_to_power(double db){
    return REF_POWER*pow(10,db/10);
}

double generate_noise(double noise_power){
    double r = (double)rand() / RAND_MAX;   // [0,1]
    return noise_power * r;
}

double cel_to_kel(double c){
    return c+273.15;
}