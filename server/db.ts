import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
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
import { eq, and, gte, lte, sql } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;
let client: ReturnType<typeof postgres> | null = null;

// Initialize PostgreSQL database
export async function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    
    // Create PostgreSQL client
    client = postgres(connectionString, {
      ssl: 'require',
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    
    _db = drizzle(client);
    
    console.log("✅ PostgreSQL database connected successfully");
  }
  
  return _db;
}

// Initialize database with default data
export async function initializeDatabase() {
  const db = await getDb();
  
  try {
    // Check if admin user exists
    const adminUser = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
    
    if (adminUser.length === 0) {
      // Create default admin user
      await db.insert(users).values({
        username: 'admin',
        password: '123', // In production, this should be hashed
        name: 'Administrador',
        role: 'admin'
      });
      
      // Create default visitor user
      await db.insert(users).values({
        username: 'visitante',
        password: '123',
        name: 'Visitante',
        role: 'viewer'
      });
      
      console.log("✅ Default users created");
    }
    
    // Check if financial data exists for today
    const today = new Date().toISOString().split('T')[0];
    const todayData = await db.select().from(financialData).where(eq(financialData.date, today)).limit(1);
    
    if (todayData.length === 0) {
      await db.insert(financialData).values({
        date: today,
        previousBalance: 0,
        totalIncome: 0,
        totalExpense: 0,
        totalFees: 0,
        currentBalance: 0
      });
      
      console.log("✅ Initial financial data created");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// ===== USER FUNCTIONS =====

export async function createUser(user: InsertUser) {
  const db = await getDb();
  const result = await db.insert(users).values(user).returning();
  return result;
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  const result = await db.select().from(users);
  return result;
}

export async function deleteUser(id: number) {
  const db = await getDb();
  await db.delete(users).where(eq(users.id, id));
}

// ===== FINANCIAL DATA FUNCTIONS =====

export async function getFinancialDataByDate(date: string) {
  const db = await getDb();
  const result = await db.select().from(financialData).where(eq(financialData.date, date)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllFinancialData() {
  const db = await getDb();
  const result = await db.select().from(financialData);
  return result;
}

export async function createFinancialData(data: InsertFinancialData) {
  const db = await getDb();
  const result = await db.insert(financialData).values(data).returning();
  return result;
}

export async function updateFinancialData(id: number, data: Partial<InsertFinancialData>) {
  const db = await getDb();
  await db.update(financialData).set(data).where(eq(financialData.id, id));
}

// ===== ACCOUNT FUNCTIONS =====

export async function getAccountsByFinancialDataId(financialDataId: number) {
  const db = await getDb();
  const result = await db.select().from(accounts).where(eq(accounts.financialDataId, financialDataId));
  return result;
}

export async function createAccount(account: InsertAccount) {
  const db = await getDb();
  const result = await db.insert(accounts).values(account).returning();
  return result;
}

export async function updateAccount(id: number, account: Partial<InsertAccount>) {
  const db = await getDb();
  await db.update(accounts).set(account).where(eq(accounts.id, id));
}

export async function deleteAccount(id: number) {
  const db = await getDb();
  await db.delete(accounts).where(eq(accounts.id, id));
}

// ===== AUDIT LOG FUNCTIONS =====

export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  const result = await db.insert(auditLogs).values(log).returning();
  return result;
}

export async function getAllAuditLogs() {
  const db = await getDb();
  const result = await db.select().from(auditLogs).orderBy(sql`${auditLogs.timestamp} DESC`);
  return result;
}

export async function clearAuditLogs() {
  const db = await getDb();
  await db.delete(auditLogs);
}
