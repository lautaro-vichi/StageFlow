//en utils las funciones de validacion deben devolver true or false (BOOLEAN)

export function isValidDateRange(start, end){

    if (!start || !end) return false;

    let inicio = new Date(start);
    let fin = new Date(end);

   return fin > inicio; //devuelve true si fin es mayor a inicio, o false si no
};

export function isValidStock(total, available){
    if (!total || !available) return false;
    
    const pedido = Number(total);
    const disponible = Number(available);
    if (isNaN(pedido) || isNaN(disponible)) return false;
    return disponible >= 0 && pedido >= 0 && disponible <= pedido;

};

