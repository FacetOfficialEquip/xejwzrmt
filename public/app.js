const grade = Number(document.body.dataset.grade);
const tbody = document.querySelector('#table tbody');
const search = document.getElementById('search');
const modal = document.getElementById('modal');
const form = document.getElementById('score-form');
const formError = document.getElementById('form-error');
const history = document.getElementById('history');
let students = [];
let current = null;

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function load() {
  const res = await fetch(`/api/students?grade=${grade}`);
  students = await res.json();
  render();
  if (current) {
    current = students.find((s) => s.id === current.id);
    renderHistory();
  }
}

function render() {
  const q = search.value.trim();
  tbody.innerHTML = students
    .filter((s) => !q || s.name.includes(q) || s.class.includes(q) || s.account.includes(q))
    .map((s, i) => {
      const latest = s.scores.length ? s.scores[s.scores.length - 1].score : '-';
      const total = s.scores.reduce((a, r) => a + r.score, 0);
      return `<tr>
        <td>${i + 1}</td>
        <td>${esc(s.name)}</td>
        <td>${esc(s.class)}</td>
        <td><code>${esc(s.account)}</code></td>
        <td>${latest}</td>
        <td>${s.scores.length ? total : '-'} <small>(${s.scores.length}次)</small></td>
        <td><button data-id="${s.id}">记录得分</button></td>
      </tr>`;
    })
    .join('');
}

function openModal(id) {
  current = students.find((s) => s.id === id);
  document.getElementById('modal-title').textContent = `${current.name}（${current.class}）`;
  form.reset();
  formError.textContent = '';
  renderHistory();
  modal.classList.remove('hidden');
  form.account.focus();
}

function renderHistory() {
  if (!current) return;
  history.innerHTML = current.scores.length
    ? current.scores
        .slice()
        .reverse()
        .map(
          (r) => `<li>
            <span>${new Date(r.createdAt).toLocaleString('zh-CN')}</span>
            <span>${esc(r.subject || '-')}</span>
            <strong>${r.score}</strong>
            <span>${esc(r.note || '')}</span>
            <button class="del" data-id="${r.id}" title="删除">×</button>
          </li>`
        )
        .join('')
    : '<li class="empty">暂无记录</li>';
}

tbody.addEventListener('click', (e) => {
  const id = e.target.dataset.id;
  if (id) openModal(id);
});

document.getElementById('cancel').onclick = () => modal.classList.add('hidden');
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.add('hidden');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.textContent = '';
  const data = Object.fromEntries(new FormData(form));
  const res = await fetch('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, studentId: current.id }),
  });
  const body = await res.json();
  if (!res.ok) {
    formError.textContent = body.error || '保存失败';
    return;
  }
  form.score.value = '';
  form.note.value = '';
  await load();
});

history.addEventListener('click', async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;
  const account = form.account.value.trim();
  if (!account) {
    formError.textContent = '删除前请先在上方输入账号';
    return;
  }
  if (!confirm('确定删除这条记录？')) return;
  const res = await fetch(`/api/scores/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account }),
  });
  const body = await res.json();
  if (!res.ok) {
    formError.textContent = body.error || '删除失败';
    return;
  }
  await load();
});

search.addEventListener('input', render);
load();
