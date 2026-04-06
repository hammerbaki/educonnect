import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, GraduationCap, Briefcase, BookOpen, TrendingUp, Sparkles, Loader2, ArrowRight } from "lucide-react";
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

type SemanticResult = {
  majors: Array<{
    name: string;
    category: string;
    matchScore: number;
    reason: string;
    jobs: string[];
    subjects: string[];
    demand: string;
    desc: string;
  }>;
  jobs: Array<{
    name: string;
    field: string;
    matchScore: number;
    reason: string;
    relatedMajors: string[];
    salary: string;
    growth: string;
    desc: string;
  }>;
  summary: string;
};

export default function Explore() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic">("keyword");
  const [semanticResult, setSemanticResult] = useState<SemanticResult | null>(null);

  const semanticSearch = trpc.explore.semanticSearch.useMutation({
    onSuccess: (data) => {
      setSemanticResult(data as SemanticResult);
    },
    onError: (err) => {
      toast.error(err.message || "AI 검색에 실패했습니다.");
    },
  });

  const handleSemanticSearch = () => {
    if (!searchTerm.trim()) {
      toast.error("검색어를 입력해주세요.");
      return;
    }
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
    if (e.key === "Enter" && searchTerm.trim()) {
      handleSemanticSearch();
    }
  };

  const filteredMajors = useMemo(() => {
    if (searchMode === "semantic") return [];
    return majorsData.filter((m) => {
      const matchCategory = selectedCategory === "all" || m.category === selectedCategory;
      const matchSearch = !searchTerm || m.name.includes(searchTerm) || m.desc.includes(searchTerm) || m.jobs.some((j) => j.includes(searchTerm));
      return matchCategory && matchSearch;
    });
  }, [searchTerm, selectedCategory, searchMode]);

  const filteredJobs = useMemo(() => {
    if (searchMode === "semantic") return [];
    return jobsData.filter((j) => {
      return !searchTerm || j.name.includes(searchTerm) || j.field.includes(searchTerm) || j.desc.includes(searchTerm);
    });
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

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">학과/직업 탐색</h1>
        <p className="text-sm text-muted-foreground mt-1">
          키워드 검색은 물론, AI 의미 검색으로 관심사에 맞는 학과와 직업을 찾아보세요
        </p>
      </div>

      {/* Search */}
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
            {semanticSearch.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            AI 검색
          </Button>
        </div>

        {/* Suggested queries */}
        {!searchTerm && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground py-1">추천 질문:</span>
            {suggestedQueries.map((q) => (
              <button
                key={q}
                onClick={() => handleSuggestedQuery(q)}
                className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Semantic Search Results */}
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
              {/* Summary */}
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

              {/* AI Recommended Majors */}
              {semanticResult.majors.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-500" />
                    추천 학과
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {semanticResult.majors.map((major, i) => (
                      <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-base">{major.name}</h3>
                                <span className={`text-sm font-bold ${getScoreColor(major.matchScore)}`}>
                                  {major.matchScore}%
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {major.category}계열
                              </Badge>
                            </div>
                            <Badge className={`text-xs ${getDemandColor(major.demand)}`}>
                              수요 {major.demand}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{major.desc}</p>
                          <div className="p-2.5 rounded-lg bg-blue-50/50 text-xs text-blue-700">
                            <ArrowRight className="h-3 w-3 inline mr-1" />
                            {major.reason}
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <BookOpen className="h-3.5 w-3.5" />
                              <span>관련 과목: {major.subjects.join(", ")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Briefcase className="h-3.5 w-3.5" />
                              <span>관련 직업: {major.jobs.join(", ")}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Recommended Jobs */}
              {semanticResult.jobs.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-indigo-500" />
                    추천 직업
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {semanticResult.jobs.map((job, i) => (
                      <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-base">{job.name}</h3>
                                <span className={`text-sm font-bold ${getScoreColor(job.matchScore)}`}>
                                  {job.matchScore}%
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {job.field}
                              </Badge>
                            </div>
                            <Badge className={getDemandColor(job.growth)}>
                              성장성 {job.growth}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{job.desc}</p>
                          <div className="p-2.5 rounded-lg bg-indigo-50/50 text-xs text-indigo-700">
                            <ArrowRight className="h-3 w-3 inline mr-1" />
                            {job.reason}
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <TrendingUp className="h-3.5 w-3.5" />
                              <span>초봉: {job.salary}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <GraduationCap className="h-3.5 w-3.5" />
                              <span>관련 학과: {job.relatedMajors.join(", ")}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchMode("keyword");
                    setSemanticResult(null);
                    setSearchTerm("");
                  }}
                  className="rounded-xl"
                >
                  전체 목록으로 돌아가기
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Keyword Search Results */}
      {searchMode === "keyword" && (
        <Tabs defaultValue="majors">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="majors" className="gap-1.5">
              <GraduationCap className="h-4 w-4" />
              학과 정보
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-1.5">
              <Briefcase className="h-4 w-4" />
              직업 정보
            </TabsTrigger>
          </TabsList>

          <TabsContent value="majors" className="space-y-4 mt-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {majorCategories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="rounded-full text-xs"
                >
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
                        <Badge variant="outline" className="text-xs mt-1">
                          {major.category}계열
                        </Badge>
                      </div>
                      <Badge className={`text-xs ${getDemandColor(major.demand)}`}>
                        수요 {major.demand}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{major.desc}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>관련 과목: {major.subjects.join(", ")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span>관련 직업: {major.jobs.join(", ")}</span>
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
                        <Badge variant="outline" className="text-xs mt-1">
                          {job.field}
                        </Badge>
                      </div>
                      <Badge className={getDemandColor(job.growth)}>
                        성장성 {job.growth}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{job.desc}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>초봉: {job.salary}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <GraduationCap className="h-3.5 w-3.5" />
                        <span>관련 학과: {job.relatedMajors.join(", ")}</span>
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
    </div>
  );
}
