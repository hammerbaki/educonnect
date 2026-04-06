import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 학생 프로필 테이블
export const studentProfiles = mysqlTable("student_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  grade: mysqlEnum("grade", ["1", "2", "3"]).default("3").notNull(),
  school: varchar("school", { length: 200 }),
  interestAreas: json("interestAreas").$type<string[]>(),
  favoriteSubjects: json("favoriteSubjects").$type<string[]>(),
  weakSubjects: json("weakSubjects").$type<string[]>(),
  gpa: varchar("gpa", { length: 20 }),
  targetUniversities: json("targetUniversities").$type<string[]>(),
  targetMajors: json("targetMajors").$type<string[]>(),
  admissionType: mysqlEnum("admissionType", ["수시", "정시", "미정"]).default("미정"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = typeof studentProfiles.$inferInsert;

// AI 적성 분석 결과 테이블
export const aptitudeAnalyses = mysqlTable("aptitude_analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  surveyAnswers: json("surveyAnswers").$type<Record<string, number>>(),
  radarData: json("radarData").$type<{ category: string; score: number }[]>(),
  recommendedMajors: json("recommendedMajors").$type<{ name: string; matchRate: number; description: string }[]>(),
  analysisText: text("analysisText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AptitudeAnalysis = typeof aptitudeAnalyses.$inferSelect;
export type InsertAptitudeAnalysis = typeof aptitudeAnalyses.$inferInsert;

// 입시/진로 로드맵 목표 테이블
export const roadmapGoals = mysqlTable("roadmap_goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["학업", "비교과", "입시", "자기개발", "기타"]).default("기타"),
  status: mysqlEnum("status", ["예정", "진행중", "완료"]).default("예정").notNull(),
  priority: mysqlEnum("priority", ["높음", "보통", "낮음"]).default("보통"),
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RoadmapGoal = typeof roadmapGoals.$inferSelect;
export type InsertRoadmapGoal = typeof roadmapGoals.$inferInsert;

// D-Day 이벤트 테이블
export const ddayEvents = mysqlTable("dday_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  eventDate: timestamp("eventDate").notNull(),
  category: mysqlEnum("category", ["수능", "수시", "정시", "모의고사", "기타"]).default("기타"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DdayEvent = typeof ddayEvents.$inferSelect;
export type InsertDdayEvent = typeof ddayEvents.$inferInsert;

// AI 서류 (생기부/자소서) 테이블
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  docType: mysqlEnum("docType", ["자기소개서", "생기부분석", "학업계획서"]).default("자기소개서"),
  content: text("content"),
  aiSuggestion: text("aiSuggestion"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// AI 면접 연습 기록 테이블
export const interviewSessions = mysqlTable("interview_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  university: varchar("university", { length: 200 }),
  major: varchar("major", { length: 200 }),
  interviewType: mysqlEnum("interviewType", ["심층면접", "인성면접", "제시문면접"]).default("인성면접"),
  messages: json("messages").$type<{ role: string; content: string }[]>(),
  feedback: text("feedback"),
  score: int("score"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InterviewSession = typeof interviewSessions.$inferSelect;
export type InsertInterviewSession = typeof interviewSessions.$inferInsert;

// 커뮤니티 게시글 테이블
export const communityPosts = mysqlTable("community_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  authorName: varchar("authorName", { length: 200 }),
  category: mysqlEnum("category", ["입시정보", "학습질문", "전공탐색", "자유게시판", "합격수기"]).default("자유게시판").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  tags: json("tags").$type<string[]>(),
  viewCount: int("viewCount").default(0).notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  commentCount: int("commentCount").default(0).notNull(),
  isPinned: int("isPinned").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;

// 커뮤니티 댓글 테이블
export const communityComments = mysqlTable("community_comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  authorName: varchar("authorName", { length: 200 }),
  content: text("content").notNull(),
  parentId: int("parentId"),
  likeCount: int("likeCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertCommunityComment = typeof communityComments.$inferInsert;

// 좋아요 테이블 (게시글 + 댓글 공용)
export const communityLikes = mysqlTable("community_likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetType: mysqlEnum("targetType", ["post", "comment"]).notNull(),
  targetId: int("targetId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunityLike = typeof communityLikes.$inferSelect;
export type InsertCommunityLike = typeof communityLikes.$inferInsert;
