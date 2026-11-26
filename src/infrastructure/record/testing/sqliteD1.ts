import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

// 단위 테스트 전용 — Node 내장 SQLite를 D1처럼 쓰게 해 주는 얇은 껍데기.
// 실제 마이그레이션 파일과 D1 저장소의 SQL을 그대로 돌려 본다. 실행 환경의 저장소로 쓰지 않는다
// 지원: prepare().bind().run() · all() · first(), batch() — 이 저장소가 쓰는 만큼만

const MIGRATIONS = join(process.cwd(), "migrations-records");

class SqliteStatement {
  constructor(
    private readonly db: DatabaseSync,
    private readonly sql: string,
    private readonly params: SQLInputValue[] = [],
  ) {}

  bind(...params: SQLInputValue[]): SqliteStatement {
    return new SqliteStatement(this.db, this.sql, params);
  }

  async run(): Promise<{ meta: { changes: number } }> {
    const { changes } = this.db.prepare(this.sql).run(...this.params);
    return { meta: { changes: Number(changes) } };
  }

  async all<T>(): Promise<{ results: T[] }> {
    return { results: this.db.prepare(this.sql).all(...this.params) as T[] };
  }

  async runOrAll(): Promise<{ results: unknown[]; meta: { changes: number } }> {
    if (/^\s*select/i.test(this.sql)) return { ...(await this.all()), meta: { changes: 0 } };
    return { results: [], ...(await this.run()) };
  }

  async first<T>(): Promise<T | null> {
    return (this.db.prepare(this.sql).get(...this.params) as T | undefined) ?? null;
  }
}

export class SqliteD1 {
  private readonly db = new DatabaseSync(":memory:");
  private readonly applied = new Set<string>();

  /** migrations-records/ 의 파일을 이름 순으로 [upTo]번까지 적용한다(예: "0001"). 이미 적용한 파일은 건너뛴다 */
  migrate(upTo: string): this {
    for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
      if (file.slice(0, 4) > upTo) break;
      if (this.applied.has(file)) continue;
      this.db.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
      this.applied.add(file);
    }
    return this;
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  /** 확인용 조회(바인딩 없음) */
  query<T>(sql: string): T[] {
    return this.db.prepare(sql).all() as T[];
  }

  prepare(sql: string): SqliteStatement {
    return new SqliteStatement(this.db, sql);
  }

  /** D1처럼 한 트랜잭션으로 실행한다 — 하나라도 실패하면 모두 되돌린다. SELECT는 행을, 나머지는 바뀐 행 수를 돌려준다 */
  async batch(statements: SqliteStatement[]): Promise<{ results: unknown[]; meta: { changes: number } }[]> {
    this.db.exec("BEGIN");
    try {
      const out = [];
      for (const s of statements) out.push(await s.runOrAll());
      this.db.exec("COMMIT");
      return out;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  /** D1 저장소 생성자에 넘길 때 */
  asD1(): D1Database {
    return this as unknown as D1Database;
  }
}
