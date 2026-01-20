import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  financialData, 
  accounts, 
  auditLogs,
  InsertFinancialData,
  InsertAccount,
  InsertAuditLog
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

// In-memory storage for when database is not available
const inMemoryUsers: any[] = [
  { id: 1, username: 'admin', password: '123', name: 'Administrador', role: 'admin' },
  { id: 2, username: 'visitante', password: '123', name: 'Visitante', role: 'viewer' }
];
const inMemoryFinancialData: any[] = [];
const inMemoryAccounts: any[] = [];
const inMemoryAuditLogs: any[] = [];
let nextUserId = 3;
let nextFinancialDataId = 1;
let nextAccountId = 1;
let nextAuditLogId = 1;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== USER FUNCTIONS =====

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) {
    // Use in-memory storage
    const newUser = { ...user, id: nextUserId++ };
    inMemoryUsers.push(newUser);
    return [{ insertId: newUser.id }];
  }
  
  const result = await db.insert(users).values(user);
  return result;
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) {
    // Use in-memory storage
    return inMemoryUsers.find(u => u.username === username);
  }
  
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    // Use in-memory storage
    return inMemoryUsers;
  }
  
  const result = await db.select().from(users);
  return result;
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) {
    // Use in-memory storage
    const index = inMemoryUsers.findIndex(u => u.id === id);
    if (index !== -1) {
      inMemoryUsers.splice(index, 1);
    }
    return;
  }
  
  await db.delete(users).where(eq(users.id, id));
}

// ===== FINANCIAL DATA FUNCTIONS =====

export async function getFinancialDataByDate(date: string) {
  const db = await getDb();
  if (!db) {
    // Use in-memory storage
    return inMemoryFinancialData.find(d => d.date === date);
  }
  
  const result = await db.select().from(financialData).where(eq(financialData.date, date)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllFinancialData() {
  const db = await getDb();
  if (!db) {
    // Use in-memory storage
    return inMemoryFinancialData;
  }
  
  const result = await db.select().from(financialData);
  return result;
}

export async function createFinancialData(data: InsertFinancialData) {
  const db = await getDb();
  if (!db) {
    // Use in-memory storage
    const newData = { 
      ...data, 
      id: nextFinancialDataId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryFinancialData.push(newData);
    return [{ insertId: newData.id }];
  }
  
  const result = await db.insert(financialData).values(data);
  return result;
}

export async function updateFinancialData(id: number, data: Partial<InsertFinancialData>) {
  const db = await getDb();
  if (!db) {
    // Use in-memory storage
    const index = inMemoryFinancialData.findIndex(d => d.id === id);
    if (index !== -1) {
      inMemoryFinancialData[index] = { ...inMemoryFinancialData[index], ...data, updatedAt: new Date() };
    }
    return;
  }
  
  await db.update(financialData).set(data).where(eq(financialData.id, id));
}

// ===== ACCOUNT FUNCTIONS =====

export async function getAccountsByFinancialDataId(financialDataId: number) {
  const db = await getDb();
  if (!db) {
    // Use in-memory storage
    return inMemoryAccounts.filter(a => a.financialDataId === financialDataId);
  }
  
  const result = await db.select().from(accounts).where(eq(accounts.financialDataId, financialDataId));
  return result;
}

export async function createAccount(account: InsertAccount) {
  const db = await getDb();
  if (!db) {
    // Use in-memory storage
    const newAccount = { 
      ...account, 
      id: nextAccountId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryAccounts.push(newAccount);
    return [{ insertId: newAccount.id }];
  }
  
  const result = await db.insert(accounts).values(account);
  return result;
}

export async function updateAccount(id: number, account: Partial<InsertAccount>) {
  const db = await getDb();
  if (!db) {
    // Use in-memory storage
    const index = inMemoryAccounts.findIndex(a => a.id === id);
    if (index !== -1) {
      inMemoryAccounts[index] = { ...inMemoryAccounts[index], ...account, updatedAt: new Date() };
    }
    return;
  }
  
  await db.update(accounts).set(account).where(eq(accounts.id, id));
}

export async function deleteAccount(id: number) {
  const db = await getDb();
  if (!db) {
    // Use in-memory storage
    const index = inMemoryAccounts.findIndex(a => a.id === id);
    if (index !== -1) {
      inMemoryAccounts.splice(index, 1);
    }
    return;
  }
  
  await db.delete(accounts).where(eq(accounts.id, id));
}

// ===== AUDIT LOG FUNCTIONS =====

export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) {
    // Use in-memory storage
    const newLog = { ...log, id: nextAuditLogId++ };
    inMemoryAuditLogs.push(newLog);
    return [{ insertId: newLog.id }];
  }
  
  const result = await db.insert(auditLogs).values(log);
  return result;
}

export async function getAllAuditLogs() {
  const db = await getDb();
  if (!db) {
    // Use in-memory storage
    return inMemoryAuditLogs;
  }
  
  const result = await db.select().from(auditLogs);
  return result;
}

export async function clearAuditLogs() {
  const db = await getDb();
  if (!db) {
    // Use in-memory storage
    inMemoryAuditLogs.length = 0;
    return;
  }
  
  await db.delete(auditLogs);
}
