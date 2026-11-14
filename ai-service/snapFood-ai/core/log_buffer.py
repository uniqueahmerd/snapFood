import logging
from collections import deque
from datetime import datetime, timezone
from threading import Lock
from typing import Any


class AdminLogBuffer(logging.Handler):
    def __init__(self, capacity: int = 1000) -> None:
        super().__init__()
        self._entries: deque[dict[str, Any]] = deque(maxlen=capacity)
        self._lock = Lock()

    def emit(self, record: logging.LogRecord) -> None:
        entry = {
            "timestamp": datetime.fromtimestamp(record.created, timezone.utc).isoformat(),
            "level": record.levelname.lower(),
            "message": self.format(record),
            "source": "ai",
        }
        with self._lock:
            self._entries.append(entry)

    def recent(self, limit: int = 50) -> list[dict[str, Any]]:
        safe_limit = max(1, min(limit, 200))
        with self._lock:
            return list(self._entries)[-safe_limit:][::-1]


ai_log_handler = AdminLogBuffer()
ai_log_handler.setFormatter(logging.Formatter("%(name)s: %(message)s"))


def get_recent_logs(limit: int = 50) -> list[dict[str, Any]]:
    return ai_log_handler.recent(limit)