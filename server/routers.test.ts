import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "student@example.com",
    name: "테스트 학생",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createUnauthContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

// Mock db module
vi.mock("./db", () => ({
  getStudentProfile: vi.fn().mockResolvedValue(null),
  upsertStudentProfile: vi.fn().mockResolvedValue(undefined),
  getLatestAptitudeAnalysis: vi.fn().mockResolvedValue(null),
  getAptitudeAnalyses: vi.fn().mockResolvedValue([]),
  createAptitudeAnalysis: vi.fn().mockImplementation((data) => ({
    id: 1,
    ...data,
    createdAt: new Date(),
  })),
  getRoadmapGoals: vi.fn().mockResolvedValue([]),
  createRoadmapGoal: vi.fn().mockImplementation((data) => ({
    id: 1,
    ...data,
    status: "예정",
    createdAt: new Date(),
  })),
  updateRoadmapGoal: vi.fn().mockResolvedValue(undefined),
  deleteRoadmapGoal: vi.fn().mockResolvedValue(undefined),
  getDdayEvents: vi.fn().mockResolvedValue([]),
  createDdayEvent: vi.fn().mockImplementation((data) => ({
    id: 1,
    ...data,
    createdAt: new Date(),
  })),
  deleteDdayEvent: vi.fn().mockResolvedValue(undefined),
  getDocuments: vi.fn().mockResolvedValue([]),
  getDocument: vi.fn().mockResolvedValue(null),
  createDocument: vi.fn().mockImplementation((data) => ({
    id: 1,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  updateDocument: vi.fn().mockResolvedValue(undefined),
  deleteDocument: vi.fn().mockResolvedValue(undefined),
  getInterviewSessions: vi.fn().mockResolvedValue([]),
  getInterviewSession: vi.fn().mockResolvedValue(null),
  createInterviewSession: vi.fn().mockImplementation((data) => ({
    id: 1,
    ...data,
    createdAt: new Date(),
  })),
  updateInterviewSession: vi.fn().mockResolvedValue(undefined),
}));

// Mock LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            radarData: [
              { category: "인문학적 사고", score: 75 },
              { category: "과학적 탐구", score: 60 },
              { category: "수리적 분석", score: 80 },
              { category: "예술적 감성", score: 55 },
              { category: "사회적 소통", score: 70 },
              { category: "기술적 응용", score: 85 },
            ],
            recommendedMajors: [
              { name: "컴퓨터공학", matchRate: 92, description: "수리적 분석과 기술적 응용 능력이 뛰어납니다." },
              { name: "경영학", matchRate: 78, description: "사회적 소통과 분석 능력이 조화롭습니다." },
              { name: "통계학", matchRate: 75, description: "수리적 분석 능력이 강점입니다." },
            ],
            analysisText: "학생은 수리적 분석과 기술적 응용 분야에서 높은 적성을 보이고 있습니다.",
          }),
        },
      },
    ],
  }),
}));

describe("auth.me", () => {
  it("returns authenticated user info", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeTruthy();
    expect(result?.name).toBe("테스트 학생");
    expect(result?.email).toBe("student@example.com");
  });

  it("returns null for unauthenticated user", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("profile", () => {
  it("rejects unauthenticated access to profile.get", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.profile.get()).rejects.toThrow();
  });

  it("allows authenticated user to get profile", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.profile.get();
    // Returns null since mock returns null
    expect(result).toBeNull();
  });

  it("allows authenticated user to upsert profile", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.profile.upsert({
        grade: "3",
        school: "테스트고등학교",
        interestAreas: ["공학/IT", "자연과학"],
        favoriteSubjects: ["수학", "물리"],
        weakSubjects: ["국어"],
        gpa: "2.1",
        admissionType: "수시",
      })
    ).resolves.not.toThrow();
  });

  it("validates grade enum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.profile.upsert({ grade: "4" as any })
    ).rejects.toThrow();
  });
});

describe("aptitude", () => {
  it("rejects unauthenticated access", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.aptitude.latest()).rejects.toThrow();
  });

  it("returns analysis results with valid radar data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.aptitude.analyze({
      answers: {
        "문학 작품 분석을 즐기나요?": 3,
        "과학 실험에 흥미가 있나요?": 4,
        "수학 문제 풀이를 좋아하나요?": 5,
      },
    });

    expect(result).toBeTruthy();
    expect(result.radarData).toHaveLength(6);
    expect(result.recommendedMajors).toHaveLength(3);
    expect(result.analysisText).toBeTruthy();
  });

  it("lists aptitude analyses", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.aptitude.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("roadmap", () => {
  it("creates a goal with valid input", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.roadmap.create({
      title: "수학 내신 1등급 달성",
      description: "1학기 중간고사까지 목표",
      category: "학업",
      priority: "높음",
      dueDate: "2026-05-15",
    });

    expect(result).toBeTruthy();
    expect(result.title).toBe("수학 내신 1등급 달성");
  });

  it("rejects empty title", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.roadmap.create({ title: "" })
    ).rejects.toThrow();
  });

  it("validates category enum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.roadmap.create({ title: "테스트", category: "잘못된카테고리" as any })
    ).rejects.toThrow();
  });

  it("validates status enum on update", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.roadmap.update({ id: 1, status: "잘못된상태" as any })
    ).rejects.toThrow();
  });
});

describe("dday", () => {
  it("creates a dday event", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dday.create({
      title: "2026학년도 수능",
      eventDate: "2025-11-13",
      category: "수능",
    });

    expect(result).toBeTruthy();
    expect(result.title).toBe("2026학년도 수능");
  });

  it("rejects empty title", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.dday.create({ title: "", eventDate: "2025-11-13" })
    ).rejects.toThrow();
  });

  it("validates category enum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.dday.create({ title: "테스트", eventDate: "2025-11-13", category: "잘못된" as any })
    ).rejects.toThrow();
  });
});

describe("document", () => {
  it("creates a document", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.document.create({
      title: "서울대 자기소개서 1번",
      docType: "자기소개서",
    });

    expect(result).toBeTruthy();
    expect(result.title).toBe("서울대 자기소개서 1번");
  });

  it("validates docType enum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.document.create({ title: "테스트", docType: "잘못된유형" as any })
    ).rejects.toThrow();
  });

  it("rejects empty title", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.document.create({ title: "" })
    ).rejects.toThrow();
  });
});

describe("interview", () => {
  it("creates an interview session", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.interview.create({
      university: "서울대학교",
      major: "컴퓨터공학과",
      interviewType: "심층면접",
    });

    expect(result).toBeTruthy();
    expect(result.university).toBe("서울대학교");
  });

  it("validates interviewType enum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.interview.create({ interviewType: "잘못된유형" as any })
    ).rejects.toThrow();
  });

  it("rejects chat on non-existent session", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.interview.chat({ sessionId: 9999, message: "안녕하세요" })
    ).rejects.toThrow();
  });

  it("rejects feedback on non-existent session", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.interview.feedback({ sessionId: 9999 })
    ).rejects.toThrow();
  });
});

describe("helper functions", () => {
  it("extractLLMContent handles various response shapes", async () => {
    // This tests the router's behavior with malformed LLM responses
    // The aptitude.analyze should use fallback when LLM fails
    const { invokeLLM } = await import("./_core/llm");
    const mockedLLM = vi.mocked(invokeLLM);

    // Simulate LLM returning non-JSON
    mockedLLM.mockResolvedValueOnce({
      choices: [{ message: { content: "not json" } }],
    } as any);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.aptitude.analyze({
      answers: { "테스트 질문": 3 },
    });

    // Should use fallback values
    expect(result).toBeTruthy();
    expect(result.radarData).toBeDefined();
  });
});

// Add community mocks
vi.mock("./db", async (importOriginal) => {
  const original = await importOriginal() as Record<string, unknown>;
  return {
    ...original,
    getStudentProfile: vi.fn().mockResolvedValue(null),
    upsertStudentProfile: vi.fn().mockResolvedValue(undefined),
    getLatestAptitudeAnalysis: vi.fn().mockResolvedValue(null),
    getAptitudeAnalyses: vi.fn().mockResolvedValue([]),
    createAptitudeAnalysis: vi.fn().mockImplementation((data: any) => ({
      id: 1,
      ...data,
      createdAt: new Date(),
    })),
    getRoadmapGoals: vi.fn().mockResolvedValue([]),
    createRoadmapGoal: vi.fn().mockImplementation((data: any) => ({
      id: 1,
      ...data,
      status: "예정",
      createdAt: new Date(),
    })),
    updateRoadmapGoal: vi.fn().mockResolvedValue(undefined),
    deleteRoadmapGoal: vi.fn().mockResolvedValue(undefined),
    getDdayEvents: vi.fn().mockResolvedValue([]),
    createDdayEvent: vi.fn().mockImplementation((data: any) => ({
      id: 1,
      ...data,
      createdAt: new Date(),
    })),
    deleteDdayEvent: vi.fn().mockResolvedValue(undefined),
    getDocuments: vi.fn().mockResolvedValue([]),
    getDocument: vi.fn().mockResolvedValue(null),
    createDocument: vi.fn().mockImplementation((data: any) => ({
      id: 1,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    updateDocument: vi.fn().mockResolvedValue(undefined),
    deleteDocument: vi.fn().mockResolvedValue(undefined),
    getInterviewSessions: vi.fn().mockResolvedValue([]),
    getInterviewSession: vi.fn().mockResolvedValue(null),
    createInterviewSession: vi.fn().mockImplementation((data: any) => ({
      id: 1,
      ...data,
      createdAt: new Date(),
    })),
    updateInterviewSession: vi.fn().mockResolvedValue(undefined),
    // Community mocks
    getCommunityPosts: vi.fn().mockResolvedValue({ posts: [], total: 0 }),
    getCommunityPost: vi.fn().mockResolvedValue(null),
    getPopularPosts: vi.fn().mockResolvedValue([]),
    createCommunityPost: vi.fn().mockImplementation((data: any) => ({
      id: 1,
      ...data,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    updateCommunityPost: vi.fn().mockResolvedValue(undefined),
    deleteCommunityPost: vi.fn().mockResolvedValue(undefined),
    getCommentsByPostId: vi.fn().mockResolvedValue([]),
    createCommunityComment: vi.fn().mockImplementation((data: any) => ({
      id: 1,
      ...data,
      likeCount: 0,
      createdAt: new Date(),
    })),
    deleteCommunityComment: vi.fn().mockResolvedValue(undefined),
    toggleLike: vi.fn().mockResolvedValue({ liked: true }),
    getUserLikes: vi.fn().mockResolvedValue([]),
  };
});

describe("community.posts", () => {
  it("returns posts list for public access", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.community.posts({
      sort: "latest",
      page: 1,
      limit: 10,
    });
    expect(result).toHaveProperty("posts");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.posts)).toBe(true);
  });

  it("returns posts with category filter", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.community.posts({
      category: "입시정보",
    });
    expect(result).toHaveProperty("posts");
  });

  it("returns posts with search query", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.community.posts({
      search: "수능",
    });
    expect(result).toHaveProperty("posts");
  });
});

describe("community.post", () => {
  it("throws NOT_FOUND for non-existent post", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.community.post({ id: 9999 })).rejects.toThrow();
  });
});

describe("community.popular", () => {
  it("returns popular posts for public access", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.community.popular({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("community.create", () => {
  it("rejects unauthenticated post creation", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.community.create({
        title: "테스트 게시글",
        content: "테스트 내용입니다.",
      })
    ).rejects.toThrow();
  });

  it("creates a post for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.community.create({
      title: "수시 원서 접수 팁 공유",
      content: "수시 원서 접수 시 주의할 점을 공유합니다.",
      category: "입시정보",
      tags: ["수시", "원서접수"],
    });
    expect(result).toBeTruthy();
    expect(result.title).toBe("수시 원서 접수 팁 공유");
  });

  it("rejects empty title", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.community.create({ title: "", content: "내용" })
    ).rejects.toThrow();
  });

  it("rejects empty content", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.community.create({ title: "제목", content: "" })
    ).rejects.toThrow();
  });

  it("validates category enum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.community.create({
        title: "테스트",
        content: "내용",
        category: "잘못된카테고리" as any,
      })
    ).rejects.toThrow();
  });
});

describe("community.update", () => {
  it("rejects unauthenticated update", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.community.update({ id: 1, title: "수정된 제목" })
    ).rejects.toThrow();
  });

  it("allows authenticated user to update post", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.community.update({
        id: 1,
        title: "수정된 제목",
        content: "수정된 내용",
      })
    ).resolves.not.toThrow();
  });
});

describe("community.delete", () => {
  it("rejects unauthenticated delete", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.community.delete({ id: 1 })).rejects.toThrow();
  });

  it("allows authenticated user to delete post", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.community.delete({ id: 1 })).resolves.not.toThrow();
  });
});

describe("community.comments", () => {
  it("returns comments for public access", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.community.comments({ postId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("community.addComment", () => {
  it("rejects unauthenticated comment", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.community.addComment({ postId: 1, content: "댓글" })
    ).rejects.toThrow();
  });

  it("creates a comment for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.community.addComment({
      postId: 1,
      content: "좋은 정보 감사합니다!",
    });
    expect(result).toBeTruthy();
    expect(result.content).toBe("좋은 정보 감사합니다!");
  });

  it("creates a reply to a comment", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.community.addComment({
      postId: 1,
      content: "저도 동의합니다.",
      parentId: 1,
    });
    expect(result).toBeTruthy();
    expect(result.parentId).toBe(1);
  });

  it("rejects empty comment content", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.community.addComment({ postId: 1, content: "" })
    ).rejects.toThrow();
  });
});

describe("community.deleteComment", () => {
  it("rejects unauthenticated comment deletion", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.community.deleteComment({ id: 1, postId: 1 })
    ).rejects.toThrow();
  });

  it("allows authenticated user to delete own comment", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.community.deleteComment({ id: 1, postId: 1 })
    ).resolves.not.toThrow();
  });
});

describe("community.toggleLike", () => {
  it("rejects unauthenticated like toggle", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.community.toggleLike({ targetType: "post", targetId: 1 })
    ).rejects.toThrow();
  });

  it("toggles like for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.community.toggleLike({
      targetType: "post",
      targetId: 1,
    });
    expect(result).toHaveProperty("liked");
  });

  it("toggles comment like", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.community.toggleLike({
      targetType: "comment",
      targetId: 1,
    });
    expect(result).toHaveProperty("liked");
  });

  it("validates targetType enum", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.community.toggleLike({
        targetType: "invalid" as any,
        targetId: 1,
      })
    ).rejects.toThrow();
  });
});

describe("community.userLikes", () => {
  it("rejects unauthenticated access", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.community.userLikes({ targetType: "post", targetIds: [1, 2] })
    ).rejects.toThrow();
  });

  it("returns user likes for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.community.userLikes({
      targetType: "post",
      targetIds: [1, 2, 3],
    });
    expect(Array.isArray(result)).toBe(true);
  });
});
