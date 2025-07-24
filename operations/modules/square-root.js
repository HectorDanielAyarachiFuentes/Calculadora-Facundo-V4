// =======================================================
// --- operations/modules/square-root.js (VERSIÓN FINAL COMPLETA) ---
// Gestiona el cálculo y visualización de la raíz cuadrada,
// utilizando `crearMensajeError` para los mensajes.
// =======================================================
"use strict";

import { crearCelda, crearMensajeError } from '../utils/dom-helpers.js'; // Importar crearMensajeError
import { calculateLayout } from '../utils/layout-calculator.js';
import { salida, display, errorMessages } from '../../config.js';

/**
 * Realiza y visualiza el cálculo de la raíz cuadrada.
 */
export function raizCuadrada() {
    salida.innerHTML = "";
    const entrada = display.innerHTML;

    if (/[+\-x/]/.test(entrada)) {
        salida.appendChild(crearMensajeError(errorMessages.invalidSqrtInput));
    } else if (isNaN(parseInt(entrada)) || entrada.includes(',')) {
        salida.appendChild(crearMensajeError(errorMessages.integerSqrtRequired));
    } else {
        const numero = parseInt(entrada, 10);
        if (numero < 0) {
            salida.appendChild(crearMensajeError(errorMessages.negativeSqrt));
        } else if (numero === 0) {
            // Decidimos cómo mostrar la raíz de 0: como un error o como un resultado válido.
            // Si quieres que 0 sea un resultado visual normal (color verde, centrado):
            const { tamCel, tamFuente } = calculateLayout(salida, 1, 1); // Layout para un solo elemento
            const resultadoCelda = crearCelda(
                "output-grid__cell output-grid__cell--cociente",
                "0", // El resultado es 0
                {
                    width: '100%', height: '100%', fontSize: `${tamFuente}px`,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }
            );
            salida.appendChild(resultadoCelda);
            // Si prefieres que "La raíz de cero es cero" sea un mensaje de error como los demás:
            // salida.appendChild(crearMensajeError(errorMessages.raiz1));
        } else {
            const resultado = Math.sqrt(numero);
            if (resultado % 1 !== 0) {
                salida.appendChild(crearMensajeError(errorMessages.nonExactSqrt));
            } else {
                // El layout para un solo número centrado es 1 columna y 1 fila.
                const { tamCel, tamFuente } = calculateLayout(salida, resultado.toString().length, 1);

                const resultadoCelda = crearCelda(
                    "output-grid__cell output-grid__cell--cociente",
                    resultado.toString(),
                    {
                        width: '100%', height: '100%', fontSize: `${tamFuente}px`,
                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                    }
                );
                salida.appendChild(resultadoCelda);
            }
        }
    }
}