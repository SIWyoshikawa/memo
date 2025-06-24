const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path'); // ★ pathモジュールを読み込み

// XSS対策のライブラリ
const { JSDOM } = require('jsdom');
const DOMPurify = require('dompurify');
const window = new JSDOM('').window;
const purify = DOMPurify(window);

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-very-secret-key';

// --- ミドルウェア設定 ---
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ★ 静的ファイル(HTML, CSS, JS)を配信するための設定
// この設定は、APIのルート定義よりも「前」に置くことが重要です。
app.use(express.static(path.join(__dirname, '')));


// --- データベース設定 ---
const db = new sqlite3.Database('./notes.db', (err) => {
    if (err) { console.error(err.message); }
    console.log('Connected to the notes database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT, user_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id))`);
});

const authMiddleware = require('./authMiddleware');

// --- APIルート定義 ---

// 認証API
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) { return res.status(400).json({ message: "ユーザー名とパスワードを入力してください。" });}
    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;
    db.run(sql, [username, hashedPassword], function(err) {
        if (err) { return res.status(400).json({ message: "このユーザー名は既に使用されています。" }); }
        res.status(201).json({ message: "ユーザー登録が成功しました。" });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const sql = `SELECT * FROM users WHERE username = ?`;
    db.get(sql, [username], (err, user) => {
        if (err || !user) { return res.status(401).json({ message: "ユーザー名またはパスワードが違います。" }); }
        const isPasswordCorrect = bcrypt.compareSync(password, user.password);
        if (!isPasswordCorrect) { return res.status(401).json({ message: "ユーザー名またはパスワードが違います。" }); }
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: "ログイン成功", token });
    });
});

// ノートAPI
app.get('/api/notes', authMiddleware, (req, res) => {
    const sql = "SELECT * FROM notes WHERE user_id = ? ORDER BY id DESC";
    db.all(sql, [req.user.id], (err, rows) => {
        if (err) { return res.status(500).json({ "error": err.message }); }
        res.json(rows);
    });
});

app.post('/api/notes', authMiddleware, (req, res) => {
    const { id, title, content } = req.body;
    const cleanContent = purify.sanitize(content); // XSS対策
    const sql = `INSERT INTO notes (id, title, content, user_id) VALUES (?, ?, ?, ?)`;
    db.run(sql, [id, title, cleanContent, req.user.id], function(err) {
        if (err) { return res.status(400).json({ "error": err.message }); }
        res.json({ "message": "success", "id": id });
    });
});

app.put('/api/notes/:id', authMiddleware, (req, res) => {
    const { title, content } = req.body;
    const cleanContent = purify.sanitize(content); // XSS対策
    const sql = `UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ?`;
    db.run(sql, [title, cleanContent, req.params.id, req.user.id], function(err) {
        if (err) { return res.status(400).json({ "error": err.message }); }
        if (this.changes === 0) { return res.status(404).json({ message: "ノートが見つからないか、編集権限がありません。" });}
        res.json({ "message": "success", "id": req.params.id });
    });
});

app.delete('/api/notes/:id', authMiddleware, (req, res) => {
    const sql = `DELETE FROM notes WHERE id = ? AND user_id = ?`;
    db.run(sql, [req.params.id, req.user.id], function(err) {
        if (err) { return res.status(400).json({ "error": err.message }); }
        if (this.changes === 0) { return res.status(404).json({ message: "ノートが見つからないか、削除権限がありません。" }); }
        res.json({ "message": "deleted", "id": req.params.id });
    });
});

// --- サーバー起動 ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});