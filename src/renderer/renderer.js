const { ipcRenderer } = require('electron');
const { clipboardService: clipboard } = require('../../dist/renderer/services/clipboardService');

class StickyNoteApp {
    constructor() {
        this.sentences = this.loadSentences();
        this.initElements();
        this.bindEvents();
        this.renderSentences();
        this.setupIPC();
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
            clipboard.copy(sentence.text);
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
            div.title = sentence.text;
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

    setupIPC() {
        // 监听来自主进程的弹出第一行命令
        ipcRenderer.on('pop-first-sentence', () => {
            this.popFirstSentence();
        });
    }

    async popFirstSentence() {
        try {
            // 检查是否有句子
            if (this.sentences.length === 0) {
                return;
            }

            // 获取第一个句子
            const firstSentence = this.sentences[0];
            
            // 复制到剪贴板
            clipboard.copy(firstSentence.text);
            
            // 删除第一个句子
            this.sentences.shift();
            this.saveSentences();
            this.renderSentences();
            
            // 使用粘贴功能
            await clipboard.paste();
            
        } catch (error) {
            // 如果自动输入失败，至少内容已经在剪贴板中，用户可以手动粘贴
            this.showStatus('自动输入失败，内容已在剪贴板中');
        }
    }

    
    showStatus(message) {
        // 在页面上显示状态信息
        const statusDiv = document.getElementById('status') || (() => {
            const div = document.createElement('div');
            div.id = 'status';
            div.style.cssText = 'position: fixed; bottom: 10px; left: 10px; right: 10px; padding: 10px; background: #333; color: white; font-size: 12px; border-radius: 5px; z-index: 1000;';
            document.body.appendChild(div);
            return div;
        })();
        
        statusDiv.textContent = message;
        
        // 3秒后自动隐藏
        clearTimeout(this.statusTimeout);
        this.statusTimeout = setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
        statusDiv.style.display = 'block';
    }
}

const app = new StickyNoteApp();