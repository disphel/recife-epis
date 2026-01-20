import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, bigint } from "drizzle-orm/mysql-core";

/**
 * Users table for authentication
 * Uses traditional username/password instead of OAuth
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: text("name").notNull(),
  role: mysqlEnum("role", ["admin", "viewer", "operator"]).default("viewer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Financial data entries (daily snapshots)
 */
export const financialData = mysqlTable("financial_data", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // Format: dd/MM/yyyy
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinancialData = typeof financialData.$inferSelect;
export type InsertFinancialData = typeof financialData.$inferInsert;

/**
 * Account entries for each financial data day
 */
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  financialDataId: int("financial_data_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  saldoAnterior: decimal("saldo_anterior", { precision: 15, scale: 2 }).notNull().default("0"),
  entradas: decimal("entradas", { precision: 15, scale: 2 }).notNull().default("0"),
  saidas: decimal("saidas", { precision: 15, scale: 2 }).notNull().default("0"),
  taxas: decimal("taxas", { precision: 15, scale: 2 }).notNull().default("0"),
  saldoAtual: decimal("saldo_atual", { precision: 15, scale: 2 }).notNull().default("0"),
  nota: text("nota"),
  entradasDetalhadas: text("entradas_detalhadas"), // JSON array of transactions
  saidasDetalhadas: text("saidas_detalhadas"), // JSON array of transactions
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * Audit log entries
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  description: text("description").notNull(),
  user: varchar("user", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;