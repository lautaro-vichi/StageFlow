#include <stdio.h>

int main(){

    int i = 1; num, contador = 0;
    
    printf("Ingrese un número: ");
    scanf("%d", &num);
    
    while(i <= num){
        if(num % i == 0){
            contador++;
        }
    }
    
    if(contador == 2){
        printf("Número primo\n");
    } else {
        printf("Número no primo\n");
    }
    
return 0;
}