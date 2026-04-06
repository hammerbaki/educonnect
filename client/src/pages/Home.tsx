import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Search,
  Map,
  FileText,
  MessageSquare,
  CalendarDays,
  Target,
  ArrowRight,
  Sparkles,
  Clock,
  Bell,
  AlertTriangle,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);

  const { data: latestAnalysis } = trpc.aptitude.latest.useQuery();
  const { data: goals } = trpc.roadmap.list.useQuery();
  const { data: ddayEvents } = trpc.dday.list.useQuery();
  const { data: documents } = trpc.document.list.useQuery();
  const { data: alerts } = trpc.dday.alerts.useQuery();

  // Show toast for urgent alerts on mount
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      const urgent = alerts.filter((a: any) => a.daysUntil <= 3);
      urgent.forEach((alert: any) => {
        if (!dismissedAlerts.includes(alert.id)) {
          toast.warning(`${alert.title}까지 ${alert.daysUntil === 0 ? "오늘입니다!" : `${alert.daysUntil}일 남았습니다!`}`, {
            duration: 8000,
            id: `dday-alert-${alert.id}`,
          });
        }
      });
    }
  }, [alerts]);

  const activeGoals = goals?.filter((g) => g.status !== "완료") || [];
  const completedGoals = goals?.filter((g) => g.status === "완료") || [];
  const progressPercent =
    goals && goals.length > 0
      ? Math.round((completedGoals.length / goals.length) * 100)
      : 0;

  const getDday = (eventDate: Date | string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(eventDate);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil(
      (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "D-Day";
    if (diff > 0) return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
  };

  const getDdayDiff = (eventDate: Date | string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(eventDate);
    target.setHours(0, 0, 0, 0);
    return Math.ceil(
      (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const getUrgencyStyle = (diff: number) => {
    if (diff <= 0) return "bg-red-100 text-red-700 border-red-200";
    if (diff <= 7) return "bg-orange-100 text-orange-700 border-orange-200";
    if (diff <= 30) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-pastel-blue-light/50 text-primary border-transparent";
  };

  const getUrgencyBadge = (diff: number) => {
    if (diff <= 0) return "bg-red-500 text-white";
    if (diff <= 7) return "bg-orange-500 text-white";
    if (diff <= 30) return "bg-amber-500 text-white";
    return "bg-primary text-white";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "좋은 아침이에요";
    if (hour < 18) return "좋은 오후예요";
    return "좋은 저녁이에요";
  };

  const quickActions = [
    {
      icon: Brain,
      label: "적성 분석",
      desc: "AI 전공 적성 분석",
      path: "/aptitude",
      color: "bg-pastel-blue-light text-primary",
    },
    {
      icon: MessageSquare,
      label: "면접 연습",
      desc: "AI 모의 면접",
      path: "/interview",
      color: "bg-pastel-pink-light text-pink-600",
    },
    {
      icon: Search,
      label: "학과 탐색",
      desc: "학과/직업 탐색",
      path: "/explore",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Map,
      label: "로드맵",
      desc: "입시 로드맵 관리",
      path: "/roadmap",
      color: "bg-amber-50 text-amber-600",
    },
  ];

  // Active (non-dismissed) alerts for banner
  const activeAlerts = (alerts || []).filter(
    (a: any) => !dismissedAlerts.includes(a.id)
  );

  // Sort D-Day events by proximity
  const sortedDdayEvents = [...(ddayEvents || [])].sort((a, b) => {
    const diffA = getDdayDiff(a.eventDate);
    const diffB = getDdayDiff(b.eventDate);
    // Show upcoming first (positive), then past (negative)
    if (diffA >= 0 && diffB < 0) return -1;
    if (diffA < 0 && diffB >= 0) return 1;
    return Math.abs(diffA) - Math.abs(diffB);
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Alert Banner */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.slice(0, 3).map((alert: any) => {
            const isUrgent = alert.daysUntil <= 3;
            return (
              <div
                key={alert.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isUrgent
                    ? "bg-red-50 border-red-200"
                    : alert.daysUntil <= 7
                      ? "bg-orange-50 border-orange-200"
                      : "bg-amber-50 border-amber-200"
                }`}
              >
                {isUrgent ? (
                  <AlertTriangle className={`h-4 w-4 shrink-0 ${isUrgent ? "text-red-500" : "text-amber-500"}`} />
                ) : (
                  <Bell className="h-4 w-4 shrink-0 text-amber-500" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isUrgent ? "text-red-700" : alert.daysUntil <= 7 ? "text-orange-700" : "text-amber-700"}`}>
                    {alert.title}
                  </p>
                  <p className={`text-xs ${isUrgent ? "text-red-600" : alert.daysUntil <= 7 ? "text-orange-600" : "text-amber-600"}`}>
                    {alert.daysUntil === 0
                      ? "오늘입니다!"
                      : `${alert.daysUntil}일 남았습니다`}
                    {" · "}
                    {new Date(alert.eventDate).toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                    })}
                  </p>
                </div>
                <Badge className={getUrgencyBadge(alert.daysUntil)}>
                  {getDday(alert.eventDate)}
                </Badge>
                <button
                  onClick={() =>
                    setDismissedAlerts((prev) => [...prev, alert.id])
                  }
                  className="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-pastel-blue-light/40 to-pastel-pink-light/30 p-6 md:p-8">
        {/* Decorative shapes */}
        <div className="absolute top-4 right-8 w-24 h-24 rounded-full bg-pastel-blue/20 blur-xl" />
        <div className="absolute bottom-2 right-32 w-16 h-16 rounded-lg bg-pastel-pink/20 blur-lg rotate-12" />
        <div className="relative">
          <p className="text-sm text-muted-foreground mb-1">{getGreeting()},</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {user?.name || "학생"}님, 오늘도 꿈을 향해 나아가세요!
          </h1>
          <p className="text-muted-foreground text-sm">
            현재 진행률:{" "}
            <span className="font-semibold text-primary">{progressPercent}%</span>{" "}
            완료
          </p>
          <Progress value={progressPercent} className="mt-3 h-2 max-w-xs" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Analysis + Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Analysis Summary */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  전공 적성 분석 요약
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => setLocation("/aptitude")}
                >
                  자세히 보기 <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {latestAnalysis ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        data={
                          (latestAnalysis.radarData as {
                            category: string;
                            score: number;
                          }[]) || []
                        }
                      >
                        <PolarGrid stroke="oklch(0.9 0.005 260)" />
                        <PolarAngleAxis
                          dataKey="category"
                          tick={{ fontSize: 11, fill: "oklch(0.5 0.015 260)" }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          tick={false}
                          axisLine={false}
                        />
                        <Radar
                          dataKey="score"
                          stroke="oklch(0.55 0.12 250)"
                          fill="oklch(0.75 0.1 240)"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      1순위 추천 전공
                    </p>
                    {(
                      (latestAnalysis.recommendedMajors as {
                        name: string;
                        matchRate: number;
                        description: string;
                      }[]) || []
                    )
                      .slice(0, 3)
                      .map((major, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {major.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              적합도 {major.matchRate}%
                            </p>
                          </div>
                          <Progress
                            value={major.matchRate}
                            className="w-16 h-1.5"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-pastel-blue-light/50 flex items-center justify-center mb-4">
                    <Brain className="h-8 w-8 text-primary/50" />
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    아직 적성 분석을 진행하지 않았어요
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setLocation("/aptitude")}
                    className="rounded-xl"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI 분석 시작하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => setLocation(action.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.color}`}
                >
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
                <span className="text-xs text-muted-foreground">
                  {action.desc}
                </span>
              </button>
            ))}
          </div>

          {/* AI CTA */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-pastel-blue-light/30 to-pastel-pink-light/20">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">
                  내 진로를 분석하고 맞춤 정보 받기
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI가 당신의 역량을 분석하고, 최적의 진로 로드맵을 제시합니다.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setLocation("/aptitude")}
                className="shrink-0 rounded-xl"
              >
                시작하기
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: D-Day + Goals + Recent Docs */}
        <div className="space-y-6">
          {/* D-Day */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  D-Day 카운트다운
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-primary"
                  onClick={() => setLocation("/roadmap")}
                >
                  관리 <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedDdayEvents.length > 0 ? (
                sortedDdayEvents.slice(0, 5).map((event) => {
                  const diff = getDdayDiff(event.eventDate);
                  const urgencyStyle = getUrgencyStyle(diff);
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${urgencyStyle}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {diff <= 7 && diff >= 0 && (
                            <Bell className="h-3 w-3 shrink-0" />
                          )}
                          <p className="text-sm font-medium truncate">
                            {event.title}
                          </p>
                        </div>
                        <p className="text-xs opacity-70 mt-0.5">
                          {new Date(event.eventDate).toLocaleDateString("ko-KR", {
                            month: "long",
                            day: "numeric",
                            weekday: "short",
                          })}
                        </p>
                      </div>
                      <Badge
                        className={`shrink-0 font-bold ${getUrgencyBadge(diff)}`}
                      >
                        {getDday(event.eventDate)}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-3">
                    등록된 일정이 없어요
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={() => setLocation("/roadmap")}
                  >
                    일정 등록하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goals */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  목표 관리
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-primary"
                  onClick={() => setLocation("/roadmap")}
                >
                  전체 보기 <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-sm text-muted-foreground">전체 진행률</p>
                <span className="text-sm font-bold text-primary">
                  {progressPercent}%
                </span>
              </div>
              <Progress value={progressPercent} className="h-2 mb-4" />
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-muted/40">
                  <p className="text-lg font-bold">
                    {goals?.filter((g) => g.status === "예정").length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">예정</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-pastel-blue-light/30">
                  <p className="text-lg font-bold text-primary">
                    {goals?.filter((g) => g.status === "진행중").length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">진행중</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-emerald-50">
                  <p className="text-lg font-bold text-emerald-600">
                    {completedGoals.length}
                  </p>
                  <p className="text-xs text-muted-foreground">완료</p>
                </div>
              </div>
              {activeGoals.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    우선 처리 목표
                  </p>
                  {activeGoals.slice(0, 3).map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-center gap-2 p-2 rounded-lg"
                    >
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          goal.priority === "높음"
                            ? "bg-red-400"
                            : goal.priority === "보통"
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                        }`}
                      />
                      <p className="text-sm truncate flex-1">{goal.title}</p>
                      {goal.dueDate && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(goal.dueDate).toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  최근 서류
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-primary"
                  onClick={() => setLocation("/documents")}
                >
                  전체 보기 <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {documents && documents.length > 0 ? (
                documents.slice(0, 3).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {doc.docType}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    작성한 서류가 없어요
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
