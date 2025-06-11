document.addEventListener('DOMContentLoaded', () => {
    // HTML要素を取得
    const noteList = document.getElementById('note-list');
    const newNoteBtn = document.getElementById('new-note-btn');
    const saveBtn = document.getElementById('save-btn');
    const fontColorInput = document.getElementById('font-color');
    const markBtn = document.getElementById('mark-btn');
    const redSheetToggle = document.getElementById('red-sheet-toggle');
    const noteTitle = document.getElementById('note-title');
    const noteEditor = document.getElementById('note-editor');
    
    let currentNoteId = null;

    // --- ユーティリティ関数 ---
    // 選択範囲のテキストを特定のタグで囲む関数
    const wrapText = (tag, className = null) => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const element = document.createElement(tag);
            if (className) {
                element.className = className;
            }
            // style属性を直接つける場合（文字色変更用）
            if (tag === 'span' && !className) {
                element.style.color = fontColorInput.value;
            }
            element.appendChild(range.extractContents());
            range.insertNode(element);
        }
    };

    // --- 機能1: 文字の色を指定 ---
    fontColorInput.addEventListener('change', () => {
        wrapText('span');
    });

    // --- 機能2: ノートの新規作成と管理 ---
    // ローカルストレージからノートを読み込んで一覧表示
    const loadNotes = () => {
        const notes = JSON.parse(localStorage.getItem('notes-app') || '[]');
        noteList.innerHTML = '';
        notes.forEach(note => {
            const li = document.createElement('li');
            li.textContent = note.title;
            li.dataset.id = note.id;
            if (note.id === currentNoteId) {
                li.classList.add('active');
            }
            noteList.appendChild(li);
        });
    };

    // ノートを開く
    const openNote = (id) => {
        const notes = JSON.parse(localStorage.getItem('notes-app') || '[]');
        const note = notes.find(n => n.id === id);
        if (note) {
            noteTitle.value = note.title;
            noteEditor.innerHTML = note.content;
            currentNoteId = id;
        }
        // 他のノートの選択状態を解除し、現在のノートを選択状態にする
        document.querySelectorAll('#note-list li').forEach(li => {
            li.classList.remove('active');
            if (li.dataset.id === id) {
                li.classList.add('active');
            }
        });
    };

    // 新規ノート作成
    newNoteBtn.addEventListener('click', () => {
        noteTitle.value = '';
        noteEditor.innerHTML = '';
        currentNoteId = null;
        document.querySelectorAll('#note-list li').forEach(li => li.classList.remove('active'));
    });

    // ノート一覧からノートを選択
    noteList.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            openNote(e.target.dataset.id);
        }
    });

    // ノートを保存
    saveBtn.addEventListener('click', () => {
        const notes = JSON.parse(localStorage.getItem('notes-app') || '[]');
        const title = noteTitle.value || '無題のノート';
        const content = noteEditor.innerHTML;

        if (currentNoteId) {
            // 既存のノートを更新
            const note = notes.find(n => n.id === currentNoteId);
            if (note) {
                note.title = title;
                note.content = content;
            }
        } else {
            // 新規ノートを保存
            const newNote = {
                id: 'note-' + Date.now(), // ユニークなIDを生成
                title: title,
                content: content
            };
            notes.push(newNote);
            currentNoteId = newNote.id;
        }

        localStorage.setItem('notes-app', JSON.stringify(notes));
        loadNotes();
    });

    // --- 機能3: 赤シート機能 ---
    // テキストをマーキング
    markBtn.addEventListener('click', () => {
        wrapText('span', 'red-sheet-marker');
    });

    // 赤シートモードのON/OFF
    redSheetToggle.addEventListener('click', () => {
        document.body.classList.toggle('red-sheet-mode');
    });

    // --- 初期化処理 ---
    loadNotes();
});
