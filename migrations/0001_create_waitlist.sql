-- 출시 알림 신청 (30-waitlist §4). IP · 기기 정보는 저장하지 않는다
CREATE TABLE IF NOT EXISTS waitlist (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT    NOT NULL UNIQUE,
  consented_at TEXT    NOT NULL,           -- ISO 8601 (UTC)
  created_at   TEXT    NOT NULL,           -- ISO 8601 (UTC)
  source       TEXT
);
