# AI Health Copilot Pro — Production Multi-Stage Dockerfile
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM python:3.10-slim AS final
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY dataset/ ./dataset/
COPY saved_models/ ./saved_models/
COPY reports/ ./reports/

# Copy built frontend assets
COPY --from=frontend-builder /app/dist ./dist

EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
