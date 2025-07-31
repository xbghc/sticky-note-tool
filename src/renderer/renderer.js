const { clipboard, ipcRenderer } = require('electron');

class StickyNoteApp {
    constructor() {
        this.sentences = this.loadSentences();
        this.initElements();
        this.bindEvents();
        this.renderSentences();
    }

    initElements() {
        this.sentenceInput = document.getElementById('sentenceInput');
        this.addBtn = document.getElementById('addBtn');
        this.sentenceList = document.getElementById('sentenceList');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.hideBtn = document.getElementById('hideBtn');
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addSentence());
        this.sentenceInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addSentence();
            }
        });
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
        this.hideBtn.addEventListener('click', () => this.hideWindow());
        
        document.addEventListener('dblclick', () => this.hideWindow());
    }

    addSentence() {
        const text = this.sentenceInput.value.trim();
        if (text) {
            const sentence = {
                id: Date.now(),
                text: text,
                createdAt: new Date().toISOString()
            };
            this.sentences.unshift(sentence);
            this.saveSentences();
            this.renderSentences();
            this.sentenceInput.value = '';
            this.sentenceInput.focus();
        }
    }

    deleteSentence(id) {
        this.sentences = this.sentences.filter(s => s.id !== id);
        this.saveSentences();
        this.renderSentences();
    }

    copySentence(id) {
        const sentence = this.sentences.find(s => s.id === id);
        if (sentence) {
            clipboard.writeText(sentence.text);
            this.deleteSentence(id);
        }
    }

    clearAll() {
        if (confirm('确定要清空所有句子吗？')) {
            this.sentences = [];
            this.saveSentences();
            this.renderSentences();
        }
    }

    hideWindow() {
        const { getCurrentWindow } = require('@electron/remote');
        const currentWindow = getCurrentWindow();
        currentWindow.hide();
    }

    renderSentences() {
        this.sentenceList.innerHTML = '';
        this.sentences.forEach(sentence => {
            const div = document.createElement('div');
            div.className = 'sentence-item';
            div.innerHTML = `
                <span>${this.escapeHtml(sentence.text)}</span>
                <button class="delete-btn" onclick="app.deleteSentence(${sentence.id})">×</button>
            `;
            div.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-btn')) {
                    this.copySentence(sentence.id);
                }
            });
            this.sentenceList.appendChild(div);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadSentences() {
        try {
            const data = localStorage.getItem('sticky-notes-sentences');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    saveSentences() {
        localStorage.setItem('sticky-notes-sentences', JSON.stringify(this.sentences));
    }
}

const app = new StickyNoteApp();