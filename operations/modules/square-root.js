// =======================================================
// --- operations/modules/square-root.js (VERSIÓN MODIFICADA CON DECIMALES) ---
// Gestiona el cálculo y visualización de la raíz cuadrada para enteros y decimales.
// =======================================================
"use strict";

import { crearCelda, crearMensajeError } from '../utils/dom-helpers.js';
import { calculateLayout } from '../utils/layout-calculator.js';
import { salida, display, errorMessages } from '../../config.js';

/**
 * Realiza y visualiza el cálculo de la raíz cuadrada para números enteros y decimales.
 */
export function raizCuadrada() {
    salida.innerHTML = "";
    const entrada = display.innerHTML;

    // --- 1. Validaciones de entrada ---

    // No permitir operaciones binarias (ej: "2+3")
    if (/[+\-x/]/.test(entrada)) {
        salida.appendChild(crearMensajeError(errorMessages.invalidSqrtInput));
        return;
    }
    
    // Validar que la entrada sea un número válido (entero o decimal con coma)
    // Esto previene entradas como "5,5,5" o "hola"
    if (!/^-?\d+(,\d+)?$/.test(entrada)) {
        salida.appendChild(crearMensajeError(errorMessages.invalidSqrtInput));
        return;
    }

    // --- 2. Preparación y cálculo ---
    
    // Reemplazar la coma por un punto para que JavaScript pueda parsearlo
    const numero = parseFloat(entrada.replace(',', '.'));

    if (numero < 0) {
        salida.appendChild(crearMensajeError(errorMessages.negativeSqrt));
    } else if (numero === 0) {
        // La raíz de 0 es 0. Se muestra como un resultado normal.
        const { tamFuente } = calculateLayout(salida, 1, 1);
        const resultadoCelda = crearCelda(
            "output-grid__cell output-grid__cell--cociente", "0",
            {
                width: '100%', height: '100%', fontSize: `${tamFuente}px`,
                display: 'flex', justifyContent: 'center', alignItems: 'center'
            }
        );
        salida.appendChild(resultadoCelda);
    } else {
        // --- 3. Cálculo y formateo del resultado ---
        const resultadoCrudo = Math.sqrt(numero);
        
        // Formatear el resultado para mostrar un máximo de 4 decimales
        // y eliminar los ceros innecesarios al final (ej: 4.0000 se convierte en 4)
        let resultadoFormateado = parseFloat(resultadoCrudo.toFixed(4)).toString();

        // Convertir el punto decimal de vuelta a una coma para la visualización
        const resultadoDisplay = resultadoFormateado.replace('.', ',');

        // --- 4. Visualización del resultado ---
        const { tamFuente } = calculateLayout(salida, resultadoDisplay.length, 1);
        const resultadoCelda = crearCelda(
            "output-grid__cell output-grid__cell--cociente",
            resultadoDisplay,
            {
                width: '100%', height: '100%', fontSize: `${tamFuente}px`,
                display: 'flex', justifyContent: 'center', alignItems: 'center'
            }
        );
        salida.appendChild(resultadoCelda);
    }
}