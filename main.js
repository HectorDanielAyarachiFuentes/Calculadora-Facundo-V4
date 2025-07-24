// =======================================================
// --- main.js (VERSIÓN FINAL Y CORREGIDA) ---
// =======================================================
"use strict";

// --- IMPORTACIONES (sin cambios) ---
import {
    suma, resta, multiplica, divide, divideExt,
    desFacPri, raizCuadrada, parsearNumeros
} from './operations/index.js';
import {
    display, salida, contenedor, teclado, divVolver,
    botExp, botNor, errorMessages
} from './config.js';
import { crearMensajeError } from './operations/utils/dom-helpers.js';
import { HistoryManager, HistoryPanel } from './history.js';

// --- VARIABLES DE ESTADO (sin cambios) ---
let w;
let divext = false;
let lastDivisionState = {
    operacionInput: '',
    numerosAR: null,
    tipo: ''
};

// --- INICIALIZACIÓN Y EVENTOS (sin cambios) ---
function alCargar() {
    w = Math.min(window.innerHeight / 1.93, window.innerWidth / 1.5);
    contenedor.style.width = `${w}px`;
    contenedor.style.paddingTop = `${(w * 1.56) * 0.04}px`;
    display.style.fontSize = `${w * 0.085}px`;
    display.style.height = `${w * 0.11 * 1.11}px`;
    const cuerpoteclado = document.getElementById("cuerpoteclado");
    cuerpoteclado.style.width = `${0.95 * w}px`;
    cuerpoteclado.style.height = `${0.95 * w}px`;
    teclado.style.fontSize = `${0.1 * w}px`;
    const volver = document.getElementById("volver");
    volver.style.fontSize = `${0.15 * w}px`;
    volver.style.padding = `${0.05 * w}px ${0.03 * w}px`;
    botExp.style.fontSize = `${0.08 * w}px`;
    botExp.style.paddingTop = `${0.05 * w}px`;
    botNor.style.fontSize = `${0.08 * w}px`;
    botNor.style.paddingTop = `${0.05 * w}px`;
    contenedor.style.opacity = "1";
    display.innerHTML = '0';
    activadoBotones('0');
    HistoryManager.init();
    HistoryPanel.init();
    actualizarEstadoDivisionUI(false);
    setupEventListeners();
}

function setupEventListeners() {
    teclado.removeEventListener('click', handleButtonClick);
    divVolver.removeEventListener('click', handleButtonClick);
    document.removeEventListener('keydown', handleKeyboardInput);
    window.removeEventListener('resize', alCargar);
    teclado.addEventListener('click', handleButtonClick);
    divVolver.addEventListener('click', handleButtonClick);
    document.addEventListener('keydown', handleKeyboardInput);
    window.addEventListener('resize', alCargar);
}

// --- MANEJADORES DE ACCIONES ---
function handleButtonClick(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const value = button.dataset.value;
    const action = button.dataset.action;
    if (value) {
        escribir(value);
    } else if (action) {
        handleAction(action);
    }
}

function handleKeyboardInput(event) {
    // ======================================================
    // === INICIO DE LA CORRECCIÓN CLAVE PARA EL MODAL ===
    // ======================================================
    // Si el evento se originó en un <input> o <textarea>,
    // permitimos que el navegador maneje la entrada de texto de forma nativa
    // y no ejecutamos la lógica de la calculadora.
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return; // Salir de la función si estamos en un campo de texto
    }
    // ======================================================
    // === FIN DE LA CORRECCIÓN CLAVE ===
    // ======================================================

    const key = event.key;
    if (/[0-9+\-*/=.,cC]/.test(key) || ['Enter', 'Backspace', 'Delete', 'Escape', 'x', 'X'].includes(key)) {
        event.preventDefault(); // Esto solo se ejecutará si NO estamos en un input/textarea
    }
    if (/[0-9]/.test(key)) escribir(key);
    else if (key === '+') escribir('+');
    else if (key === '-') escribir('-');
    else if (key === '*' || key === 'x' || key === 'X') escribir('x');
    else if (key === '/') escribir('/');
    else if (key === '.' || key === ',') escribir(',');
    else if (key === 'Enter' || key === '=') {
        const btnIgual = document.querySelector('[data-action="calculate"]');
        if (btnIgual && !btnIgual.disabled) calcular();
    } else if (key === 'Backspace') escribir('del');
    else if (key === 'Delete' || key === 'Escape') escribir('c');
}

// *** ¡CORRECCIÓN PRINCIPAL AQUÍ: reExecuteOperationFromHistory! ***
// Esta función es llamada desde history.js para re-ejecutar cualquier tipo de operación.
export async function reExecuteOperationFromHistory(historyInput) {
    bajarteclado();                   // 1. Muestra la pantalla de salida y oculta el teclado
    salida.innerHTML = "";            // 2. Limpia la salida para la nueva operación

    let calculationSuccessful = false;
    
    // Patrones para identificar el tipo de operación
    const primosMatch = historyInput.match(/^factores\((\d+)\)$/);
    const raizMatch = historyInput.match(/^√\((\d+)\)$/);
    
    // Guardamos el contenido original de display si es necesario para reestablecerlo
    const originalDisplayContent = display.innerHTML;

    try {
        if (primosMatch) {
            const numero = primosMatch[1]; // Extrae solo el número "145"
            display.innerHTML = numero; // *** TEMPORALMENTE: Pon solo el número en el display ***
            await desFacPri(numero); // Llama a la función de factores primos
            calculationSuccessful = !salida.querySelector('.output-screen__error-message');
        } else if (raizMatch) {
            const numero = raizMatch[1]; // Extrae solo el número "144"
            display.innerHTML = numero; // *** TEMPORALMENTE: Pon solo el número en el display ***
            await raizCuadrada(numero); // Llama a la función de raíz cuadrada
            calculationSuccessful = !salida.querySelector('.output-screen__error-message');
        } else {
            // Para operaciones binarias, el display debe contener la expresión completa
            display.innerHTML = historyInput; // Establece la expresión completa (ej. "652/69")
            await calcular(false); // Llama a calcular, diciéndole que NO añada al historial
            calculationSuccessful = !salida.querySelector('.output-screen__error-message');
        }
    } catch (error) {
        console.error("Error durante la re-ejecución desde el historial:", error);
        salida.appendChild(crearMensajeError(errorMessages.genericError));
        calculationSuccessful = false;
    } finally {
        // *** CRUCIAL: Vuelve a poner el formato original del historial en el display ***
        // Esto es para que el display muestre "factores(145)" o "√(144)" o "652/69"
        display.innerHTML = historyInput; 
        activadoBotones(display.innerHTML); // 4. Actualiza el estado de los botones
    }

    return calculationSuccessful; // Retorna si la re-ejecución fue exitosa
}


// --- handleAction: Refactorizado para usar la función unificada ---
async function handleAction(action) {
    switch (action) {
        case 'view-screen':
            bajarteclado();
            break;
        case 'calculate':
            // Pasar 'true' para indicar que es un cálculo nuevo y se añada al historial
            await calcular(true); 
            break;
        case 'clear':
            escribir('c');
            break;
        case 'delete':
            escribir('del');
            break;
        case 'hide-screen':
            subirteclado();
            break;
        case 'divide-expanded':
            divext = true; // Establece el modo a expandido
            // Re-ejecuta la última división si existe
            if (lastDivisionState.tipo === 'division' && lastDivisionState.operacionInput) {
                // Llama a reExecuteOperationFromHistory con la última operación de división
                await reExecuteOperationFromHistory(lastDivisionState.operacionInput);
            } else {
                actualizarEstadoDivisionUI(false); // Si no hay división previa, ocultar los botones
            }
            break;
        case 'divide-normal':
            divext = false; // Establece el modo a normal
            // Re-ejecuta la última división si existe
            if (lastDivisionState.tipo === 'division' && lastDivisionState.operacionInput) {
                // Llama a reExecuteOperationFromHistory con la última operación de división
                await reExecuteOperationFromHistory(lastDivisionState.operacionInput);
            } else {
                actualizarEstadoDivisionUI(false); // Si no hay división previa, ocultar los botones
            }
            break;

        // --- CÓDIGO PARA FACTORES PRIMOS (modificado para usar reExecuteOperationFromHistory) ---
        case 'primos':
            const numeroPrimos = display.innerHTML; // Obtiene el número del display
            const inputParaHistorialPrimos = `factores(${numeroPrimos})`; // Crea el formato para el historial
            // Usa reExecuteOperationFromHistory para ejecutar y actualizar la UI
            const primosSuccess = await reExecuteOperationFromHistory(inputParaHistorialPrimos); 
            if (primosSuccess) {
                // Solo añade al historial si la operación fue exitosa
                HistoryManager.add({
                    input: inputParaHistorialPrimos,
                    visualHtml: salida.innerHTML
                });
            }
            break;

        // --- CÓDIGO PARA RAÍZ CUADRADA (modificado para usar reExecuteOperationFromHistory) ---
        case 'raiz':
            const numeroRaiz = display.innerHTML; // Obtiene el número del display
            const inputParaHistorialRaiz = `√(${numeroRaiz})`; // Crea el formato para el historial
            // Usa reExecuteOperationFromHistory para ejecutar y actualizar la UI
            const raizSuccess = await reExecuteOperationFromHistory(inputParaHistorialRaiz); 
            if (raizSuccess) {
                // Solo añade al historial si la operación fue exitosa
                HistoryManager.add({
                    input: inputParaHistorialRaiz,
                    visualHtml: salida.innerHTML
                });
            }
            break;

        default:
            console.warn(`Acción desconocida: ${action}`);
    }
}

// --- LÓGICA DE LA APLICACIÓN (sin cambios) ---
function escribir(t) {
    const currentDisplay = display.innerHTML;
    const isOperator = ['+', '-', 'x', '/'].includes(t);
    const hasBinaryOperatorInExpression = /[+\-x/]/.test(currentDisplay.slice(currentDisplay.startsWith('-') ? 1 : 0).replace(/^[0-9,]+/, ''));

    if (t === "c") {
        display.innerHTML = "0";
    } else if (t === "del") {
        display.innerHTML = currentDisplay.slice(0, -1) || "0";
    }
    else if (isOperator) {
        const lastChar = currentDisplay.slice(-1);
        const lastCharIsOperator = ['+', '-', 'x', '/'].includes(lastChar);
        
        if (hasBinaryOperatorInExpression && !lastCharIsOperator) { 
            return;
        } else if (lastCharIsOperator) { 
            if (lastChar === t) return; 
            display.innerHTML = currentDisplay.slice(0, -1) + t;
        } else if (currentDisplay === "0") { 
            if (t === '-') {
                display.innerHTML = t; 
            } else {
                return; 
            }
        } else if (currentDisplay.endsWith(',')) {
            return; 
        } else { 
            display.innerHTML = currentDisplay + t;
        }
    }
    else {
        if (t === ',' && currentDisplay.endsWith(',')) return; 

        display.innerHTML = (currentDisplay === "0" && t !== ',') ? t : currentDisplay + t;
    }
    
    activadoBotones(display.innerHTML);
    actualizarEstadoDivisionUI(false); 
}

// *** MODIFICACIÓN: calcular ahora acepta un parámetro para controlar si añade al historial ***
async function calcular(addToHistory = true) { // Añade el parámetro con valor por defecto 'true'
    const entrada = display.innerHTML; // 'display.innerHTML' ya contendrá la expresión correcta
    const operadorMatch = entrada.match(/[\+\-x/]/);

    if (!operadorMatch || !/^-?[0-9,]+\s*[+\-x/]\s*(-?[0-9,]+)?$/.test(entrada) || ['+', '-', 'x', '/'].includes(entrada.slice(-1)) || entrada.endsWith(',')) { 
        salida.innerHTML = '';
        salida.appendChild(crearMensajeError(errorMessages.invalidOperation));
        bajarteclado();
        actualizarEstadoDivisionUI(false);
        return; 
    }

    const operador = operadorMatch[0];
    const numerosAR = parsearNumeros(entrada, operador);
    
    bajarteclado();
    salida.innerHTML = "";

    switch (operador) {
        case "+": await suma(numerosAR); break;
        case "-": resta(numerosAR); break;
        case "x": multiplica(numerosAR); break;
        case "/":
            lastDivisionState = { operacionInput: entrada, numerosAR, tipo: 'division' };
            divext ? divideExt(numerosAR) : divide(numerosAR);
            break;
        default:
            salida.appendChild(crearMensajeError(errorMessages.invalidOperation));
    }
    
    const calculationError = salida.querySelector('.output-screen__error-message');
    if (operador === '/' && !calculationError) {
        actualizarEstadoDivisionUI(true);
    } else {
        actualizarEstadoDivisionUI(false);
    }

    // *** MODIFICACIÓN: Solo añade al historial si 'addToHistory' es true ***
    if (addToHistory && !calculationError) {
        HistoryManager.add({ input: entrada, visualHtml: salida.innerHTML });
    }
    activadoBotones(display.innerHTML);
}

// --- El resto del archivo sin cambios ---
function divideExpandida(esExpandida) {
    divext = esExpandida;
    actualizarEstadoDivisionUI(true); 
    bajarteclado(); 

    requestAnimationFrame(async () => { 
        if (!lastDivisionState.operacionInput || lastDivisionState.tipo !== 'division') { 
            salida.appendChild(crearMensajeError(errorMessages.noDivisionCalculated));
            return;
        }
        await reExecuteOperationFromHistory(lastDivisionState.operacionInput);
    });
}

function subirteclado() {
    teclado.classList.remove('keyboard--hidden');
    salida.classList.remove('output-screen--visible');
    divVolver.classList.remove('bottom-nav--visible');
    activadoBotones(display.innerHTML); 
}

function bajarteclado() {
    teclado.classList.add('keyboard--hidden');
    salida.classList.add('output-screen--visible');
    divVolver.classList.add('bottom-nav--visible');
}

function actualizarEstadoDivisionUI(esDivisionValida) {
    if (esDivisionValida) {
        botExp.style.display = divext ? "none" : "inline-block";
        botNor.style.display = divext ? "inline-block" : "none";
    }
    else if (botExp && botNor) { 
        botExp.style.display = "none";
        botNor.style.display = "none";
        lastDivisionState = { operacionInput: '', numerosAR: null, tipo: '' }; 
    }
}

function activadoBotones(contDisplay) {
    const esSoloCero = contDisplay === '0';
    const hasBinaryOperatorInExpression = /[+\-x/]/.test(contDisplay.slice(contDisplay.startsWith('-') ? 1 : 0).replace(/^[0-9,]+/, ''));
    
    const partes = contDisplay.split(/[\+\-x/]/);
    const ultimoNumero = partes[partes.length - 1];
    const terminaEnOperador = ['+', '-', 'x', '/'].includes(contDisplay.slice(-1));

    const demasiadosCaracteres = contDisplay.length >= 21;
    const ultimoNumeroDemasiadoLargo = ultimoNumero.length >= 15;
    const deshabilitarNumeros = demasiadosCaracteres || ultimoNumeroDemasiadoLargo;

    document.querySelectorAll('.keyboard__button--number').forEach(btn => {
        btn.disabled = deshabilitarNumeros;
    });

    document.querySelectorAll('[data-value="+"], [data-value="-"], [data-value="x"], [data-value="/"]').forEach(btn => {
        const isMinusButton = btn.dataset.value === '-';
        if (demasiadosCaracteres) {
            btn.disabled = true; 
        } else if (hasBinaryOperatorInExpression) {
            btn.disabled = true; 
        } else if (esSoloCero) {
            btn.disabled = true; 
        } else if (contDisplay.endsWith(',')) {
            btn.disabled = true; 
        } else {
            btn.disabled = false; 
        }
    });

    const puedeAnadirComa = !ultimoNumero.includes(',');
    const btnComa = document.querySelector('[data-value=","]');
    if (btnComa) btnComa.disabled = !puedeAnadirComa || deshabilitarNumeros;

    const esNumeroEnteroSimple = /^\d+$/.test(contDisplay) && !esSoloCero && !hasBinaryOperatorInExpression;
    document.querySelectorAll('[data-action="primos"], [data-action="raiz"]').forEach(btn => {
        btn.disabled = !esNumeroEnteroSimple;
    });

    const esCalculable = /^-?[0-9,]+\s*[+\-x/]\s*(-?[0-9,]+)$/.test(contDisplay);
    const btnIgual = document.querySelector('[data-action="calculate"]');
    if (btnIgual) btnIgual.disabled = !esCalculable;
}

document.addEventListener('DOMContentLoaded', alCargar);


// Velocidad de title y cambio al pasar de pestaña (sin cambios)
let baseTitle = "Calculadora Facundo 🧮";
let altTitle = "¡Regresa! 😢 🧮 ";
let scrollTitle = altTitle + " ";
let interval;
let pos = 0;
let timeout;

function startTitleAnimation() {
  clearInterval(interval);
  clearTimeout(timeout);
  pos = 0;

  interval = setInterval(() => {
    document.title = scrollTitle.substring(pos) + scrollTitle.substring(0, pos);
    pos = (pos + 1) % scrollTitle.length;
  }, 40); 
}

function stopTitleAnimation() {
  clearInterval(interval);
  clearTimeout(timeout);

  document.title = "Gracias por volver 😊";

  timeout = setTimeout(() => {
    document.title = baseTitle;
  }, 2000);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    startTitleAnimation();
  } else {
    stopTitleAnimation();
  }
});