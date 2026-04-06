import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";

// Helper: safely extract string content from LLM response
function extractLLMContent(response: any): string {
  const content = response?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

// Helper: safe JSON parse with fallback
function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

// Aptitude analysis response schema for validation
const aptitudeResultSchema = z.object({
  radarData: z.array(z.object({ category: z.string(), score: z.number() })),
  recommendedMajors: z.array(z.object({ name: z.string(), matchRate: z.number(), description: z.string() })),
  analysisText: z.string(),
});

const defaultAptitudeResult = {
  radarData: [
    { category: "인문학적 사고", score: 50 },
    { category: "과학적 탐구", score: 50 },
    { category: "수리적 분석", score: 50 },
    { category: "예술적 감성", score: 50 },
    { category: "사회적 소통", score: 50 },
    { category: "기술적 응용", score: 50 },
  ],
  recommendedMajors: [
    { name: "분석 실패", matchRate: 0, description: "AI 분석에 실패했습니다. 다시 시도해 주세요." },
  ],
  analysisText: "AI 분석 결과를 생성하지 못했습니다. 다시 시도해 주세요.",
};

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Student Profile
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await db.getStudentProfile(ctx.user.id);
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "프로필 조회에 실패했습니다." });
      }
    }),
    upsert: protectedProcedure
      .input(
        z.object({
          grade: z.enum(["1", "2", "3"]).optional(),
          school: z.string().optional(),
          interestAreas: z.array(z.string()).optional(),
          favoriteSubjects: z.array(z.string()).optional(),
          weakSubjects: z.array(z.string()).optional(),
          gpa: z.string().optional(),
          targetUniversities: z.array(z.string()).optional(),
          targetMajors: z.array(z.string()).optional(),
          admissionType: z.enum(["수시", "정시", "미정"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await db.upsertStudentProfile({ ...input, userId: ctx.user.id });
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "프로필 저장에 실패했습니다." });
        }
      }),
  }),

  // Aptitude Analysis
  aptitude: router({
    latest: protectedProcedure.query(async ({ ctx }) => {
      const result = await db.getLatestAptitudeAnalysis(ctx.user.id);
      return result ?? null;
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getAptitudeAnalyses(ctx.user.id);
    }),
    analyze: protectedProcedure
      .input(z.object({ answers: z.record(z.string(), z.number()) }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getStudentProfile(ctx.user.id);
        const profileInfo = profile
          ? `학년: ${profile.grade}, 관심분야: ${((profile.interestAreas as string[]) || []).join(", ")}, 좋아하는 과목: ${((profile.favoriteSubjects as string[]) || []).join(", ")}, 약한 과목: ${((profile.weakSubjects as string[]) || []).join(", ")}`
          : "프로필 정보 없음";

        const answersText = Object.entries(input.answers)
          .map(([q, a]) => `${q}: ${a}/5`)
          .join("\n");

        let parsed = defaultAptitudeResult;
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `당신은 한국 고등학생의 대학 전공 적성을 분석하는 전문 진로 상담사입니다. 학생의 설문 응답과 프로필을 바탕으로 전공 적성을 분석해주세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "radarData": [
    {"category": "인문학적 사고", "score": 0-100},
    {"category": "과학적 탐구", "score": 0-100},
    {"category": "수리적 분석", "score": 0-100},
    {"category": "예술적 감성", "score": 0-100},
    {"category": "사회적 소통", "score": 0-100},
    {"category": "기술적 응용", "score": 0-100}
  ],
  "recommendedMajors": [
    {"name": "전공명", "matchRate": 0-100, "description": "추천 이유 설명 (2-3문장)"},
    {"name": "전공명", "matchRate": 0-100, "description": "추천 이유 설명 (2-3문장)"},
    {"name": "전공명", "matchRate": 0-100, "description": "추천 이유 설명 (2-3문장)"}
  ],
  "analysisText": "종합 분석 결과 (3-4문장으로 학생의 강점과 적성을 설명)"
}`,
              },
              {
                role: "user",
                content: `학생 프로필: ${profileInfo}\n\n설문 응답:\n${answersText}`,
              },
            ],
            response_format: { type: "json_object" },
          });

          const content = extractLLMContent(response);
          const raw = safeJsonParse(content, null);
          if (raw) {
            const validated = aptitudeResultSchema.safeParse(raw);
            if (validated.success) {
              parsed = validated.data;
            }
          }
        } catch (error) {
          console.error("[Aptitude] LLM call failed:", error);
          // Use default fallback result
        }

        try {
          const analysis = await db.createAptitudeAnalysis({
            userId: ctx.user.id,
            surveyAnswers: input.answers,
            radarData: parsed.radarData,
            recommendedMajors: parsed.recommendedMajors,
            analysisText: parsed.analysisText,
          });
          return analysis;
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "분석 결과 저장에 실패했습니다." });
        }
      }),
  }),

  // Roadmap Goals
  roadmap: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getRoadmapGoals(ctx.user.id);
    }),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          category: z.enum(["학업", "비교과", "입시", "자기개발", "기타"]).optional(),
          priority: z.enum(["높음", "보통", "낮음"]).optional(),
          dueDate: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await db.createRoadmapGoal({
            ...input,
            userId: ctx.user.id,
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          });
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "목표 추가에 실패했습니다." });
        }
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          category: z.enum(["학업", "비교과", "입시", "자기개발", "기타"]).optional(),
          status: z.enum(["예정", "진행중", "완료"]).optional(),
          priority: z.enum(["높음", "보통", "낮음"]).optional(),
          dueDate: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        try {
          await db.updateRoadmapGoal(id, ctx.user.id, {
            ...data,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          });
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "목표 수정에 실패했습니다." });
        }
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await db.deleteRoadmapGoal(input.id, ctx.user.id);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "목표 삭제에 실패했습니다." });
        }
      }),
  }),

  // D-Day Events
  dday: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getDdayEvents(ctx.user.id);
    }),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          eventDate: z.string(),
          category: z.enum(["수능", "수시", "정시", "모의고사", "기타"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await db.createDdayEvent({
            ...input,
            userId: ctx.user.id,
            eventDate: new Date(input.eventDate),
          });
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "D-Day 추가에 실패했습니다." });
        }
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await db.deleteDdayEvent(input.id, ctx.user.id);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "D-Day 삭제에 실패했습니다." });
        }
      }),
  }),

  // Documents
  document: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getDocuments(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getDocument(input.id, ctx.user.id);
      }),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          docType: z.enum(["자기소개서", "생기부분석", "학업계획서"]).optional(),
          content: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await db.createDocument({ ...input, userId: ctx.user.id });
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "서류 생성에 실패했습니다." });
        }
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          content: z.string().optional(),
          aiSuggestion: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        try {
          await db.updateDocument(id, ctx.user.id, data);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "서류 저장에 실패했습니다." });
        }
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await db.deleteDocument(input.id, ctx.user.id);
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "서류 삭제에 실패했습니다." });
        }
      }),
    aiGuide: protectedProcedure
      .input(
        z.object({
          docType: z.enum(["자기소개서", "생기부분석", "학업계획서"]),
          content: z.string(),
          university: z.string().optional(),
          major: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getStudentProfile(ctx.user.id);
        const profileInfo = profile
          ? `학년: ${profile.grade}, 학교: ${profile.school || "미입력"}, 관심분야: ${((profile.interestAreas as string[]) || []).join(", ")}`
          : "프로필 정보 없음";

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `당신은 한국 대입 전형에 정통한 입시 컨설턴트입니다. 학생의 ${input.docType} 작성을 도와주세요.
${input.university ? `지원 대학: ${input.university}` : ""}
${input.major ? `지원 학과: ${input.major}` : ""}

구체적이고 실용적인 피드백과 개선 제안을 한국어로 제공해주세요. 마크다운 형식으로 작성하되, 다음 구조를 따르세요:
1. 전체 평가 (강점과 약점)
2. 구체적 개선 제안 (3-5가지)
3. 수정 예시 문장`,
              },
              {
                role: "user",
                content: `학생 프로필: ${profileInfo}\n\n현재 작성 내용:\n${input.content}`,
              },
            ],
          });
          const content = extractLLMContent(response);
          return content || "분석 결과를 생성하지 못했습니다. 다시 시도해 주세요.";
        } catch (error) {
          console.error("[Document] AI guide failed:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI 첨삭 가이드 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." });
        }
      }),
  }),

  // Explore - Semantic Search
  explore: router({
    semanticSearch: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .mutation(async ({ input }) => {
        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `당신은 한국 대학 학과 및 직업 정보 전문가입니다.
사용자의 자연어 질문을 분석하여 관련 학과와 직업을 추천해주세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "majors": [
    { "name": "학과명", "category": "계열(인문/사회/자연/공학/예체능/의약)", "matchScore": 85, "reason": "추천 이유", "jobs": ["관련직업1", "관련직업2"], "subjects": ["관련과목1", "관련과목2"], "demand": "매우 높음/높음/보통", "desc": "학과 설명" }
  ],
  "jobs": [
    { "name": "직업명", "field": "분야", "matchScore": 80, "reason": "추천 이유", "relatedMajors": ["관련학과1"], "salary": "연봉 범위", "growth": "매우 높음/높음/보통/안정", "desc": "직업 설명" }
  ],
  "summary": "검색 결과 요약 (2-3문장)"
}

최대 5개 학과, 5개 직업까지 추천하세요. matchScore는 질문과의 관련도(0-100)입니다.`,
              },
              { role: "user", content: input.query },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "explore_search",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    majors: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          category: { type: "string" },
                          matchScore: { type: "number" },
                          reason: { type: "string" },
                          jobs: { type: "array", items: { type: "string" } },
                          subjects: { type: "array", items: { type: "string" } },
                          demand: { type: "string" },
                          desc: { type: "string" },
                        },
                        required: ["name", "category", "matchScore", "reason", "jobs", "subjects", "demand", "desc"],
                        additionalProperties: false,
                      },
                    },
                    jobs: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          field: { type: "string" },
                          matchScore: { type: "number" },
                          reason: { type: "string" },
                          relatedMajors: { type: "array", items: { type: "string" } },
                          salary: { type: "string" },
                          growth: { type: "string" },
                          desc: { type: "string" },
                        },
                        required: ["name", "field", "matchScore", "reason", "relatedMajors", "salary", "growth", "desc"],
                        additionalProperties: false,
                      },
                    },
                    summary: { type: "string" },
                  },
                  required: ["majors", "jobs", "summary"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = extractLLMContent(response);
          const result = safeJsonParse(content, { majors: [], jobs: [], summary: "검색 결과를 분석하지 못했습니다." });
          return result;
        } catch (error) {
          console.error("[Explore] Semantic search failed:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI 검색에 실패했습니다. 잠시 후 다시 시도해 주세요." });
        }
      }),
    personalizedRecommend: publicProcedure
      .input(z.object({
        // 성향 정보
        interests: z.array(z.string()).min(1).describe("관심 분야 목록"),
        personality: z.object({
          introvertExtrovert: z.number().min(1).max(5).describe("1=내향적, 5=외향적"),
          thinkingFeeling: z.number().min(1).max(5).describe("1=논리적, 5=감성적"),
          planningFlexible: z.number().min(1).max(5).describe("1=계획적, 5=유연한"),
          individualTeam: z.number().min(1).max(5).describe("1=개인, 5=팀워크"),
          creativeAnalytical: z.number().min(1).max(5).describe("1=분석적, 5=창의적"),
        }),
        // 과목별 성적 (등급 1~9)
        grades: z.object({
          korean: z.number().min(1).max(9).optional(),
          math: z.number().min(1).max(9).optional(),
          english: z.number().min(1).max(9).optional(),
          science: z.number().min(1).max(9).optional(),
          social: z.number().min(1).max(9).optional(),
          art: z.number().min(1).max(9).optional(),
        }),
        // 추가 정보
        preferredType: z.enum(["문과", "이과", "예체능", "상관없음"]).optional(),
        priorityFactor: z.enum(["적성", "취업", "연봉", "안정성", "성장성"]).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const gradeText = Object.entries(input.grades)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => {
              const nameMap: Record<string, string> = { korean: "국어", math: "수학", english: "영어", science: "과학(탐구)", social: "사회(탐구)", art: "예체능" };
              return `${nameMap[k] || k}: ${v}등급`;
            }).join(", ");

          const personalityText = [
            `내향-외향: ${input.personality.introvertExtrovert}/5`,
            `논리-감성: ${input.personality.thinkingFeeling}/5`,
            `계획-유연: ${input.personality.planningFlexible}/5`,
            `개인-팀워크: ${input.personality.individualTeam}/5`,
            `분석-창의: ${input.personality.creativeAnalytical}/5`,
          ].join(", ");

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `당신은 한국 고등학생 진로 상담 전문가입니다.
학생의 성향, 과목별 성적, 관심 분야를 종합적으로 분석하여 최적의 학과와 직업을 추천해주세요.

분석 시 고려할 사항:
1. 성적이 우수한 과목과 관련된 학과를 우선 고려
2. 성향(내향/외향, 논리/감성 등)에 맞는 직업 환경 고려
3. 관심 분야와 실제 학과/직업의 연관성 분석
4. 현실적인 입시 가능성 (성적 기반) 반영
5. 학생의 우선순위 (적성/취업/연봉/안정성/성장성) 반영

반드시 아래 JSON 형식으로만 응답하세요.`,
              },
              {
                role: "user",
                content: `학생 프로필:
- 관심 분야: ${input.interests.join(", ")}
- 성향: ${personalityText}
- 과목별 성적: ${gradeText || "미입력"}
- 계열 선호: ${input.preferredType || "상관없음"}
- 우선순위: ${input.priorityFactor || "적성"}

이 학생에게 최적의 학과 5개와 직업 5개를 추천해주세요.`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "personalized_recommend",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    analysis: {
                      type: "object",
                      properties: {
                        strengths: { type: "array", items: { type: "string" } },
                        personalityType: { type: "string" },
                        recommendedFields: { type: "array", items: { type: "string" } },
                        overallComment: { type: "string" },
                      },
                      required: ["strengths", "personalityType", "recommendedFields", "overallComment"],
                      additionalProperties: false,
                    },
                    majors: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          category: { type: "string" },
                          matchScore: { type: "number" },
                          reason: { type: "string" },
                          admissionTip: { type: "string" },
                          relatedSubjects: { type: "array", items: { type: "string" } },
                          careerPaths: { type: "array", items: { type: "string" } },
                          demand: { type: "string" },
                        },
                        required: ["name", "category", "matchScore", "reason", "admissionTip", "relatedSubjects", "careerPaths", "demand"],
                        additionalProperties: false,
                      },
                    },
                    jobs: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          field: { type: "string" },
                          matchScore: { type: "number" },
                          reason: { type: "string" },
                          requiredSkills: { type: "array", items: { type: "string" } },
                          salary: { type: "string" },
                          growth: { type: "string" },
                          workEnvironment: { type: "string" },
                        },
                        required: ["name", "field", "matchScore", "reason", "requiredSkills", "salary", "growth", "workEnvironment"],
                        additionalProperties: false,
                      },
                    },
                    studyPlan: {
                      type: "object",
                      properties: {
                        focusSubjects: { type: "array", items: { type: "string" } },
                        activities: { type: "array", items: { type: "string" } },
                        timeline: { type: "string" },
                      },
                      required: ["focusSubjects", "activities", "timeline"],
                      additionalProperties: false,
                    },
                  },
                  required: ["analysis", "majors", "jobs", "studyPlan"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = extractLLMContent(response);
          const fallback = {
            analysis: { strengths: [], personalityType: "분석 불가", recommendedFields: [], overallComment: "분석 결과를 생성하지 못했습니다." },
            majors: [],
            jobs: [],
            studyPlan: { focusSubjects: [], activities: [], timeline: "" },
          };
          return safeJsonParse(content, fallback);
        } catch (error) {
          console.error("[Explore] Personalized recommend failed:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "맞춤형 추천 분석에 실패했습니다. 잠시 후 다시 시도해 주세요." });
        }
      }),
  }),

  // Community
  community: router({
    posts: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        tag: z.string().optional(),
        sort: z.enum(["latest", "popular"]).optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getCommunityPosts(input ?? {});
      }),
    post: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const post = await db.getCommunityPost(input.id);
        if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "게시글을 찾을 수 없습니다." });
        return post;
      }),
    popular: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getPopularPosts(input?.limit ?? 5);
      }),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1, "제목을 입력해주세요"),
        content: z.string().min(1, "내용을 입력해주세요"),
        category: z.enum(["입시정보", "학습질문", "전공탐색", "자유게시판", "합격수기"]).optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createCommunityPost({
          ...input,
          userId: ctx.user.id,
          authorName: ctx.user.name || "익명",
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        category: z.enum(["입시정보", "학습질문", "전공탐색", "자유게시판", "합격수기"]).optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateCommunityPost(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCommunityPost(input.id, ctx.user.id);
      }),
    // Comments
    comments: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        return db.getCommentsByPostId(input.postId);
      }),
    addComment: protectedProcedure
      .input(z.object({
        postId: z.number(),
        content: z.string().min(1, "댓글 내용을 입력해주세요"),
        parentId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createCommunityComment({
          ...input,
          userId: ctx.user.id,
          authorName: ctx.user.name || "익명",
          parentId: input.parentId ?? null,
        });
      }),
    deleteComment: protectedProcedure
      .input(z.object({ id: z.number(), postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCommunityComment(input.id, ctx.user.id, input.postId);
      }),
    // Likes
    toggleLike: protectedProcedure
      .input(z.object({
        targetType: z.enum(["post", "comment"]),
        targetId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.toggleLike(ctx.user.id, input.targetType, input.targetId);
      }),
    userLikes: protectedProcedure
      .input(z.object({
        targetType: z.enum(["post", "comment"]),
        targetIds: z.array(z.number()),
      }))
      .query(async ({ ctx, input }) => {
        return db.getUserLikes(ctx.user.id, input.targetType, input.targetIds);
      }),
  }),

  // Interview Practice
  interview: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getInterviewSessions(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getInterviewSession(input.id, ctx.user.id);
      }),
    create: protectedProcedure
      .input(
        z.object({
          university: z.string().optional(),
          major: z.string().optional(),
          interviewType: z.enum(["심층면접", "인성면접", "제시문면접"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getStudentProfile(ctx.user.id);
        const systemMessage = {
          role: "system" as const,
          content: `당신은 ${input.university || "대학교"} ${input.major || ""} ${input.interviewType || "인성면접"} 면접관입니다.
학생에게 면접 질문을 하나씩 제시하고, 답변에 대해 간단한 코멘트를 해주세요.
첫 질문부터 시작하세요. 한국어로 대화합니다.
${profile ? `학생 정보 - 학년: ${profile.grade}, 관심분야: ${((profile.interestAreas as string[]) || []).join(", ")}` : ""}`,
        };

        try {
          const response = await invokeLLM({ messages: [systemMessage] });
          const assistantContent = extractLLMContent(response) || "안녕하세요, 면접을 시작하겠습니다. 먼저 간단한 자기소개를 부탁드립니다.";
          const messages = [
            systemMessage,
            { role: "assistant" as const, content: assistantContent },
          ];

          const session = await db.createInterviewSession({
            ...input,
            userId: ctx.user.id,
            messages,
          });
          return session;
        } catch (error) {
          console.error("[Interview] Create session failed:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "면접 세션 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." });
        }
      }),
    chat: protectedProcedure
      .input(z.object({ sessionId: z.number(), message: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getInterviewSession(input.sessionId, ctx.user.id);
        if (!session) {
          throw new TRPCError({ code: "NOT_FOUND", message: "면접 세션을 찾을 수 없습니다." });
        }

        const currentMessages = (session.messages || []) as { role: string; content: string }[];
        const newMessages = [
          ...currentMessages,
          { role: "user" as const, content: input.message },
        ];

        try {
          const response = await invokeLLM({
            messages: newMessages.map((m) => ({
              role: m.role as "system" | "user" | "assistant",
              content: m.content,
            })),
          });

          const assistantContent = extractLLMContent(response) || "죄송합니다, 응답을 생성하지 못했습니다. 다시 답변해 주세요.";
          const updatedMessages = [
            ...newMessages,
            { role: "assistant" as const, content: assistantContent },
          ];

          await db.updateInterviewSession(input.sessionId, ctx.user.id, {
            messages: updatedMessages,
          });

          return assistantContent;
        } catch (error) {
          console.error("[Interview] Chat failed:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "면접 응답 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." });
        }
      }),
    feedback: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getInterviewSession(input.sessionId, ctx.user.id);
        if (!session) {
          throw new TRPCError({ code: "NOT_FOUND", message: "면접 세션을 찾을 수 없습니다." });
        }

        const msgs = (session.messages || []) as { role: string; content: string }[];

        try {
          const response = await invokeLLM({
            messages: [
              ...msgs.map((m) => ({
                role: m.role as "system" | "user" | "assistant",
                content: m.content,
              })),
              {
                role: "user" as const,
                content: "면접이 끝났습니다. 지금까지의 면접 내용을 종합적으로 평가해주세요. 1) 전체 평가 점수(100점 만점), 2) 강점, 3) 개선점, 4) 구체적 조언을 마크다운 형식으로 작성해주세요.",
              },
            ],
          });

          const feedbackText = extractLLMContent(response) || "면접 평가를 생성하지 못했습니다.";

          await db.updateInterviewSession(input.sessionId, ctx.user.id, {
            feedback: feedbackText,
          });

          return feedbackText;
        } catch (error) {
          console.error("[Interview] Feedback failed:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "면접 평가 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
