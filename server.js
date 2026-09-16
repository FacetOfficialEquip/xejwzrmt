const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const SCORES_FILE = path.join(DATA_DIR, 'scores.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8` });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const students = readJson(STUDENTS_FILE, []);
  const scores = readJson(SCORES_FILE, []);

  // GET /api/students?grade=5
  if (url.pathname === '/api/students' && req.method === 'GET') {
    const grade = Number(url.searchParams.get('grade'));
    const list = students
      .filter((s) => !grade || s.grade === grade)
      .map((s) => ({ ...s, scores: scores.filter((r) => r.studentId === s.id) }));
    return send(res, 200, list);
  }

  // POST /api/scores  { studentId, account, score, subject, note }
  if (url.pathname === '/api/scores' && req.method === 'POST') {
    let body;
    try {
      body = await readBody(req);
    } catch {
      return send(res, 400, { error: '无效的请求数据' });
    }
    const student = students.find((s) => s.id === body.studentId);
    if (!student) return send(res, 404, { error: '学生不存在' });
    if (student.account !== String(body.account || '').trim()) {
      return send(res, 403, { error: '账号不匹配，请输入你自己的账号' });
    }
    const score = Number(body.score);
    if (!Number.isFinite(score) || score < 0 || score > 1000) {
      return send(res, 400, { error: '得分必须是 0-1000 之间的数字' });
    }
    const record = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      studentId: student.id,
      score,
      subject: String(body.subject || '').trim().slice(0, 50),
      note: String(body.note || '').trim().slice(0, 200),
      createdAt: new Date().toISOString(),
    };
    scores.push(record);
    writeJson(SCORES_FILE, scores);
    return send(res, 201, record);
  }

  // DELETE /api/scores/:id  { account }
  const del = url.pathname.match(/^\/api\/scores\/([\w]+)$/);
  if (del && req.method === 'DELETE') {
    let body;
    try {
      body = await readBody(req);
    } catch {
      return send(res, 400, { error: '无效的请求数据' });
    }
    const idx = scores.findIndex((r) => r.id === del[1]);
    if (idx < 0) return send(res, 404, { error: '记录不存在' });
    const student = students.find((s) => s.id === scores[idx].studentId);
    if (!student || student.account !== String(body.account || '').trim()) {
      return send(res, 403, { error: '账号不匹配' });
    }
    scores.splice(idx, 1);
    writeJson(SCORES_FILE, scores);
    return send(res, 200, { ok: true });
  }

  // static files
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  filePath = path.normalize(path.join(PUBLIC_DIR, filePath));
  if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, 'Not Found', 'text/plain');
    send(res, 200, data.toString(), MIME[path.extname(filePath)] || 'text/plain');
  });
});

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
