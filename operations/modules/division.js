// =======================================================
// --- operations/modules/division.js (VERSIÓN FINAL, REV. II) ---
// Contiene la lógica y la visualización para la operación de división.
// `divide`: Muestra el proceso completo de la división larga (extendida).
// `divideExt`: Muestra el layout clásico de la división finalizada (usual).
// =======================================================
"use strict";

import { calculateLayout } from '../utils/layout-calculator.js';
import { crearCelda } from '../utils/dom-helpers.js';
import { salida, errorMessages } from '../../config.js';

/**
 * Función de cálculo que genera un array de todos los elementos a dibujar
 * para la división paso a paso (modo extendido).
 * Retorna productos y restos para cada paso.
 * @param {string} dividendoStr
 * @param {string} divisorStr
 * @returns {{cociente: string, displaySteps: Array<object>, totalRows: number}}
 */
function calculateDisplaySteps(dividendoStr, divisorStr) {
    const divisor = BigInt(divisorStr);
    const cocienteCompleto = (BigInt(dividendoStr) / divisor).toString();
    
    const displaySteps = [];
    let currentRow = 0; // Fila visual
    let posicionEnDividendo = 0; // Índice exclusivo del último dígito del dividendo usado/considerado

    // 1. Añadir el dividendo inicial
    displaySteps.push({ 
        text: dividendoStr, 
        row: currentRow, 
        colEnd: dividendoStr.length, 
        type: 'dividendo' 
    });
    currentRow++;

    let restoActual = 0n; // El número actual que estamos tratando de dividir

    // Caso especial: si el dividendo es menor que el divisor (cociente 0)
    if (BigInt(dividendoStr) < divisor) {
        displaySteps.push({ 
            text: '0', 
            row: currentRow, 
            colEnd: dividendoStr.length, 
            type: 'producto' 
        });
        currentRow++;
        displaySteps.push({ 
            text: dividendoStr, 
            row: currentRow, 
            colEnd: dividendoStr.length, 
            type: 'resto' 
        });
        currentRow++;
        return { 
            cociente: "0", 
            displaySteps, 
            totalRows: currentRow 
        };
    }

    // Procesar cada dígito del cociente
    for (let i = 0; i < cocienteCompleto.length; i++) {
        // "Bajar" dígitos hasta que `restoActual` sea suficiente para dividir.
        // `posicionEnDividendo` avanza para indicar qué parte del dividendo se está usando.
        while (posicionEnDividendo < dividendoStr.length && restoActual < divisor) {
            restoActual = restoActual * 10n + BigInt(dividendoStr[posicionEnDividendo]);
            posicionEnDividendo++;
        }

        const digitoCociente = BigInt(cocienteCompleto[i]);
        const producto = digitoCociente * divisor;
        const nuevoResto = restoActual - producto;

        // Añadir el producto a restar
        displaySteps.push({ 
            text: producto.toString(), 
            row: currentRow, 
            colEnd: posicionEnDividendo, 
            type: 'producto' 
        });
        currentRow++;

        // Añadir el resto del paso actual
        displaySteps.push({ 
            text: nuevoResto.toString(), 
            row: currentRow, 
            colEnd: posicionEnDividendo, 
            type: 'resto' 
        });
        restoActual = nuevoResto; // Actualizar restoActual para la siguiente iteración
        currentRow++;
    }

    return { 
        cociente: cocienteCompleto, 
        displaySteps, 
        totalRows: currentRow 
    };
}

/**
 * Función de cálculo que genera un array de elementos para la "división corta".
 * Retorna solo el dividendo inicial y los restos intermedios/finales con los dígitos bajados.
 * @param {string} dividendoStr
 * @param {string} divisorStr
 * @returns {{cociente: string, displaySteps: Array<object>, totalRows: number}}
 */
function calculateShortDivisionSteps(dividendoStr, divisorStr) {
    const divisor = BigInt(divisorStr);
    const cocienteCompleto = (BigInt(dividendoStr) / divisor).toString();
    
    const shortDisplaySteps = [];
    let currentRow = 0;

    // 1. Añadir el dividendo inicial
    shortDisplaySteps.push({ 
        text: dividendoStr, 
        row: currentRow, 
        colEnd: dividendoStr.length, 
        type: 'dividendo' 
    });
    currentRow++; // Fila visual 0 para el dividendo

    let currentNumberToDivide = 0n;
    let posicionEnDividendo = 0; // Índice exclusivo del último dígito del dividendo usado/considerado

    // Determinar el primer segmento a dividir (ej., para 945/5, es 9; para 654/8, es 65)
    // Se toma un dígito a la vez hasta que `currentNumberToDivide` sea >= `divisor`
    while (posicionEnDividendo < dividendoStr.length) {
        currentNumberToDivide = currentNumberToDivide * 10n + BigInt(dividendoStr[posicionEnDividendo]);
        posicionEnDividendo++;
        if (currentNumberToDivide >= divisor) break;
        // Si el cociente completo ya tiene un dígito y aún no hemos bajado suficientes dígitos
        // significa que los dígitos iniciales eran muy pequeños y el cociente comienza con un 0.
        // Pero para la división corta, bajamos hasta que sea divisible.
        if (posicionEnDividendo === dividendoStr.length && currentNumberToDivide < divisor && cocienteCompleto === "0") {
             // Caso como 5/10, donde no se puede dividir y el cociente es 0, y el resto es 5.
             // Aquí currentNumberToDivide es el dividendo original.
             break;
        }
    }
    
    // Si el dividendo es menor que el divisor, el cociente es 0 y el resto es el dividendo.
    if (BigInt(dividendoStr) < divisor) {
        // Ya se añadió el dividendo en la row 0. El resto es el dividendo.
        // `calculateDisplaySteps` ya maneja esto, pero `calculateShortDivisionSteps` lo simplifica.
        shortDisplaySteps.push({ 
            text: dividendoStr, 
            row: currentRow, 
            colEnd: dividendoStr.length, 
            type: 'resto' 
        });
        currentRow++;
        return { 
            cociente: "0", 
            displaySteps: shortDisplaySteps, 
            totalRows: currentRow 
        };
    }

    // Loop a través de cada dígito del cociente
    for (let i = 0; i < cocienteCompleto.length; i++) {
        const digitoCociente = BigInt(cocienteCompleto[i]);
        const producto = digitoCociente * divisor;
        const remainderFromPreviousCalc = currentNumberToDivide - producto;

        let numberToShowAsResto;
        let colEndForResto;

        if (posicionEnDividendo < dividendoStr.length) {
            // Aún hay dígitos para bajar
            numberToShowAsResto = remainderFromPreviousCalc * 10n + BigInt(dividendoStr[posicionEnDividendo]);
            colEndForResto = posicionEnDividendo + 1; 
            posicionEnDividendo++; // Mover al siguiente dígito del dividendo
        } else {
            // Último paso, este es el resto final
            numberToShowAsResto = remainderFromPreviousCalc;
            colEndForResto = posicionEnDividendo;
        }

        shortDisplaySteps.push({
            text: numberToShowAsResto.toString(),
            row: currentRow, // Cada resto en una nueva fila visual
            colEnd: colEndForResto, 
            type: 'resto' 
        });
        currentRow++;
        
        currentNumberToDivide = numberToShowAsResto; // El resto actual es el número para la siguiente división
    }

    return { 
        cociente: cocienteCompleto, 
        displaySteps: shortDisplaySteps, 
        totalRows: currentRow 
    };
}

/**
 * `drawHeader`: Dibuja la parte superior de la división con el formato de galera latinoamericano.
 * @param {DocumentFragment} fragment
 * @param {object} params
 */
function drawHeader(fragment, { divisorStr, cociente, tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, xBloqueDerecho, anchoIzquierdo, separatorWidth }) {
    const yPosTopRow = paddingTop;
    const yPosCociente = paddingTop + tamCel;

    // Dibujar divisor
    for (let i = 0; i < divisorStr.length; i++) {
        fragment.appendChild(crearCelda("output-grid__cell output-grid__cell--divisor", divisorStr[i], {
            left: `${xBloqueDerecho + i * tamCel}px`, 
            top: `${yPosTopRow}px`, 
            width: `${tamCel}px`, 
            height: `${tamCel}px`, 
            fontSize: `${tamFuente}px`
        }));
    }

    // Calcular posiciones de las líneas
    const xLineaVertical = offsetHorizontal + anchoIzquierdo * tamCel + (separatorWidth / 2) * tamCel + paddingLeft;
    // El ancho del bloque derecho es variable, usamos cociente.length
    const xEndOfRightBlock = xBloqueDerecho + Math.max(divisorStr.length, cociente.length) * tamCel; 
    const anchoLineasHorizontales = xEndOfRightBlock - xLineaVertical;

    // Línea vertical de la galera
    fragment.appendChild(crearCelda("output-grid__line", "", {
        left: `${xLineaVertical}px`, 
        top: `${yPosTopRow}px`, 
        width: `2px`, 
        height: `${tamCel}px`
    }));
    
    // Línea horizontal (entre divisor y cociente)
    fragment.appendChild(crearCelda("output-grid__line", "", {
        left: `${xLineaVertical}px`, 
        top: `${yPosCociente}px`, 
        width: `${anchoLineasHorizontales}px`, 
        height: `2px`
    }));

    // Dibujar cociente
    for (let i = 0; i < cociente.length; i++) {
        fragment.appendChild(crearCelda("output-grid__cell output-grid__cell--cociente", cociente[i], {
            left: `${xBloqueDerecho + i * tamCel}px`, 
            top: `${yPosCociente}px`, 
            width: `${tamCel}px`, 
            height: `${tamCel}px`, 
            fontSize: `${tamFuente}px`
        }));
    }
}

/**
 * `renderFullDivisionSteps`: Dibuja los pasos completos de la división (productos con '-' y líneas).
 * @param {DocumentFragment} fragment
 * @param {Array<object>} displaySteps - Array de objetos con {text, row, colEnd, type}
 * @param {object} layoutParams - Contiene tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, signColumnOffset
 */
function renderFullDivisionSteps(fragment, displaySteps, { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, signColumnOffset }) {
    displaySteps.forEach(step => {
        // El dividendo inicial se maneja de forma especial, se dibuja en la fila 0.
        // Los otros pasos se posicionan según su `row` calculada.
        const yStart = paddingTop + step.row * tamCel;
        const clase = `output-grid__cell output-grid__cell--${step.type}`;

        if (step.type === 'dividendo') {
             // El dividendo va al inicio del bloque izquierdo
            const xStart = offsetHorizontal + 0 * tamCel + paddingLeft; 
            for (let i = 0; i < step.text.length; i++) {
                fragment.appendChild(crearCelda(clase, step.text[i], {
                    left: `${xStart + i * tamCel}px`, 
                    top: `${yStart}px`,
                    width: `${tamCel}px`, 
                    height: `${tamCel}px`, 
                    fontSize: `${tamFuente}px`
                }));
            }
        } else {
            // Para productos y restos, `colEnd` indica dónde termina el número en relación al dividendo original.
            // Restamos `text.length` para encontrar el inicio y agregamos `signColumnOffset` para el espacio del signo.
            const colStart = step.colEnd - step.text.length + signColumnOffset;
            const xStart = offsetHorizontal + colStart * tamCel + paddingLeft;

            for (let i = 0; i < step.text.length; i++) {
                fragment.appendChild(crearCelda(clase, step.text[i], {
                    left: `${xStart + i * tamCel}px`, 
                    top: `${yStart}px`,
                    width: `${tamCel}px`, 
                    height: `${tamCel}px`, 
                    fontSize: `${tamFuente}px`
                }));
            }

            // Si es un producto, añadir el signo menos y la línea
            if (step.type === 'producto') {
                fragment.appendChild(crearCelda("output-grid__cell output-grid__cell--producto", "-", {
                    left: `${xStart - tamCel}px`, 
                    top: `${yStart}px`,
                    width: `${tamCel}px`, 
                    height: `${tamCel}px`, 
                    fontSize: `${tamFuente}px`
                }));
                
                fragment.appendChild(crearCelda("output-grid__line", "", {
                    left: `${xStart}px`, 
                    top: `${yStart + tamCel}px`,
                    width: `${step.text.length * tamCel}px`, 
                    height: `2px`
                }));
            }
        }
    });
}

/**
 * `renderShortDivisionSteps`: Dibuja los pasos de la división corta (solo dividendos y restos, sin productos ni líneas).
 * @param {DocumentFragment} fragment
 * @param {Array<object>} displaySteps - Array de objetos con {text, row, colEnd, type} (de `calculateShortDivisionSteps`)
 * @param {object} layoutParams - Contiene tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, signColumnOffset (que aquí será 0)
 */
function renderShortDivisionSteps(fragment, displaySteps, { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, signColumnOffset }) {
    displaySteps.forEach(step => {
        const yStart = paddingTop + step.row * tamCel;
        const clase = `output-grid__cell output-grid__cell--${step.type}`;

        // La `colEnd` de `calculateShortDivisionSteps` es el índice exclusivo de la columna final.
        // Restamos `text.length` para encontrar el inicio. `signColumnOffset` es 0 aquí.
        const colStart = step.colEnd - step.text.length + signColumnOffset; 
        const xStart = offsetHorizontal + colStart * tamCel + paddingLeft;

        for (let i = 0; i < step.text.length; i++) {
            fragment.appendChild(crearCelda(clase, step.text[i], {
                left: `${xStart + i * tamCel}px`, 
                top: `${yStart}px`,
                width: `${tamCel}px`, 
                height: `${tamCel}px`, 
                fontSize: `${tamFuente}px`
            }));
        }
    });
}

/**
 * `divide` (DIVISIÓN EXTENDIDA "EXPAND"): Muestra el proceso de la división larga paso a paso.
 * @param {Array<[string, number]>} numerosAR
 */
export function divide(numerosAR) {
    salida.innerHTML = "";
    const fragment = document.createDocumentFragment();

    const [dividendoStr, ] = numerosAR[0];
    const [divisorStr, ] = numerosAR[1];

    // Validaciones
    if (BigInt(divisorStr) === 0n) { 
        salida.innerHTML = `<p class="output-screen__error-message">${errorMessages.division2}</p>`; 
        return; 
    }
    if (BigInt(dividendoStr) === 0n) { 
        salida.innerHTML = `<p class="output-screen__error-message">${errorMessages.division1}</p>`; 
        return; 
    }

    const { cociente, displaySteps, totalRows } = calculateDisplaySteps(dividendoStr, divisorStr);
    
    // Calcular dimensiones para la división extendida
    const signColumnOffset = 1; // Espacio para el signo menos
    const anchoIzquierdo = dividendoStr.length + signColumnOffset; 
    const anchoDerecho = Math.max(divisorStr.length, cociente.length) + 1; 
    const separatorWidth = 2; 
    const totalCols = anchoIzquierdo + separatorWidth + anchoDerecho;
    
    const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = calculateLayout(salida, totalCols, totalRows);

    // X-posición de inicio para el bloque derecho (divisor/cociente)
    const xBloqueDerecho = offsetHorizontal + (anchoIzquierdo + separatorWidth) * tamCel + paddingLeft;

    // Dibujar el Header (Divisor, Cociente y Galera)
    drawHeader(fragment, { 
        divisorStr, cociente, tamCel, tamFuente, 
        offsetHorizontal, paddingLeft, paddingTop, xBloqueDerecho, 
        anchoIzquierdo, anchoDerecho, separatorWidth 
    });

    // Dibujar los pasos completos de la división
    renderFullDivisionSteps(fragment, displaySteps, { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, signColumnOffset });
    
    salida.appendChild(fragment);
}

/**
 * `divideExt` (DIVISIÓN NORMAL): Muestra el proceso paso a paso, pero sin signos de resta ni líneas bajo los productos.
 * @param {Array<[string, number]>} numerosAR
 */
export function divideExt(numerosAR) {
    salida.innerHTML = "";
    const fragment = document.createDocumentFragment();

    const [dividendoStr, ] = numerosAR[0];
    const [divisorStr, ] = numerosAR[1];

    // Validaciones
    if (BigInt(divisorStr) === 0n) { 
        salida.innerHTML = `<p class="output-screen__error-message">${errorMessages.division2}</p>`; 
        return; 
    }
    if (BigInt(dividendoStr) === 0n) { 
        salida.innerHTML = `<p class="output-screen__error-message">${errorMessages.division1}</p>`; 
        return; 
    }

    // Usar la función de cálculo específica para la división corta
    const { cociente, displaySteps, totalRows } = calculateShortDivisionSteps(dividendoStr, divisorStr);

    // Calcular dimensiones para la división corta
    const signColumnOffset = 0; // No hay signo menos explícito en este modo, por lo que no se necesita offset
    // El ancho izquierdo es solo la longitud del dividendo (no hay espacio para el signo)
    const anchoIzquierdo = dividendoStr.length; 
    const anchoDerecho = Math.max(divisorStr.length, cociente.length) + 1; 
    const separatorWidth = 2; 
    
    // totalRows: La altura visual para el layout debe incluir la fila del dividendo, la fila del cociente/divisor
    // y luego todas las filas de restos calculadas por `calculateShortDivisionSteps`.
    // Si `totalRows` de `calculateShortDivisionSteps` es 1 (solo dividendo, para resto 0),
    // entonces `actualTotalRowsForLayout` debe ser 2 (dividendo y cociente/divisor).
    // Si `totalRows` de `calculateShortDivisionSteps` es > 1, entonces cada resto ocupa una fila adicional.
    const actualTotalRowsForLayout = totalRows + 1; // +1 para la fila del cociente/divisor
    
    const totalCols = anchoIzquierdo + separatorWidth + anchoDerecho;
    
    const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = calculateLayout(salida, totalCols, actualTotalRowsForLayout);

    // X-posición de inicio para el bloque derecho (divisor/cociente)
    const xBloqueDerecho = offsetHorizontal + (anchoIzquierdo + separatorWidth) * tamCel + paddingLeft;

    // Dibujar Header (Divisor, Cociente y Galera)
    drawHeader(fragment, { 
        divisorStr, cociente, tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, 
        xBloqueDerecho, anchoIzquierdo, anchoDerecho, separatorWidth 
    });

    // Dibujar los pasos de la división corta
    renderShortDivisionSteps(fragment, displaySteps, { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop, signColumnOffset });
    
    salida.appendChild(fragment);
}