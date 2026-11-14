FROM python:3.11

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir \
    --timeout 120 \
    --retries 5 \
    -r requirements.txt

RUN pip install --no-cache-dir \
    --timeout 120 \
    --retries 5 \
    torch torchvision \
    --index-url https://download.pytorch.org/whl/cpu

COPY . .

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]