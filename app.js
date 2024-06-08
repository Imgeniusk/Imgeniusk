const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 앱 초기화
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// 데이터베이스 연결
const db = new sqlite3.Database('tasks.db');

// 테이블 생성
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS task_data (
            task TEXT,
            core TEXT,
            value INTEGER
        )
    `);
});

// 데이터 삽입 함수
function insertData(task, data) {
    const stmt = db.prepare("INSERT INTO task_data (task, core, value) VALUES (?, ?, ?)");
    for (const core in data) {
        data[core].forEach(value => {
            stmt.run(task, core, value);
        });
    }
    stmt.finalize();
}

// 웹 서버
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/add_data', (req, res) => {
    const { task, core, value } = req.body;
    db.run("INSERT INTO task_data (task, core, value) VALUES (?, ?, ?)", [task, core, parseInt(value)], (err) => {
        if (err) {
            return console.error(err.message);
        }
        res.redirect('/');
    });
});

app.get('/show_graph', (req, res) => {
    const task = req.query.task;
    db.all(`
        SELECT core, MIN(value) as MIN, MAX(value) as MAX, AVG(value) as AVG
        FROM task_data
        WHERE task = ?
        GROUP BY core
    `, [task], (err, rows) => {
        if (err) {
            return console.error(err.message);
        }
        res.json(rows);
    });
});

// 서버 실행
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
