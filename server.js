const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3000; // サーバーを起動するポート番号

// ミドルウェアの設定
app.use(cors()); // CORSを許可する
app.use(express.json()); // POSTリクエストのbodyをJSONとして解析する

// データベースへの接続 (ファイルが存在しない場合は自動的に作成される)
const db = new sqlite3.Database('./notes.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the notes database.');
});

// データベースのテーブル作成 (初回起動時のみ実行される)
db.run(`CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT
)`);

// --- APIエンドポイントの定義 ---

// GET /api/notes: 全てのノートを取得
app.get('/api/notes', (req, res) => {
    const sql = "SELECT * FROM notes ORDER BY id DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

// POST /api/notes: 新しいノートを作成
app.post('/api/notes', (req, res) => {
    const { id, title, content } = req.body;
    const sql = `INSERT INTO notes (id, title, content) VALUES (?, ?, ?)`;
    db.run(sql, [id, title, content], function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "id": id });
    });
});

// PUT /api/notes/:id: 既存のノートを更新
app.put('/api/notes/:id', (req, res) => {
    const { title, content } = req.body;
    const sql = `UPDATE notes SET title = ?, content = ? WHERE id = ?`;
    db.run(sql, [title, content, req.params.id], function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "id": req.params.id });
    });
});

// サーバーを起動
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});