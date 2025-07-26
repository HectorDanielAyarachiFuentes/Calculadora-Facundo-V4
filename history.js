// =======================================================
// --- history.js (VERSIÓN COMPLETA Y CORREGIDA) ---
// Gestiona el historial de operaciones, incluyendo persistencia y renderizado.
// =======================================================
"use strict";

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

    async add(item) {
        // Evita añadir duplicados consecutivos
        const duplicateIndex = this.history.findIndex(existingItem => existingItem.input === item.input);
        if (duplicateIndex !== -1) {
            alert('¡Oye! Ya has realizado esta operación antes. ¡Mira el historial!');
            if (!HistoryPanel.isOpen()) {
                HistoryPanel.open();
            }
            HistoryPanel.highlightItem(duplicateIndex);
            await reExecuteOperationFromHistory(this.history[duplicateIndex].input);
            return;
        }

        // Si el resultado no viene pre-calculado, lo extraemos del HTML visual.
        // Esta es la parte crítica que ahora funcionará correctamente.
        if (!item.result) {
            item.result = HistoryPanel.extractResultText(item.visualHtml);
        }

        this.history.unshift(item);
        if (this.history.length > this.MAX_HISTORY_ITEMS) {
            this.history.pop();
        }
        this.saveHistory();
        HistoryPanel.renderHistory();
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

    saveHistory() {
        localStorage.setItem(this.HISTORY_STORAGE_KEY, JSON.stringify(this.history));
    }
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
        if (window.confirm('¿Estás seguro de que quieres borrar todo el historial?\n\nEsta acción no se puede deshacer.')) {
            HistoryManager.clearAll();
        }
    }

    renderHistory() {
        if (!this.list) return;
        this.list.innerHTML = '';
        HistoryManager.getHistory().forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'history-panel__item';
            li.dataset.index = index;
            li.innerHTML = `
                <span class="history-panel__input">${item.input}</span>
                <span class="history-panel__result">= ${item.result}</span>
            `;
            li.addEventListener('click', async () => {
                await reExecuteOperationFromHistory(item.input);
                this.close();
            });
            this.list.appendChild(li);
        });
    }

    // *** ¡FUNCIÓN CLAVE COMPLETAMENTE REESCRITA Y ROBUSTA! ***
    // Extrae el texto del resultado de forma inteligente, basándose en la posición de las celdas.
    extractResultText(htmlString) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;

        // 1. Seleccionamos todas las celdas que pueden formar parte de un resultado
        //    (números, comas, y el signo negativo).
        const candidateCells = tempDiv.querySelectorAll('.output-grid__cell--cociente, .output-grid__cell--producto');

        // 2. Si no hay celdas de resultado, buscamos un mensaje de error o resto.
        if (candidateCells.length === 0) {
            const error = tempDiv.querySelector('.output-screen__error-message');
            if (error) return error.textContent.trim();
            const resto = tempDiv.querySelector('.output-grid__cell--resto');
            if (resto) return `Resto: ${resto.textContent.trim()}`;
            return 'Resultado no disponible'; // Fallback final
        }

        // 3. Agrupamos las celdas por su línea vertical (posición 'top').
        const lines = new Map();
        candidateCells.forEach(cell => {
            // Redondeamos el 'top' para agrupar celdas que están en la misma línea
            // aunque tengan diferencias de subpíxeles. Usamos '|| 0' como seguridad.
            const top = Math.round(parseFloat(cell.style.top) || 0);
            
            if (!lines.has(top)) {
                lines.set(top, []);
            }
            lines.get(top).push(cell);
        });

        if (lines.size === 0) return "Error al procesar resultado";

        // 4. Identificamos la línea del resultado final (la que está más abajo).
        const lowestLineY = Math.max(...lines.keys());
        const resultLineCells = lines.get(lowestLineY);

        // 5. Ordenamos las celdas de esa línea de izquierda a derecha.
        resultLineCells.sort((a, b) => {
            const leftA = parseFloat(a.style.left) || 0;
            const leftB = parseFloat(b.style.left) || 0;
            return leftA - leftB;
        });

        // 6. Unimos el texto para formar el resultado final y correcto.
        return resultLineCells.map(cell => cell.textContent).join('');
    }

    // --- Lógica del panel (sin cambios) ---
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