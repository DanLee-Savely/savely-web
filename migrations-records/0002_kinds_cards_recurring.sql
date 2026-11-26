-- 대화로 기록하기 v2 (docs/spec/80-record-assistant.md §5)
-- 1) records: 구분 4가지 · 카테고리 41종(비어도 됨) · 카드 이름. SQLite는 CHECK를 ALTER로 바꿀 수 없어 다시 만든다
-- 2) cards · recurring_items · assistant_usage 새 테이블
-- 외래 키가 없다. BEGIN/COMMIT은 쓰지 않는다(D1이 마이그레이션을 한 묶음으로 실행하고, 실패하면 되돌린다)

CREATE TABLE records_v2 (
  id             TEXT PRIMARY KEY,
  kind           TEXT NOT NULL DEFAULT 'expense'
                 CHECK (kind IN ('expense', 'income', 'transfer', 'savings')),
  amount         INTEGER NOT NULL
                 CHECK (amount BETWEEN 1 AND 999999999999),
  record_date    TEXT NOT NULL
                 CHECK (record_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  -- 금액만 먼저 적은 기록은 카테고리가 비어 있다. 구분과 맞는지는 서버 코드(CategoryCatalog)가 검사한다
  category_id    TEXT CHECK (category_id IS NULL OR category_id IN (
                   'food','cafe','grocery','convenience','transport','fuel','parking','car','housing',
                   'telecom','shopping','medical','beauty','health','culture','subscription','education',
                   'travel','alcohol','event','pet','baby','insurance','etc_expense',
                   'salary','allowance','side_income','refund','interest','etc_income',
                   'card_bill','loan_payment','interest_payment',
                   'savings_deposit','emergency_fund','house_savings','invest','fund','pension',
                   'forex','etc_savings')),
  title          TEXT CHECK (title IS NULL OR length(title) <= 60),
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN
                   ('cash','check_card','credit_card','bank_transfer','other')),
  card_name      TEXT CHECK (card_name IS NULL OR length(card_name) BETWEEN 1 AND 20),
  reason         TEXT CHECK (reason IS NULL OR reason IN ('need','impulse','value','fixed','other')),
  feeling        TEXT CHECK (feeling IS NULL OR feeling IN ('proud','satisfied','meh','unsatisfied','regret')),
  memo           TEXT CHECK (memo IS NULL OR length(memo) <= 200),
  image_key      TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  -- 지출이 아니면 지출 전용 항목을 넣지 않는다
  CHECK (kind = 'expense' OR (payment_method IS NULL AND card_name IS NULL AND reason IS NULL AND feeling IS NULL)),
  -- 카드 이름은 카드 결제일 때만
  CHECK (card_name IS NULL OR (payment_method IS NOT NULL AND payment_method IN ('credit_card','check_card')))
);

INSERT INTO records_v2 (id, kind, amount, record_date, category_id, title, payment_method, card_name,
                        reason, feeling, memo, image_key, created_at, updated_at)
SELECT id, kind, amount, record_date, category_id, title, payment_method, NULL,
       reason, feeling, memo, image_key, created_at, updated_at
FROM records;

DROP TABLE records;
ALTER TABLE records_v2 RENAME TO records;

-- 목록 정렬 · 페이지 나누기용 (DROP TABLE로 함께 지워져 다시 만든다)
CREATE INDEX records_date_idx ON records (record_date DESC, created_at DESC);

-- 등록 카드: 대화로 등록한 카드 이름(공용). 30장 한도는 서버 코드가 검사한다
CREATE TABLE cards (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 20),
  method     TEXT NOT NULL CHECK (method IN ('credit_card','check_card')),
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX cards_name_key ON cards (name);

-- 고정지출 · 고정수입(공용). 30개 한도는 서버 코드가 검사한다
-- 「이번 달은 아니에요」(건너뛴 달)는 방문자별로 브라우저에 둔다 — 이 테이블에 없다(K14)
CREATE TABLE recurring_items (
  id             TEXT PRIMARY KEY,
  kind           TEXT NOT NULL CHECK (kind IN ('expense', 'income', 'transfer', 'savings')),
  amount         INTEGER NOT NULL CHECK (amount BETWEEN 1 AND 999999999999),
  day_of_month   INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  title          TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 60),
  -- 같은 이름인지 견주는 꼴: 빈칸을 하나로 줄이고 영문은 소문자로(서버 코드가 만든다)
  name_key       TEXT NOT NULL CHECK (length(name_key) BETWEEN 1 AND 60),
  category_id    TEXT CHECK (category_id IS NULL OR category_id IN (
                   'food','cafe','grocery','convenience','transport','fuel','parking','car','housing',
                   'telecom','shopping','medical','beauty','health','culture','subscription','education',
                   'travel','alcohol','event','pet','baby','insurance','etc_expense',
                   'salary','allowance','side_income','refund','interest','etc_income',
                   'card_bill','loan_payment','interest_payment',
                   'savings_deposit','emergency_fund','house_savings','invest','fund','pension',
                   'forex','etc_savings')),
  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN
                   ('cash','check_card','credit_card','bank_transfer','other')),
  card_name      TEXT CHECK (card_name IS NULL OR length(card_name) BETWEEN 1 AND 20),
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  CHECK (kind = 'expense' OR (payment_method IS NULL AND card_name IS NULL)),
  CHECK (card_name IS NULL OR (payment_method IS NOT NULL AND payment_method IN ('credit_card','check_card')))
);
-- 같은 구분 · 같은 이름은 하나만
CREATE UNIQUE INDEX recurring_items_kind_name_key ON recurring_items (kind, name_key);

-- 날짜(Asia/Seoul)별 OpenAI 호출 수. 문장 · IP는 없다
CREATE TABLE assistant_usage (
  usage_date TEXT PRIMARY KEY
             CHECK (usage_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  calls      INTEGER NOT NULL DEFAULT 0 CHECK (calls >= 0)
);
