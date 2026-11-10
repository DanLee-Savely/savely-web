-- 기록 체험판 (docs/spec/70-mvp-records.md §6-2)
CREATE TABLE records (
  id             TEXT PRIMARY KEY,
  kind           TEXT NOT NULL DEFAULT 'expense'
                 CHECK (kind IN ('expense', 'income')),
  amount         INTEGER NOT NULL
                 CHECK (amount BETWEEN 1 AND 999999999999),
  record_date    TEXT NOT NULL
                 CHECK (record_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  category_id    TEXT NOT NULL CHECK (category_id IN (
                   'food','cafe','grocery','transport','fuel','parking','car','housing',
                   'telecom','shopping','medical','beauty','health','culture','subscription',
                   'education','travel','alcohol','event','pet','baby','insurance','etc_expense',
                   'salary','allowance','side_income','refund','interest','etc_income')),
  title          TEXT CHECK (title IS NULL OR length(title) <= 60),
  payment_method TEXT CHECK (payment_method IN
                   ('cash','check_card','credit_card','bank_transfer','other')),
  reason         TEXT CHECK (reason IN ('need','impulse','value','fixed','other')),
  feeling        TEXT CHECK (feeling IN ('proud','satisfied','meh','unsatisfied','regret')),
  memo           TEXT CHECK (memo IS NULL OR length(memo) <= 200),
  image_key      TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  -- 수입에는 지출 전용 항목을 넣지 않는다
  CHECK (kind = 'expense' OR (payment_method IS NULL AND reason IS NULL AND feeling IS NULL))
);

-- 목록 정렬 · 페이지 나누기용
CREATE INDEX records_date_idx ON records (record_date DESC, created_at DESC);
