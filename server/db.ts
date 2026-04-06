import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  studentProfiles,
  InsertStudentProfile,
  aptitudeAnalyses,
  InsertAptitudeAnalysis,
  roadmapGoals,
  InsertRoadmapGoal,
  ddayEvents,
  InsertDdayEvent,
  documents,
  InsertDocument,
  interviewSessions,
  InsertInterviewSession,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ---- Student Profile ----
export async function getStudentProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertStudentProfile(data: InsertStudentProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, data.userId)).limit(1);
  if (existing.length > 0) {
    await db.update(studentProfiles).set(data).where(eq(studentProfiles.userId, data.userId));
    return existing[0];
  } else {
    const result = await db.insert(studentProfiles).values(data);
    return { ...data, id: Number(result[0].insertId) };
  }
}

// ---- Aptitude Analysis ----
export async function getLatestAptitudeAnalysis(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aptitudeAnalyses).where(eq(aptitudeAnalyses.userId, userId)).orderBy(desc(aptitudeAnalyses.createdAt)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAptitudeAnalyses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aptitudeAnalyses).where(eq(aptitudeAnalyses.userId, userId)).orderBy(desc(aptitudeAnalyses.createdAt));
}

export async function createAptitudeAnalysis(data: InsertAptitudeAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aptitudeAnalyses).values(data);
  return { ...data, id: Number(result[0].insertId) };
}

// ---- Roadmap Goals ----
export async function getRoadmapGoals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(roadmapGoals).where(eq(roadmapGoals.userId, userId)).orderBy(desc(roadmapGoals.createdAt));
}

export async function createRoadmapGoal(data: InsertRoadmapGoal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(roadmapGoals).values(data);
  return { ...data, id: Number(result[0].insertId) };
}

export async function updateRoadmapGoal(id: number, userId: number, data: Partial<InsertRoadmapGoal>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(roadmapGoals).set(data).where(and(eq(roadmapGoals.id, id), eq(roadmapGoals.userId, userId)));
}

export async function deleteRoadmapGoal(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(roadmapGoals).where(and(eq(roadmapGoals.id, id), eq(roadmapGoals.userId, userId)));
}

// ---- D-Day Events ----
export async function getDdayEvents(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ddayEvents).where(eq(ddayEvents.userId, userId)).orderBy(ddayEvents.eventDate);
}

export async function createDdayEvent(data: InsertDdayEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ddayEvents).values(data);
  return { ...data, id: Number(result[0].insertId) };
}

export async function deleteDdayEvent(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(ddayEvents).where(and(eq(ddayEvents.id, id), eq(ddayEvents.userId, userId)));
}

// ---- Documents ----
export async function getDocuments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.createdAt));
}

export async function getDocument(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(data);
  return { ...data, id: Number(result[0].insertId) };
}

export async function updateDocument(id: number, userId: number, data: Partial<InsertDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(documents).set(data).where(and(eq(documents.id, id), eq(documents.userId, userId)));
}

export async function deleteDocument(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(documents).where(and(eq(documents.id, id), eq(documents.userId, userId)));
}

// ---- Interview Sessions ----
export async function getInterviewSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interviewSessions).where(eq(interviewSessions.userId, userId)).orderBy(desc(interviewSessions.createdAt));
}

export async function getInterviewSession(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(interviewSessions).where(and(eq(interviewSessions.id, id), eq(interviewSessions.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createInterviewSession(data: InsertInterviewSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(interviewSessions).values(data);
  return { ...data, id: Number(result[0].insertId) };
}

export async function updateInterviewSession(id: number, userId: number, data: Partial<InsertInterviewSession>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(interviewSessions).set(data).where(and(eq(interviewSessions.id, id), eq(interviewSessions.userId, userId)));
}
