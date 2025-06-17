document.addEventListener('DOMContentLoaded', () => {
    // APIサーバーのURL
    const API_URL = 'http://localhost:3000/api';

    // HTML要素を取得 (変更なし)
    const noteList = document.getElementById('note-list');
    const newNoteBtn = document.getElementById('new-note-btn');
    const saveBtn = document.getElementById('save-btn');
    // ... (他の要素取得も同様)
    const colorPalette = document.querySelector('.color-palette');
    const fontColorInput = document.getElementById('font-color');
    const applyColorBtn = document.getElementById('apply-color-btn');
    const markBtn = document.getElementById('mark-btn');
    const unmarkBtn = document.getElementById('unmark-btn');
    const insertImageBtn = document.getElementById('insert-image-btn');
    const imageInput = document.getElementById('image-input');
    const imageToolbar = document.getElementById('image-toolbar');
    const redSheetToggle = document.getElementById('red-sheet-toggle');
    const noteTitle = document.getElementById('note-title');
    const noteEditor = document.getElementById('note-editor');
    
    let currentNoteId = null;
    let notesData = []; // ★ データをローカルにも保持する
    // (他のグローバル変数も同様)
    let lastSelectionRange = null; 
    let selectedImage = null;


    // ★ 修正: DBからノート一覧を読み込む
    const loadNotes = async () => {
        try {
            const response = await fetch(`${API_URL}/notes`);
            notesData = await response.json();
            
            noteList.innerHTML = '';
            notesData.forEach(note => {
                const li = document.createElement('li');
                li.textContent = note.title;
                li.dataset.id = note.id;
                if (note.id === currentNoteId) {
                    li.classList.add('active');
                }
                noteList.appendChild(li);
            });
        } catch (error) {
            console.error('Failed to load notes:', error);
        }
    };

    // ★ 修正: IDを元にノートを開く
    const openNote = (id) => {
        const note = notesData.find(n => n.id === id);
        if (note) {
            noteTitle.value = note.title;
            noteEditor.innerHTML = note.content;
            currentNoteId = id;
        }
        document.querySelectorAll('#note-list li').forEach(li => {
            li.classList.remove('active');
            if (li.dataset.id === id) {
                li.classList.add('active');
            }
        });
    };

    // 新規ノート作成 (変更なし)
    newNoteBtn.addEventListener('click', () => { /* ... */ });
    newNoteBtn.addEventListener('click', () => {noteTitle.value = '';noteEditor.innerHTML = '';currentNoteId = null;document.querySelectorAll('#note-list li').forEach(li => li.classList.remove('active'));});

    // ノート一覧からノートを選択 (変更なし)
    noteList.addEventListener('click', (e) => { /* ... */ });
    noteList.addEventListener('click', (e) => {if (e.target.tagName === 'LI') {openNote(e.target.dataset.id);}});

    // ★ 修正: ノートをDBに保存する
    saveBtn.addEventListener('click', async () => {
        const title = noteTitle.value || '無題のノート';
        const content = noteEditor.innerHTML;
        let method, url;

        const noteData = {
            title: title,
            content: content
        };

        if (currentNoteId) {
            // 既存ノートの更新 (PUT)
            method = 'PUT';
            url = `${API_URL}/notes/${currentNoteId}`;
        } else {
            // 新規ノートの作成 (POST)
            method = 'POST';
            url = `${API_URL}/notes`;
            noteData.id = 'note-' + Date.now(); // フロント側でIDを生成
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(noteData),
            });

            if (!response.ok) {
                throw new Error('Failed to save the note.');
            }
            
            if (!currentNoteId) {
                currentNoteId = noteData.id;
            }
            
            await loadNotes(); // 保存後にリストを再読み込み
            alert('ノートを保存しました。');

        } catch (error) {
            console.error('Save failed:', error);
            alert('ノートの保存に失敗しました。');
        }
    });

    // --- ここから下のコードはlocalStorageに依存していないため、変更なし ---
    // (画像挿入、テキスト装飾、赤シートなどのロジックはそのまま)
    noteEditor.addEventListener('blur', () => {const selection = window.getSelection();if (selection.rangeCount > 0) {lastSelectionRange = selection.getRangeAt(0);}});const applyTextColor = (color) => {const selection = window.getSelection();if (!selection.rangeCount || selection.isCollapsed) return;document.execCommand('styleWithCSS', false, true);document.execCommand('foreColor', false, color);document.execCommand('styleWithCSS', false, false);};insertImageBtn.addEventListener('click', () => {imageInput.click();});imageInput.addEventListener('change', (event) => {const file = event.target.files[0];if (!file || !file.type.startsWith('image/')) {return;}const reader = new FileReader();reader.onload = (e) => {const imageUrl = e.target.result;const img = document.createElement('img');img.src = imageUrl;noteEditor.focus();const selection = window.getSelection();if (lastSelectionRange) {selection.removeAllRanges();selection.addRange(lastSelectionRange);}selection.getRangeAt(0).insertNode(img);const newRange = document.createRange();newRange.setStartAfter(img);newRange.collapse(true);selection.removeAllRanges();selection.addRange(newRange);lastSelectionRange = newRange;};reader.readAsDataURL(file);imageInput.value = '';});noteEditor.addEventListener('click', (e) => {document.querySelectorAll('#note-editor img').forEach(img => img.classList.remove('selected'));imageToolbar.style.display = 'none';selectedImage = null;if (e.target.tagName === 'IMG') {selectedImage = e.target;selectedImage.classList.add('selected');const rect = selectedImage.getBoundingClientRect();const editorRect = noteEditor.getBoundingClientRect();imageToolbar.style.display = 'flex';imageToolbar.style.left = `${rect.left - editorRect.left}px`;imageToolbar.style.top = `${rect.top - editorRect.top - imageToolbar.offsetHeight - 5}px`;}});imageToolbar.addEventListener('click', (e) => {if (e.target.tagName === 'BUTTON' && selectedImage) {const size = e.target.dataset.size;if (size === 'auto') {selectedImage.style.width = 'auto';} else {selectedImage.style.width = size;}e.stopPropagation();}});colorPalette.addEventListener('click', (e) => {if (e.target.classList.contains('color-btn')) {applyTextColor(e.target.dataset.color);}});applyColorBtn.addEventListener('click', () => {applyTextColor(fontColorInput.value);});markBtn.addEventListener('click', () => { document.execCommand('backColor', false, 'rgba(255, 0, 0, 0.3)'); });unmarkBtn.addEventListener('click', () => { document.execCommand('backColor', false, 'transparent'); });redSheetToggle.addEventListener('click', () => { noteEditor.classList.toggle('red-sheet-mode'); });


    // --- 初期化処理 ---
    loadNotes();
});