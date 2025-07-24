// =======================================================
// --- operations/modules/subtraction.js (VERSIÓN FINAL CON ANIMACIÓN EN BUCLE) ---
// =======================================================
"use strict";

import { calculateLayout } from '../utils/layout-calculator.js';
import { crearCelda, crearCeldaAnimada, esperar, crearFlechaLlevada } from '../utils/dom-helpers.js';
import { salida } from '../../config.js';

// Variable para controlar el bucle de animación y poder detenerlo
let animationLoopId = null;

/**
 * Inicia un bucle de animación para los elementos de préstamo.
 * @param {NodeListOf<Element>} elements - Una NodeList de flechas y números a animar.
 */
async function startBorrowLoopAnimation(elements) {
    if (animationLoopId) clearTimeout(animationLoopId);
    if (elements.length === 0) return;

    const loop = async () => {
        for (const element of elements) {
            if (element.tagName.toLowerCase() === 'svg') {
                // Animar la flecha
                const path = element.querySelector('path[d^="M"]'); // Selecciona el path principal de la flecha
                if (path) {
                    const length = path.getTotalLength();
                    path.style.transition = 'none';
                    path.style.strokeDashoffset = length;
                    path.offsetHeight; // Forzar reflow del navegador
                    path.style.transition = 'stroke-dashoffset .8s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
                    path.style.strokeDashoffset = '0';
                }
            } else {
                // Animar el número con un pulso
                element.classList.add('pulse');
                setTimeout(() => element.classList.remove('pulse'), 500);
            }
            await esperar(200); // Pequeña pausa entre cada animación de la cadena
        }
        
        // Esperar un poco antes de reiniciar el bucle completo
        animationLoopId = setTimeout(loop, 3000);
    };

    loop();
}


function calculateBorrows(n1Str, n2Str) {
    const borrowChains = [];
    let n1Array = n1Str.split('').map(Number);
    let n2Array = n2Str.split('').map(Number);

    for (let i = n1Array.length - 1; i >= 0; i--) {
        if (n1Array[i] < n2Array[i]) {
            let chain = [];
            let j = i - 1;
            while (j >= 0 && n1Array[j] === 0) { j--; }

            if (j >= 0) {
                chain.push({ index: j, newValue: n1Array[j] - 1 });
                n1Array[j]--;
                for (let k = j + 1; k < i; k++) {
                    chain.push({ index: k, newValue: 9 });
                    n1Array[k] = 9;
                }
                chain.push({ index: i, newValue: n1Array[i] + 10 });
                n1Array[i] += 10;
                borrowChains.push(chain);
            }
        }
    }
    return borrowChains;
}

function crearTachadoAnimado(styles) {
    const line = document.createElement('div');
    line.className = 'output-grid__cross-out';
    Object.assign(line.style, {
        position: 'absolute', backgroundColor: '#e84d4d', height: '2px',
        transform: 'rotate(-25deg)', transformOrigin: 'left center',
        transition: 'width 0.3s ease-out', width: '0px', ...styles
    });
    requestAnimationFrame(() => { line.style.width = styles.width; });
    return line;
}

export async function resta(numerosAR) {
    salida.innerHTML = "";
    const fragment = document.createDocumentFragment();
    if (animationLoopId) clearTimeout(animationLoopId);

    const minuendoStr = numerosAR[0][0];
    const sustraendoStr = numerosAR[1][0];
    const minuendoBigInt = BigInt(minuendoStr);
    const sustraendoBigInt = BigInt(sustraendoStr);
    
    const isNegative = minuendoBigInt < sustraendoBigInt;
    const n1Anim = isNegative ? sustraendoStr : minuendoStr;
    const n2Anim = isNegative ? minuendoStr : sustraendoStr;
    const resultadoAbsStr = (isNegative ? sustraendoBigInt - minuendoBigInt : minuendoBigInt - sustraendoBigInt).toString();

    const maxLength = Math.max(n1Anim.length, n2Anim.length);
    const n1Padded = n1Anim.padStart(maxLength, '0');
    const n2Padded = n2Anim.padStart(maxLength, '0');
    
    const resultDisplayLength = isNegative ? resultadoAbsStr.length + 1 : resultadoAbsStr.length;
    const maxWidthInChars = Math.max(maxLength + 1, resultDisplayLength);
    const altoGridInRows = 5;
    const { tamCel, tamFuente, offsetHorizontal, paddingLeft, paddingTop } = calculateLayout(salida, maxWidthInChars, altoGridInRows);
    
    const yPosMinuendo = paddingTop + tamCel;
    const yPosSustraendo = yPosMinuendo + tamCel;
    
    for (let i = 0; i < n1Padded.length; i++) {
        const leftPos = offsetHorizontal + (maxWidthInChars - n1Padded.length + i) * tamCel + paddingLeft;
        fragment.appendChild(crearCelda("output-grid__cell output-grid__cell--dividendo", n1Padded[i], { left: `${leftPos}px`, top: `${yPosMinuendo}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: tamFuente + 'px' }));
    }
    const signLeft = offsetHorizontal + (maxWidthInChars - n2Padded.length - 1) * tamCel + paddingLeft;
    fragment.appendChild(crearCelda("output-grid__cell output-grid__cell--producto", "-", { left: `${signLeft}px`, top: `${yPosSustraendo}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: tamFuente + 'px' }));
    for (let i = 0; i < n2Padded.length; i++) {
        const leftPos = offsetHorizontal + (maxWidthInChars - n2Padded.length + i) * tamCel + paddingLeft;
        fragment.appendChild(crearCelda("output-grid__cell output-grid__cell--producto", n2Padded[i], { left: `${leftPos}px`, top: `${yPosSustraendo}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: tamFuente + 'px' }));
    }
    salida.appendChild(fragment);
    await esperar(500);

    const borrowChains = calculateBorrows(n1Padded, n2Padded);
    const borrowNumberCells = {}; 

    for (const chain of borrowChains) {
        for (let i = 0; i < chain.length - 1; i++) {
            const fromIndex = chain[i].index;
            const toIndex = chain[i+1].index;
            const fromCol = maxWidthInChars - n1Padded.length + fromIndex;
            const toCol = maxWidthInChars - n1Padded.length + toIndex;
            const xFrom = offsetHorizontal + fromCol * tamCel + paddingLeft;
            const yNewNum = yPosMinuendo - tamCel * 0.7;
            const arrowLeft = xFrom;
            const arrowTop = yNewNum - tamCel * 0.1;
            const arrowWidth = (toCol - fromCol) * tamCel;
            const arrowHeight = tamCel * 0.8;
            const arrow = crearFlechaLlevada(arrowLeft, arrowTop, arrowWidth, arrowHeight);
            arrow.classList.add('loop-anim-element'); // Añadir clase para el bucle
            salida.appendChild(arrow);
        }
        await esperar(800);

        for (const step of chain) {
            const col = maxWidthInChars - n1Padded.length + step.index;
            const xPos = offsetHorizontal + col * tamCel + paddingLeft;
            const yNewNum = yPosMinuendo - tamCel * 0.7;

            if (borrowNumberCells[step.index]) {
                salida.removeChild(borrowNumberCells[step.index]);
            }

            salida.appendChild(crearTachadoAnimado({ left: `${xPos}px`, top: `${yPosMinuendo + tamCel / 2}px`, width: `${tamCel}px` }));
            await esperar(300);

            const numStr = step.newValue.toString();
            const widthMultiplier = numStr.length > 1 ? 1.4 : 1;
            const leftOffset = numStr.length > 1 ? -tamCel * 0.2 : 0;
            
            const newNumber = crearCeldaAnimada("output-grid__cell output-grid__cell--resto", numStr, {
                left: `${xPos + leftOffset}px`, top: `${yNewNum}px`, width: `${tamCel * widthMultiplier}px`, height: `${tamCel}px`, fontSize: `${tamFuente * 0.7}px`
            }, 0);
            newNumber.classList.add('loop-anim-element'); // Añadir clase para el bucle
            
            salida.appendChild(newNumber);
            borrowNumberCells[step.index] = newNumber; 
            await esperar(300);
        }
        await esperar(500);
    }
    
    const yPosLinea = yPosSustraendo + tamCel;
    const lineLeft = offsetHorizontal + paddingLeft;
    const totalBlockWidth = maxWidthInChars * tamCel;
    const linea = crearCelda("output-grid__line", "", { left: `${lineLeft}px`, top: `${yPosLinea}px`, width: `0px`, height: `2px`, transition: 'width 0.4s ease-out' });
    salida.appendChild(linea);

    requestAnimationFrame(() => { linea.style.width = `${totalBlockWidth}px`; });
    await esperar(400);

    const yPosResultado = yPosLinea + tamCel * 0.2;
    const resultLeftOffset = maxWidthInChars - resultadoAbsStr.length;
    let animationDelayStart = 0;
    const delayStep = 80;

    if (isNegative) {
        const signLeftPos = offsetHorizontal + (resultLeftOffset - 1) * tamCel + paddingLeft;
        salida.appendChild(crearCeldaAnimada("output-grid__cell output-grid__cell--cociente", "-", {
            left: `${signLeftPos}px`, top: `${yPosResultado}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: tamFuente + 'px'
        }, 0));
        animationDelayStart = 1;
    }
    
    for (let i = 0; i < resultadoAbsStr.length; i++) {
        const leftPos = offsetHorizontal + (resultLeftOffset + i) * tamCel + paddingLeft;
        salida.appendChild(crearCeldaAnimada("output-grid__cell output-grid__cell--cociente", resultadoAbsStr[i], {
            left: `${leftPos}px`, top: `${yPosResultado}px`, width: `${tamCel}px`, height: `${tamCel}px`, fontSize: `${tamFuente * 0.9}px`
        }, (animationDelayStart + i) * delayStep));
    }
    
    // Iniciar el bucle de animación final
    const elementsToLoop = salida.querySelectorAll('.loop-anim-element');
    startBorrowLoopAnimation(elementsToLoop);
}