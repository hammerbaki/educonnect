import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Search, GraduationCap, Briefcase, BookOpen, TrendingUp, Sparkles,
  Loader2, ArrowRight, User, Brain, Target, ChevronRight, Star,
  Lightbulb, ClipboardList, BarChart3, CheckCircle2
} from "lucide-react";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const majorCategories = [
  { id: "all", label: "전체" },
  { id: "인문", label: "인문계열" },
  { id: "사회", label: "사회계열" },
  { id: "자연", label: "자연계열" },
  { id: "공학", label: "공학계열" },
  { id: "예체능", label: "예체능계열" },
  { id: "의약", label: "의약계열" },
];

const majorsData = [
  { name: "컴퓨터공학", category: "공학", jobs: ["소프트웨어 개발자", "데이터 사이언티스트", "AI 엔지니어"], demand: "매우 높음", desc: "컴퓨터 시스템의 설계, 개발, 운영에 관한 이론과 실무를 학습합니다.", subjects: ["수학", "정보", "물리"] },
  { name: "경영학", category: "사회", jobs: ["경영 컨설턴트", "마케팅 매니저", "재무 분석가"], demand: "높음", desc: "기업 경영의 전반적인 이론과 실무를 학습하여 경영 전문가를 양성합니다.", subjects: ["사회", "수학", "영어"] },
  { name: "심리학", category: "사회", jobs: ["상담사", "인사 담당자", "UX 리서처"], demand: "높음", desc: "인간의 행동과 정신 과정을 과학적으로 연구하는 학문입니다.", subjects: ["생명과학", "사회", "국어"] },
  { name: "전자공학", category: "공학", jobs: ["반도체 엔지니어", "통신 엔지니어", "임베디드 개발자"], demand: "매우 높음", desc: "전자 회로, 통신, 반도체 등 전자 기술의 이론과 응용을 학습합니다.", subjects: ["물리", "수학", "정보"] },
  { name: "국어국문학", category: "인문", jobs: ["작가", "편집자", "국어 교사"], demand: "보통", desc: "한국어와 한국 문학을 깊이 있게 연구하는 학문입니다.", subjects: ["국어", "사회", "역사"] },
  { name: "생명과학", category: "자연", jobs: ["연구원", "제약회사 연구원", "바이오 엔지니어"], demand: "높음", desc: "생명 현상의 원리를 탐구하고 응용하는 학문입니다.", subjects: ["생명과학", "화학", "수학"] },
  { name: "시각디자인", category: "예체능", jobs: ["그래픽 디자이너", "UI/UX 디자이너", "브랜드 디자이너"], demand: "높음", desc: "시각적 커뮤니케이션을 위한 디자인 이론과 실무를 학습합니다.", subjects: ["미술", "정보", "영어"] },
  { name: "의학", category: "의약", jobs: ["의사", "의학 연구원", "보건 전문가"], demand: "매우 높음", desc: "인체의 구조와 기능, 질병의 원인과 치료를 학습합니다.", subjects: ["생명과학", "화학", "물리"] },
  { name: "간호학", category: "의약", jobs: ["간호사", "보건교사", "연구간호사"], demand: "매우 높음", desc: "환자 간호와 건강 증진에 필요한 전문 지식을 학습합니다.", subjects: ["생명과학", "화학", "국어"] },
  { name: "건축학", category: "공학", jobs: ["건축가", "인테리어 디자이너", "도시계획가"], demand: "높음", desc: "건축물의 설계와 시공에 관한 이론과 실무를 학습합니다.", subjects: ["수학", "물리", "미술"] },
  { name: "영어영문학", category: "인문", jobs: ["번역가", "영어 교사", "외교관"], demand: "보통", desc: "영어와 영미 문학을 깊이 있게 연구하는 학문입니다.", subjects: ["영어", "국어", "사회"] },
  { name: "화학공학", category: "공학", jobs: ["화학 엔지니어", "에너지 연구원", "환경 컨설턴트"], demand: "높음", desc: "화학 반응을 산업적으로 응용하는 공학 분야입니다.", subjects: ["화학", "수학", "물리"] },
];

const jobsData = [
  { name: "소프트웨어 개발자", field: "IT/기술", salary: "4,500만원~", growth: "매우 높음", desc: "소프트웨어를 설계, 개발, 테스트하는 전문가입니다.", relatedMajors: ["컴퓨터공학", "소프트웨어학", "정보통신공학"] },
  { name: "데이터 사이언티스트", field: "IT/기술", salary: "5,000만원~", growth: "매우 높음", desc: "데이터를 분석하여 비즈니스 인사이트를 도출하는 전문가입니다.", relatedMajors: ["통계학", "컴퓨터공학", "수학"] },
  { name: "UX/UI 디자이너", field: "디자인", salary: "3,800만원~", growth: "높음", desc: "사용자 경험과 인터페이스를 설계하는 디자이너입니다.", relatedMajors: ["시각디자인", "산업디자인", "컴퓨터공학"] },
  { name: "의사", field: "의료", salary: "8,000만원~", growth: "안정", desc: "환자를 진단하고 치료하는 의료 전문가입니다.", relatedMajors: ["의학", "치의학", "한의학"] },
  { name: "경영 컨설턴트", field: "경영", salary: "5,000만원~", growth: "높음", desc: "기업의 경영 전략을 분석하고 개선 방안을 제시합니다.", relatedMajors: ["경영학", "경제학", "산업공학"] },
  { name: "콘텐츠 크리에이터", field: "미디어", salary: "3,000만원~", growth: "매우 높음", desc: "다양한 플랫폼에서 콘텐츠를 기획하고 제작합니다.", relatedMajors: ["미디어학", "영상학", "시각디자인"] },
  { name: "환경 엔지니어", field: "환경/에너지", salary: "4,000만원~", growth: "높음", desc: "환경 문제를 해결하기 위한 기술적 방안을 개발합니다.", relatedMajors: ["환경공학", "화학공학", "토목공학"] },
  { name: "임상심리사", field: "심리/상담", salary: "3,500만원~", growth: "높음", desc: "심리 검사와 상담을 통해 정신 건강을 돕는 전문가입니다.", relatedMajors: ["심리학", "상담학", "사회복지학"] },
];

const suggestedQueries = [
  "사람들을 돕는 일을 하고 싶어요",
  "수학을 좋아하는데 어떤 전공이 맞을까요?",
  "창의적인 일을 하고 싶어요",
  "돈을 많이 버는 직업이 뭐가 있나요?",
  "코딩에 관심이 있는데 어떤 학과가 좋을까?",
  "환경 문제를 해결하고 싶어요",
];

const interestOptions = [
  "IT/프로그래밍", "수학/통계", "과학/연구", "의료/건강", "경영/경제",
  "법/정치", "교육", "예술/디자인", "음악/공연", "문학/글쓰기",
  "심리/상담", "사회복지", "환경/에너지", "건축/도시", "미디어/방송",
  "스포츠", "외국어/국제", "요리/식품", "패션/뷰티", "게임/엔터테인먼트",
];

type SemanticResult = {
  majors: Array<{
    name: string; category: string; matchScore: number; reason: string;
    jobs: string[]; subjects: string[]; demand: string; desc: string;
  }>;
  jobs: Array<{
    name: string; field: string; matchScore: number; reason: string;
    relatedMajors: string[]; salary: string; growth: string; desc: string;
  }>;
  summary: string;
};

type PersonalizedResult = {
  analysis: {
    strengths: string[];
    personalityType: string;
    recommendedFields: string[];
    overallComment: string;
  };
  majors: Array<{
    name: string; category: string; matchScore: number; reason: string;
    admissionTip: string; relatedSubjects: string[]; careerPaths: string[]; demand: string;
  }>;
  jobs: Array<{
    name: string; field: string; matchScore: number; reason: string;
    requiredSkills: string[]; salary: string; growth: string; workEnvironment: string;
  }>;
  studyPlan: {
    focusSubjects: string[];
    activities: string[];
    timeline: string;
  };
};

const personalityLabels = [
  { key: "introvertExtrovert" as const, left: "내향적", right: "외향적", icon: User },
  { key: "thinkingFeeling" as const, left: "논리적", right: "감성적", icon: Brain },
  { key: "planningFlexible" as const, left: "계획적", right: "유연한", icon: ClipboardList },
  { key: "individualTeam" as const, left: "개인 작업", right: "팀워크", icon: Target },
  { key: "creativeAnalytical" as const, left: "분석적", right: "창의적", icon: Lightbulb },
];

const gradeLabels = [
  { key: "korean" as const, label: "국어" },
  { key: "math" as const, label: "수학" },
  { key: "english" as const, label: "영어" },
  { key: "science" as const, label: "과학(탐구)" },
  { key: "social" as const, label: "사회(탐구)" },
  { key: "art" as const, label: "예체능" },
];

export default function Explore() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic" | "personalized">("keyword");
  const [semanticResult, setSemanticResult] = useState<SemanticResult | null>(null);
  const [personalizedResult, setPersonalizedResult] = useState<PersonalizedResult | null>(null);

  // Personalized form state
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [personality, setPersonality] = useState({
    introvertExtrovert: 3,
    thinkingFeeling: 3,
    planningFlexible: 3,
    individualTeam: 3,
    creativeAnalytical: 3,
  });
  const [grades, setGrades] = useState<Record<string, number | undefined>>({
    korean: undefined, math: undefined, english: undefined,
    science: undefined, social: undefined, art: undefined,
  });
  const [preferredType, setPreferredType] = useState<string>("상관없음");
  const [priorityFactor, setPriorityFactor] = useState<string>("적성");
  const [formStep, setFormStep] = useState(1);

  const semanticSearch = trpc.explore.semanticSearch.useMutation({
    onSuccess: (data) => { setSemanticResult(data as SemanticResult); },
    onError: (err) => { toast.error(err.message || "AI 검색에 실패했습니다."); },
  });

  const personalizedRecommend = trpc.explore.personalizedRecommend.useMutation({
    onSuccess: (data) => { setPersonalizedResult(data as PersonalizedResult); },
    onError: (err) => { toast.error(err.message || "맞춤형 추천에 실패했습니다."); },
  });

  const handleSemanticSearch = () => {
    if (!searchTerm.trim()) { toast.error("검색어를 입력해주세요."); return; }
    setSearchMode("semantic");
    semanticSearch.mutate({ query: searchTerm });
  };

  const handleKeywordSearch = (value: string) => {
    setSearchTerm(value);
    setSearchMode("keyword");
    setSemanticResult(null);
  };

  const handleSuggestedQuery = (query: string) => {
    setSearchTerm(query);
    setSearchMode("semantic");
    semanticSearch.mutate({ query });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchTerm.trim()) handleSemanticSearch();
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : prev.length < 5 ? [...prev, interest] : prev
    );
  };

  const handlePersonalizedSubmit = () => {
    if (selectedInterests.length === 0) { toast.error("관심 분야를 1개 이상 선택해주세요."); return; }
    const gradeInput: Record<string, number | undefined> = {};
    Object.entries(grades).forEach(([k, v]) => {
      if (v !== undefined) gradeInput[k] = v;
    });
    personalizedRecommend.mutate({
      interests: selectedInterests,
      personality,
      grades: gradeInput as any,
      preferredType: preferredType as any,
      priorityFactor: priorityFactor as any,
    });
  };

  const filteredMajors = useMemo(() => {
    if (searchMode !== "keyword") return [];
    return majorsData.filter((m) => {
      const matchCategory = selectedCategory === "all" || m.category === selectedCategory;
      const matchSearch = !searchTerm || m.name.includes(searchTerm) || m.desc.includes(searchTerm) || m.jobs.some((j) => j.includes(searchTerm));
      return matchCategory && matchSearch;
    });
  }, [searchTerm, selectedCategory, searchMode]);

  const filteredJobs = useMemo(() => {
    if (searchMode !== "keyword") return [];
    return jobsData.filter((j) => !searchTerm || j.name.includes(searchTerm) || j.field.includes(searchTerm) || j.desc.includes(searchTerm));
  }, [searchTerm, searchMode]);

  const getDemandColor = (demand: string) => {
    if (demand === "매우 높음") return "bg-emerald-100 text-emerald-700";
    if (demand === "높음") return "bg-blue-100 text-blue-700";
    if (demand === "안정") return "bg-violet-100 text-violet-700";
    return "bg-gray-100 text-gray-600";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-blue-600";
    return "text-gray-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-blue-500";
    return "bg-gray-400";
  };

  const resetToKeyword = () => {
    setSearchMode("keyword");
    setSemanticResult(null);
    setPersonalizedResult(null);
    setSearchTerm("");
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">학과/직업 탐색</h1>
        <p className="text-sm text-muted-foreground mt-1">
          키워드 검색, AI 의미 검색, 또는 나만의 맞춤형 추천을 받아보세요
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={searchMode === "keyword" || searchMode === "semantic" ? "default" : "outline"}
          size="sm"
          className="rounded-full gap-1.5"
          onClick={() => { setSearchMode("keyword"); setPersonalizedResult(null); }}
        >
          <Search className="h-3.5 w-3.5" />
          검색 탐색
        </Button>
        <Button
          variant={searchMode === "personalized" ? "default" : "outline"}
          size="sm"
          className="rounded-full gap-1.5"
          onClick={() => { setSearchMode("personalized"); setSemanticResult(null); setFormStep(1); }}
        >
          <Star className="h-3.5 w-3.5" />
          맞춤형 추천
        </Button>
      </div>

      {/* ===== SEARCH MODE ===== */}
      {(searchMode === "keyword" || searchMode === "semantic") && (
        <>
          {/* Search Bar */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="예: '사람들을 돕는 일을 하고 싶어요' 또는 키워드 입력..."
                  value={searchTerm}
                  onChange={(e) => handleKeywordSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 rounded-xl h-11"
                />
              </div>
              <Button
                onClick={handleSemanticSearch}
                disabled={!searchTerm.trim() || semanticSearch.isPending}
                className="rounded-xl h-11 gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-5"
              >
                {semanticSearch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                AI 검색
              </Button>
            </div>
            {!searchTerm && searchMode === "keyword" && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground py-1">추천 질문:</span>
                {suggestedQueries.map((q) => (
                  <button key={q} onClick={() => handleSuggestedQuery(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer">
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Semantic Results */}
          {searchMode === "semantic" && (
            <div className="space-y-6">
              {semanticSearch.isPending && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-blue-50">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    <span className="text-blue-700 font-medium">AI가 관련 학과와 직업을 분석하고 있어요...</span>
                  </div>
                </div>
              )}
              {semanticResult && !semanticSearch.isPending && (
                <>
                  <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <h3 className="font-semibold text-sm text-blue-900 mb-1">AI 분석 결과</h3>
                          <p className="text-sm text-blue-800 leading-relaxed">{semanticResult.summary}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {semanticResult.majors.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-blue-500" /> 추천 학과
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {semanticResult.majors.map((major, i) => (
                          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5 space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-base">{major.name}</h3>
                                    <span className={`text-sm font-bold ${getScoreColor(major.matchScore)}`}>{major.matchScore}%</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs mt-1">{major.category}계열</Badge>
                                </div>
                                <Badge className={`text-xs ${getDemandColor(major.demand)}`}>수요 {major.demand}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">{major.desc}</p>
                              <div className="p-2.5 rounded-lg bg-blue-50/50 text-xs text-blue-700">
                                <ArrowRight className="h-3 w-3 inline mr-1" />{major.reason}
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <BookOpen className="h-3.5 w-3.5" /><span>관련 과목: {major.subjects.join(", ")}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Briefcase className="h-3.5 w-3.5" /><span>관련 직업: {major.jobs.join(", ")}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  {semanticResult.jobs.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-indigo-500" /> 추천 직업
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {semanticResult.jobs.map((job, i) => (
                          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5 space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-base">{job.name}</h3>
                                    <span className={`text-sm font-bold ${getScoreColor(job.matchScore)}`}>{job.matchScore}%</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs mt-1">{job.field}</Badge>
                                </div>
                                <Badge className={getDemandColor(job.growth)}>성장성 {job.growth}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">{job.desc}</p>
                              <div className="p-2.5 rounded-lg bg-indigo-50/50 text-xs text-indigo-700">
                                <ArrowRight className="h-3 w-3 inline mr-1" />{job.reason}
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <TrendingUp className="h-3.5 w-3.5" /><span>초봉: {job.salary}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <GraduationCap className="h-3.5 w-3.5" /><span>관련 학과: {job.relatedMajors.join(", ")}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-center">
                    <Button variant="outline" onClick={resetToKeyword} className="rounded-xl">전체 목록으로 돌아가기</Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Keyword Results */}
          {searchMode === "keyword" && (
            <Tabs defaultValue="majors">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="majors" className="gap-1.5"><GraduationCap className="h-4 w-4" />학과 정보</TabsTrigger>
                <TabsTrigger value="jobs" className="gap-1.5"><Briefcase className="h-4 w-4" />직업 정보</TabsTrigger>
              </TabsList>
              <TabsContent value="majors" className="space-y-4 mt-4">
                <div className="flex flex-wrap gap-2">
                  {majorCategories.map((cat) => (
                    <Button key={cat.id} variant={selectedCategory === cat.id ? "default" : "outline"} size="sm"
                      onClick={() => setSelectedCategory(cat.id)} className="rounded-full text-xs">
                      {cat.label}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMajors.map((major) => (
                    <Card key={major.name} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-base">{major.name}</h3>
                            <Badge variant="outline" className="text-xs mt-1">{major.category}계열</Badge>
                          </div>
                          <Badge className={`text-xs ${getDemandColor(major.demand)}`}>수요 {major.demand}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{major.desc}</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <BookOpen className="h-3.5 w-3.5" /><span>관련 과목: {major.subjects.join(", ")}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Briefcase className="h-3.5 w-3.5" /><span>관련 직업: {major.jobs.join(", ")}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {filteredMajors.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">검색 결과가 없습니다</p>
                    <p className="text-xs text-muted-foreground mt-1">AI 검색을 사용해 보세요</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="jobs" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredJobs.map((job) => (
                    <Card key={job.name} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-base">{job.name}</h3>
                            <Badge variant="outline" className="text-xs mt-1">{job.field}</Badge>
                          </div>
                          <Badge className={getDemandColor(job.growth)}>성장성 {job.growth}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{job.desc}</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <TrendingUp className="h-3.5 w-3.5" /><span>초봉: {job.salary}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <GraduationCap className="h-3.5 w-3.5" /><span>관련 학과: {job.relatedMajors.join(", ")}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {filteredJobs.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">검색 결과가 없습니다</p>
                    <p className="text-xs text-muted-foreground mt-1">AI 검색을 사용해 보세요</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </>
      )}

      {/* ===== PERSONALIZED MODE ===== */}
      {searchMode === "personalized" && !personalizedResult && (
        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  formStep >= step ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {formStep > step ? <CheckCircle2 className="h-4 w-4" /> : step}
                </div>
                <span className={`text-xs hidden sm:inline ${formStep >= step ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                  {step === 1 ? "관심 분야" : step === 2 ? "성향 분석" : "성적 입력"}
                </span>
                {step < 3 && <ChevronRight className="h-4 w-4 text-gray-300" />}
              </div>
            ))}
          </div>

          {/* Step 1: Interests */}
          {formStep === 1 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    관심 분야 선택
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">관심 있는 분야를 1~5개 선택해주세요</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3.5 py-2 rounded-full text-sm transition-all cursor-pointer ${
                        selectedInterests.includes(interest)
                          ? "bg-blue-500 text-white shadow-sm"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                {selectedInterests.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {selectedInterests.length}개 선택됨: {selectedInterests.join(", ")}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={() => {
                    if (selectedInterests.length === 0) { toast.error("관심 분야를 1개 이상 선택해주세요."); return; }
                    setFormStep(2);
                  }} className="rounded-xl gap-1.5">
                    다음 <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Personality */}
          {formStep === 2 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Brain className="h-5 w-5 text-violet-500" />
                    성향 분석
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">각 항목에서 자신에게 가까운 쪽으로 슬라이더를 조절해주세요</p>
                </div>
                <div className="space-y-6">
                  {personalityLabels.map(({ key, left, right, icon: Icon }) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">{left} vs {right}</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{left}</span>
                        <Slider
                          value={[personality[key]]}
                          onValueChange={([v]) => setPersonality((prev) => ({ ...prev, [key]: v }))}
                          min={1} max={5} step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-16 shrink-0">{right}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setFormStep(1)} className="rounded-xl">이전</Button>
                  <Button onClick={() => setFormStep(3)} className="rounded-xl gap-1.5">
                    다음 <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Grades & Preferences */}
          {formStep === 3 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-500" />
                    과목별 성적 & 선호도
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">내신 등급을 입력해주세요 (선택사항, 1~9등급)</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {gradeLabels.map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-sm">{label}</Label>
                      <Input
                        type="number" min={1} max={9} placeholder="등급"
                        value={grades[key] ?? ""}
                        onChange={(e) => {
                          const v = e.target.value ? Math.min(9, Math.max(1, parseInt(e.target.value))) : undefined;
                          setGrades((prev) => ({ ...prev, [key]: v }));
                        }}
                        className="rounded-lg"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">계열 선호</Label>
                  <div className="flex flex-wrap gap-2">
                    {["문과", "이과", "예체능", "상관없음"].map((type) => (
                      <button key={type} onClick={() => setPreferredType(type)}
                        className={`px-3.5 py-2 rounded-full text-sm transition-all cursor-pointer ${
                          preferredType === type ? "bg-blue-500 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                        }`}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">우선순위</Label>
                  <div className="flex flex-wrap gap-2">
                    {["적성", "취업", "연봉", "안정성", "성장성"].map((factor) => (
                      <button key={factor} onClick={() => setPriorityFactor(factor)}
                        className={`px-3.5 py-2 rounded-full text-sm transition-all cursor-pointer ${
                          priorityFactor === factor ? "bg-blue-500 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                        }`}>
                        {factor}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setFormStep(2)} className="rounded-xl">이전</Button>
                  <Button onClick={handlePersonalizedSubmit} disabled={personalizedRecommend.isPending}
                    className="rounded-xl gap-2 bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white px-6">
                    {personalizedRecommend.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    AI 맞춤 추천 받기
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {personalizedRecommend.isPending && (
            <div className="text-center py-16">
              <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-violet-50">
                <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                <span className="text-violet-700 font-medium">AI가 맞춤형 학과와 직업을 분석하고 있어요...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== PERSONALIZED RESULTS ===== */}
      {searchMode === "personalized" && personalizedResult && (
        <div className="space-y-6">
          {/* Analysis Summary */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 via-blue-50 to-indigo-50">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-500" />
                AI 종합 분석
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-white/60 space-y-1.5">
                  <p className="text-xs font-medium text-violet-600">성향 유형</p>
                  <p className="text-sm font-semibold">{personalizedResult.analysis.personalityType}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/60 space-y-1.5">
                  <p className="text-xs font-medium text-blue-600">강점</p>
                  <div className="flex flex-wrap gap-1">
                    {personalizedResult.analysis.strengths.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-white">{s}</Badge>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/60 space-y-1.5">
                  <p className="text-xs font-medium text-indigo-600">추천 계열</p>
                  <div className="flex flex-wrap gap-1">
                    {personalizedResult.analysis.recommendedFields.map((f, i) => (
                      <Badge key={i} className="text-xs bg-indigo-100 text-indigo-700">{f}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed bg-white/40 p-3 rounded-lg">
                {personalizedResult.analysis.overallComment}
              </p>
            </CardContent>
          </Card>

          {/* Recommended Majors */}
          {personalizedResult.majors.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-500" />
                맞춤 추천 학과
              </h2>
              <div className="space-y-4">
                {personalizedResult.majors.map((major, i) => (
                  <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${getScoreBg(major.matchScore)}`}>
                            {i + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-base">{major.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-xs">{major.category}</Badge>
                              <Badge className={`text-xs ${getDemandColor(major.demand)}`}>수요 {major.demand}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xl font-bold ${getScoreColor(major.matchScore)}`}>{major.matchScore}%</span>
                          <p className="text-xs text-muted-foreground">적합도</p>
                        </div>
                      </div>
                      <Progress value={major.matchScore} className="h-1.5" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{major.reason}</p>
                      <div className="p-3 rounded-lg bg-amber-50/70 text-xs text-amber-800">
                        <Lightbulb className="h-3.5 w-3.5 inline mr-1.5 text-amber-500" />
                        <strong>입시 팁:</strong> {major.admissionTip}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                        <div className="flex items-start gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>관련 과목: {major.relatedSubjects.join(", ")}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>진로: {major.careerPaths.join(", ")}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Jobs */}
          {personalizedResult.jobs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-500" />
                맞춤 추천 직업
              </h2>
              <div className="space-y-4">
                {personalizedResult.jobs.map((job, i) => (
                  <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${getScoreBg(job.matchScore)}`}>
                            {i + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-base">{job.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-xs">{job.field}</Badge>
                              <Badge className={getDemandColor(job.growth)}>성장성 {job.growth}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xl font-bold ${getScoreColor(job.matchScore)}`}>{job.matchScore}%</span>
                          <p className="text-xs text-muted-foreground">적합도</p>
                        </div>
                      </div>
                      <Progress value={job.matchScore} className="h-1.5" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{job.reason}</p>
                      <div className="p-3 rounded-lg bg-blue-50/70 text-xs text-blue-800">
                        <Target className="h-3.5 w-3.5 inline mr-1.5 text-blue-500" />
                        <strong>근무 환경:</strong> {job.workEnvironment}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                        <div className="flex items-start gap-1.5">
                          <Star className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>필요 역량: {job.requiredSkills.join(", ")}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>연봉: {job.salary}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Study Plan */}
          {personalizedResult.studyPlan && (
            <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-emerald-500" />
                  맞춤 학습 플랜
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl bg-white/60 space-y-2">
                    <p className="text-xs font-medium text-emerald-600">집중 과목</p>
                    <div className="flex flex-wrap gap-1">
                      {personalizedResult.studyPlan.focusSubjects.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-white">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/60 space-y-2">
                    <p className="text-xs font-medium text-teal-600">추천 활동</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {personalizedResult.studyPlan.activities.map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 text-emerald-500 shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 rounded-xl bg-white/60 space-y-2">
                    <p className="text-xs font-medium text-cyan-600">타임라인</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{personalizedResult.studyPlan.timeline}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => { setPersonalizedResult(null); setFormStep(1); }} className="rounded-xl">
              다시 분석하기
            </Button>
            <Button variant="outline" onClick={resetToKeyword} className="rounded-xl">
              전체 목록으로 돌아가기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
