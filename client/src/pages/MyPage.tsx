import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { UserCircle, School, BookOpen, Target, Save, Loader2, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const allSubjects = [
  "국어", "수학", "영어", "한국사", "사회", "역사", "지리",
  "물리", "화학", "생명과학", "지구과학", "정보", "미술", "음악", "체육",
];

const interestOptions = [
  "인문/사회", "자연과학", "공학/IT", "의약/보건", "예술/디자인",
  "교육", "경영/경제", "법학", "미디어/언론", "환경/에너지",
];

export default function MyPage() {
  const { user, logout } = useAuth();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const utils = trpc.useUtils();

  const upsertProfile = trpc.profile.upsert.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      toast.success("프로필이 저장되었습니다");
    },
  });

  const [grade, setGrade] = useState<string>("3");
  const [school, setSchool] = useState("");
  const [gpa, setGpa] = useState("");
  const [admissionType, setAdmissionType] = useState<string>("미정");
  const [favoriteSubjects, setFavoriteSubjects] = useState<string[]>([]);
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [interestAreas, setInterestAreas] = useState<string[]>([]);
  const [targetUniversities, setTargetUniversities] = useState<string[]>([]);
  const [targetMajors, setTargetMajors] = useState<string[]>([]);
  const [newUni, setNewUni] = useState("");
  const [newMajor, setNewMajor] = useState("");

  useEffect(() => {
    if (profile) {
      setGrade(profile.grade || "3");
      setSchool(profile.school || "");
      setGpa(profile.gpa || "");
      setAdmissionType(profile.admissionType || "미정");
      setFavoriteSubjects((profile.favoriteSubjects as string[]) || []);
      setWeakSubjects((profile.weakSubjects as string[]) || []);
      setInterestAreas((profile.interestAreas as string[]) || []);
      setTargetUniversities((profile.targetUniversities as string[]) || []);
      setTargetMajors((profile.targetMajors as string[]) || []);
    }
  }, [profile]);

  const handleSave = () => {
    upsertProfile.mutate({
      grade: grade as "1" | "2" | "3",
      school,
      gpa,
      admissionType: admissionType as "수시" | "정시" | "미정",
      favoriteSubjects,
      weakSubjects,
      interestAreas,
      targetUniversities,
      targetMajors,
    });
  };

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const addToList = (list: string[], setList: (v: string[]) => void, value: string, reset: () => void) => {
    if (value.trim() && !list.includes(value.trim())) {
      setList([...list, value.trim()]);
      reset();
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <p className="text-sm text-muted-foreground mt-1">프로필 정보를 관리하세요</p>
      </div>

      {/* User Info */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 bg-pastel-blue-light">
              <AvatarFallback className="text-xl font-bold bg-pastel-blue-light text-primary">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold">{user?.name || "사용자"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <School className="h-4 w-4 text-primary" />
            기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>학년</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1학년</SelectItem>
                  <SelectItem value="2">2학년</SelectItem>
                  <SelectItem value="3">3학년</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>학교</Label>
              <Input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="예: OO고등학교" className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>내신 등급 (평균)</Label>
              <Input value={gpa} onChange={(e) => setGpa(e.target.value)} placeholder="예: 2.3" className="mt-1" />
            </div>
            <div>
              <Label>전형 유형</Label>
              <Select value={admissionType} onValueChange={setAdmissionType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="수시">수시</SelectItem>
                  <SelectItem value="정시">정시</SelectItem>
                  <SelectItem value="미정">미정</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            과목 정보
          </CardTitle>
          <CardDescription>좋아하는 과목과 약한 과목을 선택하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">좋아하는 과목</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {allSubjects.map((subj) => (
                <Button
                  key={`fav-${subj}`}
                  variant={favoriteSubjects.includes(subj) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleItem(favoriteSubjects, setFavoriteSubjects, subj)}
                  className="rounded-full text-xs h-8"
                >
                  {subj}
                </Button>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <Label className="text-sm font-medium">약한 과목</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {allSubjects.map((subj) => (
                <Button
                  key={`weak-${subj}`}
                  variant={weakSubjects.includes(subj) ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => toggleItem(weakSubjects, setWeakSubjects, subj)}
                  className="rounded-full text-xs h-8"
                >
                  {subj}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interest Areas */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            관심 분야 및 목표
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">관심 분야</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {interestOptions.map((area) => (
                <Button
                  key={area}
                  variant={interestAreas.includes(area) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleItem(interestAreas, setInterestAreas, area)}
                  className="rounded-full text-xs h-8"
                >
                  {area}
                </Button>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <Label className="text-sm font-medium">목표 대학</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {targetUniversities.map((uni) => (
                <Badge key={uni} variant="secondary" className="gap-1 pr-1">
                  {uni}
                  <button onClick={() => setTargetUniversities(targetUniversities.filter((u) => u !== uni))} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input value={newUni} onChange={(e) => setNewUni(e.target.value)} placeholder="대학 이름 입력" className="flex-1" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addToList(targetUniversities, setTargetUniversities, newUni, () => setNewUni("")); } }} />
              <Button variant="outline" size="icon" onClick={() => addToList(targetUniversities, setTargetUniversities, newUni, () => setNewUni(""))}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">목표 학과</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {targetMajors.map((m) => (
                <Badge key={m} variant="secondary" className="gap-1 pr-1">
                  {m}
                  <button onClick={() => setTargetMajors(targetMajors.filter((x) => x !== m))} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input value={newMajor} onChange={(e) => setNewMajor(e.target.value)} placeholder="학과 이름 입력" className="flex-1" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addToList(targetMajors, setTargetMajors, newMajor, () => setNewMajor("")); } }} />
              <Button variant="outline" size="icon" onClick={() => addToList(targetMajors, setTargetMajors, newMajor, () => setNewMajor(""))}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3 pb-8">
        <Button onClick={handleSave} disabled={upsertProfile.isPending} className="flex-1 rounded-xl">
          {upsertProfile.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" />프로필 저장</>
          )}
        </Button>
        <Button variant="outline" onClick={logout} className="rounded-xl">
          로그아웃
        </Button>
      </div>
    </div>
  );
}
