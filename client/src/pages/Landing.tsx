import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Brain,
  Search,
  Map,
  FileText,
  MessageSquare,
  Users,
  GraduationCap,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BookOpen,
  Target,
  ChevronRight,
} from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

const features = [
  {
    icon: Brain,
    title: "AI 전공 적성 분석",
    desc: "흥미, 성향, 학업 역량을 종합 분석하여 나에게 맞는 전공을 추천받으세요.",
    color: "bg-blue-50 text-blue-600",
    path: "/aptitude",
    requiresAuth: true,
  },
  {
    icon: Search,
    title: "학과/직업 탐색",
    desc: "AI 의미 검색으로 관심사에 맞는 학과와 직업을 탐색하세요.",
    color: "bg-purple-50 text-purple-600",
    path: "/explore",
    requiresAuth: false,
  },
  {
    icon: Map,
    title: "입시 로드맵",
    desc: "희망 대학과 학과를 설정하고 단계별 액션 플랜을 관리하세요.",
    color: "bg-green-50 text-green-600",
    path: "/roadmap",
    requiresAuth: true,
  },
  {
    icon: FileText,
    title: "생기부/자소서 가이드",
    desc: "AI가 학생부 종합전형 대비 자기소개서 작성을 도와드려요.",
    color: "bg-amber-50 text-amber-600",
    path: "/documents",
    requiresAuth: true,
  },
  {
    icon: MessageSquare,
    title: "AI 면접 연습",
    desc: "대학 입시 면접을 시뮬레이션하고 실시간 피드백을 받으세요.",
    color: "bg-rose-50 text-rose-600",
    path: "/interview",
    requiresAuth: true,
  },
  {
    icon: Users,
    title: "커뮤니티",
    desc: "입시 정보를 공유하고 선배들의 합격 수기를 확인하세요.",
    color: "bg-teal-50 text-teal-600",
    path: "/community",
    requiresAuth: false,
  },
];

const stats = [
  { label: "등록 학생", value: "2,400+", icon: GraduationCap },
  { label: "AI 분석 완료", value: "8,500+", icon: Sparkles },
  { label: "커뮤니티 글", value: "12,000+", icon: TrendingUp },
  { label: "합격 수기", value: "350+", icon: Target },
];

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-pink-50 p-8 md:p-12">
        {/* Decorative shapes */}
        <div className="absolute top-6 right-12 w-32 h-32 rounded-full bg-pastel-blue-light/40 blur-2xl" />
        <div className="absolute bottom-8 left-16 w-24 h-24 rounded-full bg-pastel-pink-light/40 blur-2xl" />
        <div className="absolute top-1/2 right-1/3 w-16 h-16 rounded-lg bg-pastel-blue-light/30 rotate-12 blur-xl" />

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              AI 기반 진로 가이드
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight">
            꿈을 향한 첫걸음,
            <br />
            <span className="text-primary">EduConnect</span>와 함께
          </h1>
          <p className="text-base text-muted-foreground mb-8 leading-relaxed max-w-lg">
            AI가 분석하는 전공 적성, 맞춤형 입시 로드맵, 면접 시뮬레이션까지.
            고등학생을 위한 종합 진로·입시 가이드 플랫폼입니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              className="rounded-xl shadow-md hover:shadow-lg transition-all"
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              무료로 시작하기
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl"
              onClick={() => setLocation("/explore")}
            >
              학과 탐색 둘러보기
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm bg-white/80">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Features */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">주요 기능</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white/80"
              onClick={() => {
                if (feature.requiresAuth) {
                  window.location.href = getLoginUrl();
                } else {
                  setLocation(feature.path);
                }
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`h-10 w-10 rounded-xl ${feature.color} flex items-center justify-center`}
                  >
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
                {!feature.requiresAuth && (
                  <span className="inline-block mt-3 text-xs text-primary font-medium">
                    로그인 없이 이용 가능
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Community Preview */}
      <section className="rounded-2xl bg-gradient-to-r from-teal-50 to-blue-50 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            <h2 className="text-xl font-bold text-foreground">커뮤니티</h2>
          </div>
          <Button
            variant="ghost"
            className="text-teal-600 hover:text-teal-700"
            onClick={() => setLocation("/community")}
          >
            전체 보기
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          입시 정보, 학습 질문, 합격 수기 등 다양한 이야기를 나눠보세요. 로그인 없이도 둘러볼 수 있어요.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { cat: "입시정보", title: "2027 수시 주요 변경사항 총정리", comments: 15 },
            { cat: "학습질문", title: "수학 개념 다 까먹었는데 어떡하죠...", comments: 19 },
            { cat: "합격수기", title: "[합격수기] 내신 3등급에서 연세대 합격한 후기", comments: 67 },
          ].map((post) => (
            <Card
              key={post.title}
              className="border-0 shadow-sm bg-white/90 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setLocation("/community")}
            >
              <CardContent className="p-4">
                <span className="text-[10px] font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                  {post.cat}
                </span>
                <p className="text-sm font-medium text-foreground mt-2 line-clamp-1">
                  {post.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  💬 {post.comments}개의 댓글
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-8">
        <h2 className="text-2xl font-bold text-foreground mb-3">
          지금 바로 시작하세요
        </h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          무료 회원가입 후 AI 전공 적성 분석, 맞춤형 입시 로드맵 등
          모든 기능을 이용할 수 있습니다.
        </p>
        <Button
          size="lg"
          className="rounded-xl shadow-md hover:shadow-lg transition-all"
          onClick={() => {
            window.location.href = getLoginUrl();
          }}
        >
          무료 회원가입
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </section>
    </div>
  );
}
