import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    // Custom authentication with username/password
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByUsername(input.username.toLowerCase().trim());
        if (!user || user.password !== input.password.trim()) {
          throw new Error("Usuário ou senha incorretos");
        }
        return { success: true, user: { id: user.id, username: user.username, name: user.name, role: user.role } };
      }),
    
    register: publicProcedure
      .input(z.object({ username: z.string(), password: z.string(), name: z.string(), role: z.enum(["admin", "viewer"]).optional() }))
      .mutation(async ({ input }) => {
        await db.createUser({
          username: input.username.toLowerCase().trim(),
          password: input.password.trim(),
          name: input.name.trim(),
          role: input.role || "viewer"
        });
        return { success: true };
      }),
    
    getAllUsers: publicProcedure.query(async () => {
      const users = await db.getAllUsers();
      return users.map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role }));
    }),
    
    deleteUser: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUser(input.id);
        return { success: true };
      }),
    
    createUser: publicProcedure
      .input(z.object({ 
        username: z.string(), 
        password: z.string(), 
        name: z.string(), 
        role: z.enum(["admin", "viewer", "operator"]).optional(),
        allowedAccounts: z.array(z.string()).optional()
      }))
      .mutation(async ({ input }) => {
        await db.createUser({
          username: input.username.toLowerCase().trim(),
          password: input.password.trim(),
          name: input.name.trim(),
          role: input.role || "viewer"
        });
        return { success: true };
      }),
  }),

  financial: router({
    // Get all financial data with accounts
    getAll: publicProcedure.query(async () => {
      const allData = await db.getAllFinancialData();
      const result = await Promise.all(
        allData.map(async (data) => {
          const accs = await db.getAccountsByFinancialDataId(data.id);
          return {
            date: data.date,
            accounts: accs.map(acc => ({
              name: acc.name,
              saldo_anterior: parseFloat(acc.saldoAnterior),
              entradas: parseFloat(acc.entradas),
              saidas: parseFloat(acc.saidas),
              taxas: parseFloat(acc.taxas),
              saldo_atual: parseFloat(acc.saldoAtual),
              nota: acc.nota || "",
              entradas_detalhadas: acc.entradasDetalhadas ? JSON.parse(acc.entradasDetalhadas) : [],
              saidas_detalhadas: acc.saidasDetalhadas ? JSON.parse(acc.saidasDetalhadas) : []
            }))
          };
        })
      );
      return result;
    }),
    
    // Get financial data by date
    getByDate: publicProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ input }) => {
        const data = await db.getFinancialDataByDate(input.date);
        if (!data) return null;
        
        const accs = await db.getAccountsByFinancialDataId(data.id);
        return {
          date: data.date,
          accounts: accs.map(acc => ({
            name: acc.name,
            saldo_anterior: parseFloat(acc.saldoAnterior),
            entradas: parseFloat(acc.entradas),
            saidas: parseFloat(acc.saidas),
            taxas: parseFloat(acc.taxas),
            saldo_atual: parseFloat(acc.saldoAtual),
            nota: acc.nota || "",
            entradas_detalhadas: acc.entradasDetalhadas ? JSON.parse(acc.entradasDetalhadas) : [],
            saidas_detalhadas: acc.saidasDetalhadas ? JSON.parse(acc.saidasDetalhadas) : []
          }))
        };
      }),
    
    // Save or update financial data for a date
    save: publicProcedure
      .input(z.object({
        date: z.string(),
        accounts: z.array(z.object({
          name: z.string(),
          saldo_anterior: z.number(),
          entradas: z.number(),
          saidas: z.number(),
          taxas: z.number(),
          saldo_atual: z.number(),
          nota: z.string().optional(),
          entradas_base: z.number().optional(),
          saidas_base: z.number().optional(),
          entradas_detalhadas: z.array(z.object({
            id: z.string(),
            description: z.string(),
            value: z.number()
          })).optional(),
          saidas_detalhadas: z.array(z.object({
            id: z.string(),
            description: z.string(),
            value: z.number()
          })).optional()
        }))
      }))
      .mutation(async ({ input }) => {
        // Check if date exists
        let finData = await db.getFinancialDataByDate(input.date);
        
        if (!finData) {
          // Create new financial data entry
          const result = await db.createFinancialData({ date: input.date });
          const insertId = Number(result[0].insertId);
          finData = { id: insertId, date: input.date, createdAt: new Date(), updatedAt: new Date() };
        }
        
        // Delete existing accounts for this date
        const existingAccounts = await db.getAccountsByFinancialDataId(finData.id);
        await Promise.all(existingAccounts.map(acc => db.deleteAccount(acc.id)));
        
        // Create new accounts
        await Promise.all(
          input.accounts.map(acc => {
            console.log('[DEBUG] Saving account:', acc.name, {
              entradas_detalhadas: acc.entradas_detalhadas,
              saidas_detalhadas: acc.saidas_detalhadas
            });
            return db.createAccount({
              financialDataId: finData!.id,
              name: acc.name,
              saldoAnterior: acc.saldo_anterior.toString(),
              entradas: acc.entradas.toString(),
              saidas: acc.saidas.toString(),
              taxas: acc.taxas.toString(),
              saldoAtual: acc.saldo_atual.toString(),
              nota: acc.nota || "",
              entradasDetalhadas: acc.entradas_detalhadas ? JSON.stringify(acc.entradas_detalhadas) : null,
              saidasDetalhadas: acc.saidas_detalhadas ? JSON.stringify(acc.saidas_detalhadas) : null
            });
          })
        );
        
        return { success: true };
      }),
  }),

  audit: router({
    getAll: publicProcedure.query(async () => {
      const logs = await db.getAllAuditLogs();
      return logs;
    }),
    
    add: publicProcedure
      .input(z.object({
        action: z.string(),
        entity: z.string(),
        description: z.string(),
        user: z.string()
      }))
      .mutation(async ({ input }) => {
        await db.createAuditLog({
          timestamp: Date.now(),
          action: input.action,
          entity: input.entity,
          description: input.description,
          user: input.user
        });
        return { success: true };
      }),
    
    clear: publicProcedure.mutation(async () => {
      await db.clearAuditLogs();
      return { success: true };
    }),
  }),
  
  // Upload logo to S3
  brand: router({
    uploadLogo: publicProcedure
      .input(z.object({ 
        base64Data: z.string(),
        fileName: z.string(),
        contentType: z.string()
      }))
      .mutation(async ({ input }) => {
        // Convert base64 to buffer
        const base64Data = input.base64Data.split(',')[1]; // Remove data:image/...;base64, prefix
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique file name
        const timestamp = Date.now();
        const extension = input.fileName.split('.').pop();
        const key = `logos/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
        
        // Upload to S3
        const result = await storagePut(key, buffer, input.contentType);
        
         return { url: result.url, key: result.key };
      }),
    
    saveBrand: publicProcedure
      .input(z.object({
        appName: z.string(),
        logoUrl: z.string(),
        primaryColor: z.string()
      }))
      .mutation(async ({ input }) => {
        // Save brand settings to database or environment variables
        // For now, we'll just return success since the frontend handles it via context
        return { success: true, brand: input };
      })
  }),
});

export type AppRouter = typeof appRouter;
