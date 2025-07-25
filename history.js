// =======================================================
// --- history.js (VERSIÓN FINAL Y CORREGIDA) ---
// Gestiona el historial de operaciones, incluyendo persistencia y renderizado.
// =======================================================
"use strict";

import { display, salida } from './config.js'; 
import { crearMensajeError } from './operations/utils/dom-helpers.js'; 
// *** Importación clave: Asegúrate de que esta ruta sea correcta para tu main.js ***
import { reExecuteOperationFromHistory } from './main.js'; 


class HistoryManagerClass {
    constructor() {
        this.history = [];
        this.MAX_HISTORY_ITEMS = 10;
        this.HISTORY_STORAGE_KEY = 'calculatorHistory';
    }

    init() {
        this.loadHistory();
        HistoryPanel.renderHistory();
    }

    // *** MODIFICACIÓN: Este método debe ser asíncrono para usar 'await' ***
    async add(item) {
        const duplicateIndex = this.history.findIndex(existingItem => existingItem.input === item.input);
        if (duplicateIndex !== -1) {
            alert('¡Oye! Ya has realizado esta operación antes. ¡Mira el historial!');
            if (!HistoryPanel.isOpen()) {
                HistoryPanel.open();
            }
            HistoryPanel.highlightItem(duplicateIndex);
            
            // *** CAMBIO: Re-ejecutar la operación duplicada usando la función de main.js ***
            await reExecuteOperationFromHistory(this.history[duplicateIndex].input);
            // *****************************************************************************
            return; // Detener para no añadir duplicado
        }
        
        // La lógica para extraer el resultado debería ser robusta si main.js pasa visualHtml
        // Simplificamos la condición ya que 'item.result' puede venir vacío y se extrae.
        if (!item.result) { 
            item.result = HistoryPanel.extractResultText(item.visualHtml);
        }

        this.history.unshift(item);
        if (this.history.length > this.MAX_HISTORY_ITEMS) {
            this.history.pop();
        }
        this.saveHistory();
        HistoryPanel.renderHistory();

        // Resaltar el último elemento (el nuevo está en la posición 0)
        HistoryPanel.highlightLastItem();
    }

    getHistory() { return this.history; }
    clearAll() {
        this.history = [];
        this.saveHistory();
        HistoryPanel.renderHistory();
    }
    loadHistory() {
        const storedHistory = localStorage.getItem(this.HISTORY_STORAGE_KEY);
        this.history = storedHistory ? JSON.parse(storedHistory) : [];
    }
    saveHistory() { localStorage.setItem(this.HISTORY_STORAGE_KEY, JSON.stringify(this.history)); }
}

class HistoryPanelClass {
    constructor() {
        this.panel = document.getElementById('history-panel');
        this.list = document.getElementById('history-list');
        this.toggleButton = document.getElementById('history-toggle-btn');
        this.clearButton = document.getElementById('clear-history-btn');
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.confirmAndClear = this.confirmAndClear.bind(this);
    }

    init() {
        this.addEventListeners();
        this.renderHistory();
    }

    addEventListeners() {
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', (e) => {
                e.stopPropagation(); 
                this.toggle();
            });
        }
        if (this.clearButton) {
            this.clearButton.addEventListener('click', this.confirmAndClear);
        }
    }

    confirmAndClear() {
        const isConfirmed = window.confirm(
            '¿Estás seguro de que quieres borrar todo el historial?\n\nEsta acción no se puede deshacer.'
        );

        if (isConfirmed) {
            HistoryManager.clearAll();
        }
    }

    renderHistory() {
        this.list.innerHTML = '';
        HistoryManager.getHistory().forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'history-panel__item';
            li.dataset.index = index;
            li.innerHTML = `
                <span class="history-panel__input">${item.input}</span>
                <span class="history-panel__result">= ${item.result}</span>
            `;
            // *** MODIFICACIÓN: Hacer el callback asíncrono y usar la función de main.js ***
            li.addEventListener('click', async () => { // <--- Añadido 'async' aquí
                await reExecuteOperationFromHistory(item.input); // <--- Nueva llamada con 'await'
                // Ya no necesitamos salida.innerHTML = item.visualHtml; ni display.innerHTML = item.input;
                // reExecuteOperationFromHistory se encarga de eso.
                // ********************************************************************************
                this.close();
            });
            this.list.appendChild(li);
        });
    }

    // =========================================================================
    // === INICIO DE LA CORRECCIÓN PARA EXTRAER RESULTADOS CON DECIMALES ===
    // =========================================================================
    extractResultText(htmlString) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;

        // Primero, manejar casos especiales como errores o mensajes que no son una cuadrícula de cálculo.
        const error = tempDiv.querySelector('.output-screen__error-message');
        if (error) return error.textContent.trim();

        // Buscar todas las celdas que podrían estar en la fila del resultado.
        // Dígitos del resultado (verdes) y la coma (gris, que usa la clase 'producto').
        const potentialResultCells = Array.from(tempDiv.querySelectorAll('.output-grid__cell--cociente, .output-grid__cell--producto'));
        
        if (potentialResultCells.length > 0) {
            const rows = {};
            // Agrupar celdas por su posición vertical (style.top)
            potentialResultCells.forEach(cell => {
                const top = cell.style.top;
                // Filtrar para incluir solo dígitos, coma o signo negativo. Esto excluye el signo '+' o 'x' de la operación.
                if (/[0-9,.-]/.test(cell.textContent) && cell.textContent.trim().length > 0) {
                    if (!rows[top]) rows[top] = [];
                    rows[top].push(cell);
                }
            });

            // Encontrar la última fila (la que tiene el valor 'top' más grande)
            const yCoords = Object.keys(rows).map(top => parseFloat(top)).filter(t => !isNaN(t));
            if (yCoords.length > 0) {
                const lastRowY = Math.max(...yCoords) + 'px';
                const resultCells = rows[lastRowY];
                if (resultCells && resultCells.length > 0) {
                    // Ordenar las celdas de la fila por su posición horizontal (style.left)
                    resultCells.sort((a, b) => parseFloat(a.style.left) - parseFloat(b.style.left));
                    // Unir el texto de las celdas para formar el resultado final
                    return resultCells.map(cell => cell.textContent).join('');
                }
            }
        }
        
        // Fallback si la lógica anterior falla o si es una operación sin cuadrícula
        return tempDiv.textContent.trim().split('\n')[0] || 'Resultado';
    }
    // =========================================================================
    // === FIN DE LA CORRECCIÓN ===
    // =========================================================================
    
    // --- Lógica para cerrar el panel al hacer clic fuera (sin cambios) ---
    handleOutsideClick(event) {
        if (this.isOpen() && !this.panel.contains(event.target) && !this.toggleButton.contains(event.target)) {
            this.close();
        }
    }
    
    isOpen() {
        return this.panel.classList.contains('history-panel--open');
    }

    open() {
        if (this.isOpen()) return;
        this.panel.classList.add('history-panel--open');
        setTimeout(() => document.addEventListener('click', this.handleOutsideClick), 0);
    }

    close() {
        if (!this.isOpen()) return;
        this.panel.classList.remove('history-panel--open');
        document.removeEventListener('click', this.handleOutsideClick);
    }
    
    toggle() {
        this.isOpen() ? this.close() : this.open();
    }
    
    highlightItem(index) {
        const itemToHighlight = this.list.querySelector(`.history-panel__item[data-index="${index}"]`);
        if (itemToHighlight) {
            itemToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
            itemToHighlight.classList.add('history-item-highlight');
            setTimeout(() => {
                itemToHighlight.classList.remove('history-item-highlight');
            }, 1500);
        }
    }

    highlightLastItem() {
        this.highlightItem(0);
    }
}

export const HistoryManager = new HistoryManagerClass();
export const HistoryPanel = new HistoryPanelClass();