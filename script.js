document.addEventListener('DOMContentLoaded', () => {
    // --- 要素取得 ---
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const userInfo = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const noteList = document.getElementById('note-list');
    const newNoteBtn = document.getElementById('new-note-btn');
    const saveBtn = document.getElementById('save-btn');
    const noteTitle = document.getElementById('note-title');
    const noteEditor = document.getElementById('note-editor');
    const colorPalette = document.querySelector('.color-palette');
    const fontColorInput = document.getElementById('font-color');
    const applyColorBtn = document.getElementById('apply-color-btn');
    const markBtn = document.getElementById('mark-btn');
    const unmarkBtn = document.getElementById('unmark-btn');
    const imageInput = document.getElementById('image-input');
    const imageToolbar = document.getElementById('image-toolbar');
    const redSheetToggle = document.getElementById('red-sheet-toggle');

    const API_URL = 'http://localhost:3000/api';

    // --- グローバル変数 ---
    let currentNoteId = null;
    let notesData = [];
    let lastSelectionRange = null; 
    let selectedImage = null;

    // --- 認証関連の処理 ---
    const getToken = () => localStorage.getItem('authToken');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('username', username);
            checkLoginStatus();
        } catch (error) {
            alert(`ログイン失敗: ${error.message}`);
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            alert('ユーザー登録が成功しました！ログインしてください。');
            registerForm.reset();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
        } catch (error) {
            alert(`登録失敗: ${error.message}`);
        }
    });

    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); loginForm.style.display = 'none'; registerForm.style.display = 'block'; });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); registerForm.style.display = 'none'; loginForm.style.display = 'block'; });
    logoutBtn.addEventListener('click', () => { localStorage.removeItem('authToken'); localStorage.removeItem('username'); checkLoginStatus(); });

    const checkLoginStatus = () => {
        const token = getToken();
        if (token) {
            authContainer.style.display = 'none';
            appContainer.style.display = 'flex';
            userInfo.style.display = 'flex';
            usernameDisplay.textContent = localStorage.getItem('username');
            loadNotes();
        } else {
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
            userInfo.style.display = 'none';
        }
    };

    // --- API通信とUI操作のロジック ---

    const loadNotes = async () => {
        const token = getToken();
        if (!token) return;
        try {
            const response = await fetch(`${API_URL}/notes`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 401 || response.status === 403) { logoutBtn.click(); return; }
            if (!response.ok) throw new Error('ノートの読み込みに失敗しました。');
            notesData = await response.json();
            noteList.innerHTML = '';
            notesData.forEach(note => {
                const li = document.createElement('li');
                li.textContent = note.title;
                li.dataset.id = note.id;
                if (note.id === currentNoteId) { li.classList.add('active'); }
                noteList.appendChild(li);
            });
        } catch (error) {
            console.error('Failed to load notes:', error);
        }
    };

    saveBtn.addEventListener('click', async () => {
        const token = getToken();
        if (!token) return;
        const title = noteTitle.value || '無題のノート';
        const content = noteEditor.innerHTML;
        let method, url;
        const noteData = { title, content };
        if (currentNoteId) {
            method = 'PUT';
            url = `${API_URL}/notes/${currentNoteId}`;
        } else {
            method = 'POST';
            url = `${API_URL}/notes`;
            noteData.id = 'note-' + Date.now();
        }
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(noteData),
            });
            if (!response.ok) throw new Error('ノートの保存に失敗しました。');
            if (!currentNoteId) { currentNoteId = noteData.id; }
            await loadNotes();
        } catch (error) {
            console.error('Save failed:', error);
            alert(error.message);
        }
    });

    const openNote = (id) => {
        const note = notesData.find(n => n.id === id);
        if (note) {
            noteTitle.value = note.title;
            noteEditor.innerHTML = note.content;
            currentNoteId = id;
        }
        document.querySelectorAll('#note-list li').forEach(li => {
            li.classList.remove('active');
            if (li.dataset.id === id) { li.classList.add('active'); }
        });
    };

    newNoteBtn.addEventListener('click', () => {
        noteTitle.value = '';
        noteEditor.innerHTML = '';
        currentNoteId = null;
        document.querySelectorAll('#note-list li').forEach(li => li.classList.remove('active'));
    });

    noteList.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') { openNote(e.target.dataset.id); }
    });

    noteEditor.addEventListener('blur', () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) { lastSelectionRange = selection.getRangeAt(0); }
    });

    const applyTextColor = (color) => {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('foreColor', false, color);
        document.execCommand('styleWithCSS', false, false);
    };

    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) { return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            const img = document.createElement('img');
            img.src = imageUrl;
            noteEditor.focus();
            const selection = window.getSelection();
            if (lastSelectionRange) {
                selection.removeAllRanges();
                selection.addRange(lastSelectionRange);
            }
            selection.getRangeAt(0).insertNode(img);
            const newRange = document.createRange();
            newRange.setStartAfter(img);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            lastSelectionRange = newRange;
        };
        reader.readAsDataURL(file);
        imageInput.value = '';
    });
    
    noteEditor.addEventListener('click', (e) => {
        document.querySelectorAll('#note-editor img').forEach(img => img.classList.remove('selected'));
        imageToolbar.style.display = 'none';
        selectedImage = null;
        if (e.target.tagName === 'IMG') {
            selectedImage = e.target;
            selectedImage.classList.add('selected');
            const rect = selectedImage.getBoundingClientRect();
            const editorRect = noteEditor.getBoundingClientRect();
            imageToolbar.style.display = 'flex';
            imageToolbar.style.left = `${rect.left - editorRect.left}px`;
            imageToolbar.style.top = `${rect.top - editorRect.top - imageToolbar.offsetHeight - 5}px`;
        }
    });

    imageToolbar.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && selectedImage) {
            const size = e.target.dataset.size;
            if (size === 'auto') {
                selectedImage.style.width = 'auto';
            } else {
                selectedImage.style.width = size;
            }
            e.stopPropagation();
        }
    });

    colorPalette.addEventListener('click', (e) => { if (e.target.classList.contains('color-btn')) { applyTextColor(e.target.dataset.color); }});
    applyColorBtn.addEventListener('click', () => { applyTextColor(fontColorInput.value); });
    markBtn.addEventListener('click', () => { document.execCommand('backColor', false, 'rgba(255, 0, 0, 0.3)'); });
    unmarkBtn.addEventListener('click', () => { document.execCommand('backColor', false, 'transparent'); });
    redSheetToggle.addEventListener('click', () => { noteEditor.classList.toggle('red-sheet-mode'); });

    // --- 初期化処理 ---
    checkLoginStatus();
});