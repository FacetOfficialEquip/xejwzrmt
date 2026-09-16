---
name: testing-student-scores
description: Run the student score app locally and exercise account-verified score entry, history, search, and persistence.
---

# Local score UI testing

Use the FastAPI implementation as primary target. From the repository root run
`DATA_DIR=/tmp/student-scores-test python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000`.
FastAPI and uvicorn must be installed per pyproject.toml. Choose a fresh writable
DATA_DIR for disposable tests; never delete or reuse real score data blindly.
The roster remains in data/students.json; only scores use DATA_DIR.

Open http://localhost:8000, choose a grade, and click the student's 记录得分
button. Accounts are visible in each row and in data/students.json; there is no
separate login. The modal account also authorizes history deletion using ×,
followed by browser confirmation. Reopening resets account input.

Check latest score, arithmetic total, and record count after saving two distinct
values and after deleting the newest value. Reload and reopen history to verify
persistence. Exercise blank/wrong account, empty score, and both sides of numeric
bounds. Native HTML validation may be in the browser's language rather than Chinese.
Search accepts substrings of name, class, or account.

For Chinese text input, verify actual field contents before saving. If the
desktop typing method cannot enter CJK reliably, use native copy/paste from
rendered roster text for search and report any free-text coverage limitation.
In Chrome responsive device mode, split click and typing into separate tool
calls so focus can settle before typing.

## Devin Secrets Needed

None for local testing. Do not treat roster account codes as secure login secrets.
