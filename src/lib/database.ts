import Database from 'better-sqlite3';
import { join } from 'path';
import { AppState } from '../types';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = join(process.cwd(), 'data', 'aapay.db');
    db = new Database(dbPath);
    
    // 启用 WAL 模式提高并发性能
    db.pragma('journal_mode = WAL');
    
    // 初始化数据库结构
    initializeDatabase(db);
  }
  
  return db;
}

function initializeDatabase(database: Database.Database) {
  // 创建 sessions 表
  const createSessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      uuid TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  const createUpdatedAtIndex = `
    CREATE INDEX IF NOT EXISTS idx_sessions_updated_at 
    ON sessions(updated_at)
  `;
  
  database.exec(createSessionsTable);
  database.exec(createUpdatedAtIndex);
}

export interface SessionData {
  uuid: string;
  data: Omit<AppState, 'isLoading' | 'error' | 'isAiProcessing'>; // 排除临时UI状态
  createdAt: Date;
  updatedAt: Date;
}

export class SessionService {
  private db: Database.Database;
  private getSessionStmt: Database.Statement;
  private upsertSessionStmt: Database.Statement;
  private deleteSessionStmt: Database.Statement;
  
  constructor() {
    this.db = getDatabase();
    
    // 预编译语句提高性能
    this.getSessionStmt = this.db.prepare(`
      SELECT uuid, data, created_at, updated_at 
      FROM sessions 
      WHERE uuid = ?
    `);
    
    this.upsertSessionStmt = this.db.prepare(`
      INSERT INTO sessions (uuid, data, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(uuid) DO UPDATE SET 
        data = excluded.data,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    this.deleteSessionStmt = this.db.prepare(`
      DELETE FROM sessions WHERE uuid = ?
    `);
  }
  
  async getSession(uuid: string): Promise<SessionData | null> {
    try {
      const row = this.getSessionStmt.get(uuid) as any;
      
      if (!row) {
        return null;
      }
      
      return {
        uuid: row.uuid,
        data: JSON.parse(row.data),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }
  
  async saveSession(uuid: string, data: Omit<AppState, 'isLoading' | 'error' | 'isAiProcessing'>): Promise<boolean> {
    try {
      this.upsertSessionStmt.run(uuid, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save session:', error);
      return false;
    }
  }
  
  async deleteSession(uuid: string): Promise<boolean> {
    try {
      const result = this.deleteSessionStmt.run(uuid);
      return result.changes > 0;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }
  
  async cleanupOldSessions(daysOld: number = 30): Promise<number> {
    try {
      const cleanupStmt = this.db.prepare(`
        DELETE FROM sessions 
        WHERE updated_at < datetime('now', '-${daysOld} days')
      `);
      
      const result = cleanupStmt.run();
      return result.changes;
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
      return 0;
    }
  }
}

// 单例实例
export const sessionService = new SessionService();

// 优雅关闭数据库连接
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// 处理进程退出
process.on('exit', closeDatabase);
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});