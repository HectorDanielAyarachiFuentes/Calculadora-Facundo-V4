// =======================================================
// --- operations/modules/addition.js (VERSIÓN FINAL Y CORREGIDA) ---
// =======================================================
"use strict";

import { calculateLayout } from '../utils/layout-calculator.js';
import { crearCelda, crearFlechaLlevada, esperar } from '../utils/dom-helpers.js';
import { salida } from '../../config.js';

export async function suma(numerosAR) {
    salida.innerHTML = "";

    // --- 1. CÁLCULOS Y LAYOUT (LÓGICA MEJORADA) ---
    let total = 0n;
    numerosAR.forEach(n => total += BigInt(n[0]));
    const resultadoRaw = total.toString();

    // El ancho se basa en el número más largo: el operando más largo o el resultado.
    const longitudMaxOperandos = Math.max(...numerosAR.map(n => n[0].length));
    const longitudMaximaTotal = Math.max(longitudMaxOperandos, resultadoRaw.length);
    
    // Los operandos se rellenan para el cálculo interno.
    const operandosParaCalcular = numerosAR.map(n => n[0].padStart(longitudMaximaTotal, '0'));
    
    const anchoGridEnCeldas = longitudMaximaTotal + 1;
    const altoGridEnCeldas = numerosAR.length + 4;
    const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = calculateLayout(salida, anchoGridEnCeldas, altoGridEnCeldas);
    
    // --- 2. DIBUJO DE ELEMENTOS ESTÁTICOS ---
    const fragmentEstatico = document.createDocumentFragment();
    let yPos = paddingTop + 2.5 * tamCel; 
    
    // Dibujamos los operandos originales, alineados a la derecha.
    numerosAR.forEach((nArr) => {
        const numStr = nArr[0];
        for (let i = 0; i < numStr.length; i++) {
            const colOffset = longitudMaximaTotal - numStr.length;
            const cellLeft = offsetHorizontal + (i + colOffset + 1) * tamCel + paddingLeft;
            fragmentEstatico.appendChild(crearCelda("output-grid__cell output-grid__cell--dividendo", numStr[i], { left: `${cellLeft}px`, top: `${yPos}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }));
        }
        yPos += tamCel;
    });
    
    const signLeft = offsetHorizontal + (longitudMaximaTotal - longitudMaxOperandos) * tamCel + paddingLeft;
    const signTop = yPos - tamCel;
    fragmentEstatico.appendChild(crearCelda("output-grid__cell output-grid__cell--producto", "+", { left: `${signLeft}px`, top: `${signTop}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px`, textAlign: 'center' }));
    
    const lineLeft = offsetHorizontal + tamCel + paddingLeft;
    const lineWidth = (anchoGridEnCeldas - 1) * tamCel;
    fragmentEstatico.appendChild(crearCelda("output-grid__line", "", { left: `${lineLeft}px`, top: `${yPos}px`, width: `${lineWidth}px`, height: `2px` }));
    salida.appendChild(fragmentEstatico);

    // --- 3. LÓGICA DE VISUALIZACIÓN INTERACTIVA ---
    let carry = 0;
    const topPosSumaIntermedia = paddingTop + 0.1 * tamCel;
    const topPosLlevada = paddingTop + 1.1 * tamCel;
    const sumasIntermediasData = [];
    
    for (let i = longitudMaximaTotal - 1; i >= 0; i--) {
        let sumaColumna = carry;
        operandosParaCalcular.forEach(n => sumaColumna += parseInt(n[i] || '0'));
        
        const sumaStr = sumaColumna.toString();
        const digitoResultado = sumaColumna % 10;
        const newCarry = Math.floor(sumaColumna / 10);

        // Animación temporal (centrada)
        const xPosColumna = offsetHorizontal + (i + 1) * tamCel + paddingLeft;
        const centroDeColumna = xPosColumna + (tamCel / 2);
        const anchoCeldaTemp = tamCel * sumaStr.length * 0.7;
        const leftPosTemp = centroDeColumna - (anchoCeldaTemp / 2);

        const celdaTemp = crearCelda("output-grid__cell output-grid__cell--suma-intermedia", sumaStr, { left: `${leftPosTemp}px`, top: `${topPosSumaIntermedia}px`, width: `${anchoCeldaTemp}px`, height: `${tamCel}px`, fontSize: `${tamFuente * 0.8}px` });
        salida.appendChild(celdaTemp);
        await esperar(1500);
        celdaTemp.remove();

        sumasIntermediasData.push({ value: sumaStr, column: i });

        // Animación de la llevada
        if (newCarry > 0) {
            const colLlevada = i - 1;
            const leftBase = offsetHorizontal + (colLlevada + 1) * tamCel + paddingLeft;
            const numeroLlevada = crearCelda("output-grid__cell output-grid__cell--resto", newCarry.toString(), { left: `${leftBase}px`, top: `${topPosLlevada}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente * 0.7}px`, textAlign: 'center' });
            const topFlecha = topPosLlevada + tamCel * 0.8;
            const altoFlecha = (paddingTop + 2.5 * tamCel) - topFlecha; 
            const anchoFlecha = tamCel * 0.8;
            const leftFlecha = leftBase + (tamCel * 1 - anchoFlecha); 
            const flecha = crearFlechaLlevada(leftFlecha, topFlecha, anchoFlecha, altoFlecha);
            salida.appendChild(numeroLlevada);
            salida.appendChild(flecha);
        }

        carry = newCarry;
        await esperar(500);
    }
    
    // --- 4. DIBUJO DEL RESULTADO FINAL (CORREGIDO) ---
    const yPosResultado = yPos + tamCel * 0.2;
    for (let i = 0; i < resultadoRaw.length; i++) {
        const colOffset = longitudMaximaTotal - resultadoRaw.length;
        const cellLeft = offsetHorizontal + (i + colOffset + 1) * tamCel + paddingLeft;
        salida.appendChild(crearCelda("output-grid__cell output-grid__cell--cociente", resultadoRaw[i], { left: `${cellLeft}px`, top: `${yPosResultado}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente}px` }));
    }

    // --- 5. VISTA FINAL ESTÁTICA ---
    await esperar(100);
    sumasIntermediasData.forEach(data => {
        const xPosColumna = offsetHorizontal + (data.column + 1) * tamCel + paddingLeft;
        const centroDeColumna = xPosColumna + (tamCel / 2);
        const anchoCeldaFinal = tamCel * data.value.length * 0.7;
        const leftPosFinal = centroDeColumna - (anchoCeldaFinal / 2);
        const celdaFinal = crearCelda("output-grid__cell output-grid__cell--suma-intermedia", data.value, { left: `${leftPosFinal}px`, top: `${topPosSumaIntermedia}px`, width: `${anchoCeldaFinal}px`, height: `${tamCel}px`, fontSize: `${tamFuente * 0.8}px` });
        celdaFinal.style.opacity = '0';
        salida.appendChild(celdaFinal);
        setTimeout(() => {
            celdaFinal.style.transition = 'opacity 0.5s ease-in';
            celdaFinal.style.opacity = '1';
        }, 100);
    });
}