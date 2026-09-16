import json
import os
import secrets
import threading
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
STUDENTS_FILE = BASE_DIR / "data" / "students.json"
DATA_DIR = Path(os.environ.get("DATA_DIR", BASE_DIR / "data"))
SCORES_FILE = DATA_DIR / "scores.json"
PUBLIC_DIR = BASE_DIR / "public"

app = FastAPI()
scores_lock = threading.Lock()


def read_json(path: Path, fallback):
    try:
        return json.loads(path.read_text("utf-8"))
    except (OSError, ValueError):
        return fallback


def write_scores(scores):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    tmp = SCORES_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(scores, ensure_ascii=False, indent=2), "utf-8")
    os.replace(tmp, SCORES_FILE)


class ScoreIn(BaseModel):
    studentId: str
    account: str = ""
    score: float
    subject: str = ""
    note: str = ""


class AccountIn(BaseModel):
    account: str = ""


@app.get("/api/students")
def list_students(grade: int = 0):
    students = read_json(STUDENTS_FILE, [])
    scores = read_json(SCORES_FILE, [])
    return [
        {**s, "scores": [r for r in scores if r["studentId"] == s["id"]]}
        for s in students
        if not grade or s["grade"] == grade
    ]


@app.post("/api/scores", status_code=201)
def add_score(body: ScoreIn):
    students = read_json(STUDENTS_FILE, [])
    student = next((s for s in students if s["id"] == body.studentId), None)
    if not student:
        raise HTTPException(404, "学生不存在")
    if student["account"] != body.account.strip():
        raise HTTPException(403, "账号不匹配，请输入你自己的账号")
    if not (0 <= body.score <= 1000):
        raise HTTPException(400, "得分必须是 0-1000 之间的数字")
    record = {
        "id": secrets.token_hex(6),
        "studentId": student["id"],
        "score": body.score,
        "subject": body.subject.strip()[:50],
        "note": body.note.strip()[:200],
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    with scores_lock:
        scores = read_json(SCORES_FILE, [])
        scores.append(record)
        write_scores(scores)
    return record


@app.delete("/api/scores/{record_id}")
def delete_score(record_id: str, body: AccountIn):
    students = read_json(STUDENTS_FILE, [])
    with scores_lock:
        scores = read_json(SCORES_FILE, [])
        idx = next((i for i, r in enumerate(scores) if r["id"] == record_id), None)
        if idx is None:
            raise HTTPException(404, "记录不存在")
        student = next((s for s in students if s["id"] == scores[idx]["studentId"]), None)
        if not student or student["account"] != body.account.strip():
            raise HTTPException(403, "账号不匹配")
        scores.pop(idx)
        write_scores(scores)
    return {"ok": True}


@app.get("/")
def index():
    return FileResponse(PUBLIC_DIR / "index.html")


app.mount("/", StaticFiles(directory=PUBLIC_DIR), name="static")
