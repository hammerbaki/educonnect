import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Brain, Sparkles, ArrowRight, ArrowLeft, Loader2, RotateCcw } from "lucide-react";
import { useState, useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { Streamdown } from "streamdown";

const surveyQuestions = [
  { id: "q1", text: "글을 읽고 분석하거나 논리적으로 글을 쓰는 것을 즐긴다", category: "인문학적 사고" },
  { id: "q2", text: "실험이나 관찰을 통해 자연 현상을 탐구하는 것이 재미있다", category: "과학적 탐구" },
  { id: "q3", text: "수학 문제를 풀거나 데이터를 분석하는 것에 흥미가 있다", category: "수리적 분석" },
  { id: "q4", text: "그림, 음악, 디자인 등 창작 활동에 관심이 많다", category: "예술적 감성" },
  { id: "q5", text: "사람들과 소통하고 팀 프로젝트를 이끄는 것을 좋아한다", category: "사회적 소통" },
  { id: "q6", text: "컴퓨터, 기계, 기술적 도구를 다루는 것에 흥미가 있다", category: "기술적 응용" },
  { id: "q7", text: "역사, 철학, 문학 등 인문학 분야에 깊은 관심이 있다", category: "인문학적 사고" },
  { id: "q8", text: "생물, 화학, 물리 등 과학 과목이 다른 과목보다 재미있다", category: "과학적 탐구" },
  { id: "q9", text: "통계나 확률 문제를 해결하는 것이 흥미롭다", category: "수리적 분석" },
  { id: "q10", text: "미적 감각이 뛰어나고 예술적 표현에 자신이 있다", category: "예술적 감성" },
  { id: "q11", text: "사회 문제에 관심이 많고 해결 방안을 고민한다", category: "사회적 소통" },
  { id: "q12", text: "프로그래밍이나 기술적 문제 해결에 도전하는 것을 좋아한다", category: "기술적 응용" },
];

export default function Aptitude() {
  const [step, setStep] = useState<"intro" | "survey" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const { data: latestAnalysis, refetch } = trpc.aptitude.latest.useQuery();
  const { data: analysisList } = trpc.aptitude.list.useQuery();
  const analyzeMutation = trpc.aptitude.analyze.useMutation({
    onSuccess: () => {
      refetch();
      setStep("result");
    },
  });

  const utils = trpc.useUtils();

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [surveyQuestions[currentQ].id]: parseInt(value),
    }));
  };

  const handleNext = () => {
    if (currentQ < surveyQuestions.length - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      analyzeMutation.mutate({ answers });
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ((prev) => prev - 1);
  };

  const handleStartNew = () => {
    setAnswers({});
    setCurrentQ(0);
    setStep("survey");
  };

  const displayAnalysis = step === "result" && latestAnalysis ? latestAnalysis : latestAnalysis;

  if (step === "intro" && !latestAnalysis) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4 py-8">
          <div className="relative inline-block">
            <div className="absolute -top-4 -left-6 w-14 h-14 rounded-full bg-pastel-blue-light/60 blur-sm" />
            <div className="absolute -bottom-2 -right-4 w-10 h-10 rounded-lg bg-pastel-pink-light/50 rotate-12 blur-sm" />
            <Brain className="h-16 w-16 text-primary relative" />
          </div>
          <h1 className="text-3xl font-bold">AI 전공 적성 분석</h1>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            12개의 간단한 질문에 답하면, AI가 당신의 적성을 분석하여 가장 적합한 대학 전공을 추천해 드립니다.
          </p>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-pastel-blue-light/30">
                <p className="text-2xl font-bold text-primary">12</p>
                <p className="text-xs text-muted-foreground mt-1">질문 수</p>
              </div>
              <div className="p-4 rounded-xl bg-pastel-pink-light/30">
                <p className="text-2xl font-bold text-pink-600">5분</p>
                <p className="text-xs text-muted-foreground mt-1">소요 시간</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50">
                <p className="text-2xl font-bold text-emerald-600">AI</p>
                <p className="text-xs text-muted-foreground mt-1">분석 방식</p>
              </div>
            </div>
            <Button onClick={handleStartNew} size="lg" className="w-full rounded-xl">
              <Sparkles className="mr-2 h-5 w-5" />
              분석 시작하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "survey" || (step === "intro" && !latestAnalysis)) {
    const progress = ((currentQ + 1) / surveyQuestions.length) * 100;
    const q = surveyQuestions[currentQ];
    const currentAnswer = answers[q.id];

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">적성 분석 설문</h1>
          <Badge variant="secondary" className="text-xs">
            {currentQ + 1} / {surveyQuestions.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-6">
            <div>
              <Badge variant="outline" className="mb-3 text-xs">
                {q.category}
              </Badge>
              <p className="text-lg font-medium leading-relaxed">{q.text}</p>
            </div>

            <RadioGroup
              value={currentAnswer?.toString() || ""}
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {[
                { value: "1", label: "전혀 그렇지 않다" },
                { value: "2", label: "그렇지 않다" },
                { value: "3", label: "보통이다" },
                { value: "4", label: "그렇다" },
                { value: "5", label: "매우 그렇다" },
              ].map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-3 p-3 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={option.value} id={`${q.id}-${option.value}`} />
                  <Label htmlFor={`${q.id}-${option.value}`} className="flex-1 cursor-pointer text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentQ === 0}
                className="rounded-xl"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                이전
              </Button>
              <Button
                onClick={handleNext}
                disabled={!currentAnswer || analyzeMutation.isPending}
                className="rounded-xl"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    분석 중...
                  </>
                ) : currentQ === surveyQuestions.length - 1 ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    분석하기
                  </>
                ) : (
                  <>
                    다음
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Result view (also shown when latestAnalysis exists and step is "intro")
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">전공 적성 분석 결과</h1>
          <p className="text-sm text-muted-foreground mt-1">
            최근 분석:{" "}
            {displayAnalysis?.createdAt
              ? new Date(displayAnalysis.createdAt).toLocaleDateString("ko-KR")
              : ""}
          </p>
        </div>
        <Button variant="outline" onClick={handleStartNew} className="rounded-xl">
          <RotateCcw className="mr-2 h-4 w-4" />
          다시 분석하기
        </Button>
      </div>

      {displayAnalysis && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">역량 분석 차트</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={
                        (displayAnalysis.radarData as {
                          category: string;
                          score: number;
                        }[]) || []
                      }
                    >
                      <PolarGrid stroke="oklch(0.9 0.005 260)" />
                      <PolarAngleAxis
                        dataKey="category"
                        tick={{ fontSize: 12, fill: "oklch(0.5 0.015 260)" }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        dataKey="score"
                        stroke="oklch(0.55 0.12 250)"
                        fill="oklch(0.75 0.1 240)"
                        fillOpacity={0.35}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Majors */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">추천 전공</CardTitle>
                <CardDescription>AI가 분석한 적합 전공 TOP 3</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(
                  (displayAnalysis.recommendedMajors as {
                    name: string;
                    matchRate: number;
                    description: string;
                  }[]) || []
                ).map((major, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/40 space-y-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          i === 0
                            ? "bg-primary text-primary-foreground"
                            : i === 1
                              ? "bg-pastel-blue text-white"
                              : "bg-pastel-pink text-white"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{major.name}</p>
                      </div>
                      <Badge variant="secondary" className="font-bold">
                        {major.matchRate}%
                      </Badge>
                    </div>
                    <Progress value={major.matchRate} className="h-1.5" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {major.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Analysis Text */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                종합 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <Streamdown>{displayAnalysis.analysisText || ""}</Streamdown>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
