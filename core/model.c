#include "math_utils.h"
#include "model.h"
#include <math.h>

// #define TWISTED_PAIR (Medium){"Twisted Pair", 0.2, 100e6}
// #define FIBER_OPTIC (Medium){"Fiber Optic", 0.05, 10e9}
Medium TWISTED_PAIR={"Twisted Pair",0.2,100e6};
Medium FIBER_OPTIC={"Fiber Optic",0.05,10e9};
double calc_attenuation(double P0,double alpha_db,double distance){
    double total_loss_db=alpha_db*distance;
    if(P0<EPSILON) return 0;
    return P0*pow(10,-total_loss_db/10); //distance -> km
}

double calc_thermal_noise(double bandwidth,double temperature){
    return K_BOLTZMAN*temperature*bandwidth;
}

double calc_snr(double signal,double noise){
    if(noise<EPSILON) return 1e12;//Avois division by zero
    return signal/noise;
}

double calc_snr_db(double snr){
    return 10*log10(snr);
}

double calc_nyquist(double bandwidth,int levels){
    return 2*bandwidth*log2(levels);
}

double calc_shannon(double bandwidth,double snr){
    if (snr<EPSILON) return snr=EPSILON;
    
    return bandwidth*log2(1+snr);
}