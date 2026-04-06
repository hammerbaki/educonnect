import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
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
  communityPosts,
  InsertCommunityPost,
  communityComments,
  InsertCommunityComment,
  communityLikes,
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

// ---- Community Posts ----
export async function getCommunityPosts(options: {
  category?: string;
  search?: string;
  tag?: string;
  sort?: "latest" | "popular";
  page?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return { posts: [], total: 0 };
  const { category, search, tag, sort = "latest", page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (category && category !== "all") {
    conditions.push(eq(communityPosts.category, category as any));
  }
  if (search) {
    conditions.push(sql`(${communityPosts.title} LIKE ${`%${search}%`} OR ${communityPosts.content} LIKE ${`%${search}%`})`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const orderClause = sort === "popular" ? desc(communityPosts.likeCount) : desc(communityPosts.createdAt);

  const posts = await db
    .select()
    .from(communityPosts)
    .where(whereClause)
    .orderBy(desc(communityPosts.isPinned), orderClause)
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(communityPosts)
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;

  return { posts, total };
}

export async function getCommunityPost(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  // Increment view count
  await db.update(communityPosts).set({ viewCount: sql`${communityPosts.viewCount} + 1` }).where(eq(communityPosts.id, id));
  const result = await db.select().from(communityPosts).where(eq(communityPosts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCommunityPost(data: InsertCommunityPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(communityPosts).values(data);
  return { ...data, id: Number(result[0].insertId), viewCount: 0, likeCount: 0, commentCount: 0, isPinned: 0, createdAt: new Date(), updatedAt: new Date() };
}

export async function updateCommunityPost(id: number, userId: number, data: Partial<InsertCommunityPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(communityPosts).set(data).where(and(eq(communityPosts.id, id), eq(communityPosts.userId, userId)));
}

export async function deleteCommunityPost(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete related comments and likes
  await db.delete(communityComments).where(eq(communityComments.postId, id));
  await db.delete(communityLikes).where(and(eq(communityLikes.targetType, "post"), eq(communityLikes.targetId, id)));
  await db.delete(communityPosts).where(and(eq(communityPosts.id, id), eq(communityPosts.userId, userId)));
}

// ---- Community Comments ----
export async function getCommentsByPostId(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityComments).where(eq(communityComments.postId, postId)).orderBy(communityComments.createdAt);
}

export async function createCommunityComment(data: InsertCommunityComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(communityComments).values(data);
  // Update comment count
  await db.update(communityPosts).set({ commentCount: sql`${communityPosts.commentCount} + 1` }).where(eq(communityPosts.id, data.postId));
  return { ...data, id: Number(result[0].insertId), likeCount: 0, createdAt: new Date(), updatedAt: new Date() };
}

export async function deleteCommunityComment(id: number, userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(communityComments).where(and(eq(communityComments.id, id), eq(communityComments.userId, userId)));
  // Update comment count
  await db.update(communityPosts).set({ commentCount: sql`GREATEST(${communityPosts.commentCount} - 1, 0)` }).where(eq(communityPosts.id, postId));
}

// ---- Community Likes ----
export async function toggleLike(userId: number, targetType: "post" | "comment", targetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(communityLikes)
    .where(and(eq(communityLikes.userId, userId), eq(communityLikes.targetType, targetType), eq(communityLikes.targetId, targetId)))
    .limit(1);

  if (existing.length > 0) {
    // Unlike
    await db.delete(communityLikes).where(eq(communityLikes.id, existing[0].id));
    if (targetType === "post") {
      await db.update(communityPosts).set({ likeCount: sql`GREATEST(${communityPosts.likeCount} - 1, 0)` }).where(eq(communityPosts.id, targetId));
    } else {
      await db.update(communityComments).set({ likeCount: sql`GREATEST(${communityComments.likeCount} - 1, 0)` }).where(eq(communityComments.id, targetId));
    }
    return { liked: false };
  } else {
    // Like
    await db.insert(communityLikes).values({ userId, targetType, targetId });
    if (targetType === "post") {
      await db.update(communityPosts).set({ likeCount: sql`${communityPosts.likeCount} + 1` }).where(eq(communityPosts.id, targetId));
    } else {
      await db.update(communityComments).set({ likeCount: sql`${communityComments.likeCount} + 1` }).where(eq(communityComments.id, targetId));
    }
    return { liked: true };
  }
}

export async function getUserLikes(userId: number, targetType: "post" | "comment", targetIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (targetIds.length === 0) return [];
  const result = await db.select().from(communityLikes)
    .where(and(
      eq(communityLikes.userId, userId),
      eq(communityLikes.targetType, targetType),
      sql`${communityLikes.targetId} IN (${sql.join(targetIds.map(id => sql`${id}`), sql`, `)})`
    ));
  return result.map(r => r.targetId);
}

export async function getPopularPosts(limit: number = 5) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(communityPosts).orderBy(desc(communityPosts.likeCount)).limit(limit);
}
