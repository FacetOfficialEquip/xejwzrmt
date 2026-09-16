FROM python:3.12-slim
WORKDIR /srv
RUN pip install --no-cache-dir "fastapi>=0.115" "uvicorn[standard]>=0.30"
COPY app ./app
COPY public ./public
COPY data/students.json ./data/students.json
ENV DATA_DIR=/data PORT=8000
EXPOSE 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
