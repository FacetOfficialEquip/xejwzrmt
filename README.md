# 学生得分记录系统

按年级（五年级 / 六年级）分两个页面，展示学生姓名、班级、分配的账号，学生可凭账号记录自己的得分。

- `/grade5.html` 五年级页面，`/grade6.html` 六年级页面
- 学生名单：`data/students.json`（可直接修改姓名 / 班级 / 账号）
- 得分记录：`scores.json`（自动生成，保存在 `DATA_DIR` 目录下）

## 一键部署到 Render（推荐，免费）

1. 打开 https://dashboard.render.com 并用 GitHub 登录。
2. 点击 **New +** → **Blueprint**，选择本仓库 `FacetOfficialEquip/xejwzrmt`。
3. Render 会自动读取 `render.yaml`，点击 **Apply** 即可。
4. 等待 2–3 分钟，部署完成后会得到一个类似 `https://student-score-system.onrender.com` 的地址，把它发给学生即可。

`render.yaml` 默认使用 Starter 套餐（约 $7/月）并挂载 1GB 持久磁盘到 `/data`，得分记录不会丢失。
如果只想免费试用：把 `render.yaml` 中的 `plan: starter` 改成 `plan: free` 并删掉 `disk:` 段，但免费版每次休眠 / 重启后得分记录会清空。

## 部署到 Railway

1. 打开 https://railway.app ，**New Project** → **Deploy from GitHub repo**，选择本仓库。
2. 在 **Variables** 中添加 `DATA_DIR=/data`。
3. 在 **Settings → Volumes** 添加一个 Volume，挂载路径填 `/data`。
4. Railway 会自动识别 `Dockerfile` 完成部署。

## 本地运行

```bash
pip install fastapi uvicorn
uvicorn app.main:app --port 8000     # http://localhost:8000
```

或使用 Node 版（功能相同）：

```bash
npm start                             # http://localhost:3000
```

## 修改学生名单 / 账号

编辑 `data/students.json`，每个学生一行：

```json
{"id": "g5-01", "grade": 5, "name": "温梓桦", "class": "五（1）", "account": "wu01"}
```

修改后提交推送，Render / Railway 会自动重新部署。
