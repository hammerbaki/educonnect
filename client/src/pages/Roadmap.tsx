import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Target, CalendarDays, Trash2, CheckCircle2, Clock, Circle, Map, Download, Bell, BellOff, Settings2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Roadmap() {
  const { data: goals } = trpc.roadmap.list.useQuery();
  const { data: ddayEvents, refetch: refetchDday } = trpc.dday.list.useQuery();
  const { data: alerts } = trpc.dday.alerts.useQuery();
  const utils = trpc.useUtils();

  const createGoal = trpc.roadmap.create.useMutation({
    onSuccess: () => { utils.roadmap.list.invalidate(); toast.success("목표가 추가되었습니다"); setGoalDialogOpen(false); },
  });
  const updateGoal = trpc.roadmap.update.useMutation({
    onSuccess: () => { utils.roadmap.list.invalidate(); toast.success("목표가 수정되었습니다"); },
  });
  const deleteGoal = trpc.roadmap.delete.useMutation({
    onSuccess: () => { utils.roadmap.list.invalidate(); toast.success("목표가 삭제되었습니다"); },
  });
  const createDday = trpc.dday.create.useMutation({
    onSuccess: () => { utils.dday.list.invalidate(); utils.dday.alerts.invalidate(); toast.success("D-Day가 추가되었습니다"); setDdayDialogOpen(false); resetNewDday(); },
  });
  const deleteDday = trpc.dday.delete.useMutation({
    onSuccess: () => { utils.dday.list.invalidate(); utils.dday.alerts.invalidate(); toast.success("D-Day가 삭제되었습니다"); },
  });
  const updateDday = trpc.dday.update.useMutation({
    onSuccess: () => { utils.dday.list.invalidate(); utils.dday.alerts.invalidate(); },
  });
  const addPresets = trpc.dday.addPresets.useMutation({
    onSuccess: (data) => {
      utils.dday.list.invalidate();
      utils.dday.alerts.invalidate();
      if (data && data.added > 0) {
        toast.success(`${data.added}개의 주요 입시 일정이 등록되었습니다`);
      } else {
        toast.info("이미 모든 프리셋 일정이 등록되어 있습니다");
      }
    },
    onError: () => {
      toast.error("프리셋 일정 추가에 실패했습니다");
    },
  });

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [ddayDialogOpen, setDdayDialogOpen] = useState(false);
  const [editingDday, setEditingDday] = useState<number | null>(null);
  const [newGoal, setNewGoal] = useState({ title: "", description: "", category: "학업" as const, priority: "보통" as const, dueDate: "" });
  const [newDday, setNewDday] = useState({ title: "", eventDate: "", category: "기타" as const, alertEnabled: 1, alertDaysBefore: 7, memo: "" });

  const resetNewDday = () => setNewDday({ title: "", eventDate: "", category: "기타" as const, alertEnabled: 1, alertDaysBefore: 7, memo: "" });

  const completed = goals?.filter((g) => g.status === "완료").length || 0;
  const total = goals?.length || 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const getDday = (eventDate: Date | string) => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const target = new Date(eventDate); target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "D-Day";
    if (diff > 0) return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
  };

  const getDdayDiff = (eventDate: Date | string) => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const target = new Date(eventDate); target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyBadge = (diff: number) => {
    if (diff <= 0) return "bg-red-500 text-white";
    if (diff <= 7) return "bg-orange-500 text-white";
    if (diff <= 30) return "bg-amber-500 text-white";
    return "bg-primary text-white";
  };

  const getUrgencyBorder = (diff: number) => {
    if (diff <= 0) return "border-l-red-500";
    if (diff <= 7) return "border-l-orange-500";
    if (diff <= 30) return "border-l-amber-500";
    return "border-l-primary";
  };

  const statusIcon = (status: string) => {
    if (status === "완료") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (status === "진행중") return <Clock className="h-4 w-4 text-primary" />;
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  const priorityColor = (p: string) => {
    if (p === "높음") return "bg-red-100 text-red-700";
    if (p === "보통") return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  };

  const categoryColor = (c: string) => {
    if (c === "수능") return "bg-red-100 text-red-700";
    if (c === "수시") return "bg-blue-100 text-blue-700";
    if (c === "정시") return "bg-purple-100 text-purple-700";
    if (c === "모의고사") return "bg-amber-100 text-amber-700";
    return "bg-gray-100 text-gray-700";
  };

  // Sort D-Day events: upcoming first, then by proximity
  const sortedDdayEvents = [...(ddayEvents || [])].sort((a, b) => {
    const diffA = getDdayDiff(a.eventDate);
    const diffB = getDdayDiff(b.eventDate);
    if (diffA >= 0 && diffB < 0) return -1;
    if (diffA < 0 && diffB >= 0) return 1;
    return Math.abs(diffA) - Math.abs(diffB);
  });

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">입시/진로 로드맵</h1>
          <p className="text-sm text-muted-foreground mt-1">목표를 설정하고 체계적으로 관리하세요</p>
        </div>
      </div>

      {/* Alert Summary */}
      {alerts && alerts.length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <p className="text-sm font-semibold text-orange-700">다가오는 일정 알림</p>
              <Badge variant="secondary" className="text-xs">{alerts.length}건</Badge>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between bg-white/60 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Bell className={`h-3.5 w-3.5 shrink-0 ${alert.daysUntil <= 3 ? "text-red-500" : "text-orange-500"}`} />
                    <span className="text-sm truncate">{alert.title}</span>
                  </div>
                  <Badge className={`shrink-0 ${getUrgencyBadge(alert.daysUntil)}`}>
                    {alert.daysUntil === 0 ? "오늘!" : `${alert.daysUntil}일 전`}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Overview */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-pastel-blue-light/20 to-pastel-pink-light/10">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">전체 진행률</p>
            <span className="text-sm font-bold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2.5" />
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span>전체 {total}개</span>
            <span>완료 {completed}개</span>
            <span>진행중 {goals?.filter((g) => g.status === "진행중").length || 0}개</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="goals">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="goals" className="gap-1.5">
            <Target className="h-4 w-4" />
            목표 관리
          </TabsTrigger>
          <TabsTrigger value="dday" className="gap-1.5">
            <CalendarDays className="h-4 w-4" />
            D-Day 관리
          </TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-xl">
                  <Plus className="mr-2 h-4 w-4" />
                  목표 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 목표 추가</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>목표 제목</Label>
                    <Input value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="예: 수학 내신 1등급 달성" className="mt-1" />
                  </div>
                  <div>
                    <Label>설명</Label>
                    <Textarea value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} placeholder="목표에 대한 상세 설명..." className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>카테고리</Label>
                      <Select value={newGoal.category} onValueChange={(v: any) => setNewGoal({ ...newGoal, category: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["학업", "비교과", "입시", "자기개발", "기타"].map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>우선순위</Label>
                      <Select value={newGoal.priority} onValueChange={(v: any) => setNewGoal({ ...newGoal, priority: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["높음", "보통", "낮음"].map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>마감일</Label>
                    <Input type="date" value={newGoal.dueDate} onChange={(e) => setNewGoal({ ...newGoal, dueDate: e.target.value })} className="mt-1" />
                  </div>
                  <Button onClick={() => createGoal.mutate(newGoal)} disabled={!newGoal.title || createGoal.isPending} className="w-full rounded-xl">
                    {createGoal.isPending ? "추가 중..." : "목표 추가"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {goals && goals.length > 0 ? (
              goals.map((goal) => (
                <Card key={goal.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <button
                        className="mt-0.5 shrink-0"
                        onClick={() => {
                          const nextStatus = goal.status === "예정" ? "진행중" : goal.status === "진행중" ? "완료" : "예정";
                          updateGoal.mutate({ id: goal.id, status: nextStatus });
                        }}
                      >
                        {statusIcon(goal.status)}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-medium text-sm ${goal.status === "완료" ? "line-through text-muted-foreground" : ""}`}>
                            {goal.title}
                          </p>
                          <Badge variant="outline" className="text-xs">{goal.category}</Badge>
                          <Badge className={`text-xs ${priorityColor(goal.priority || "보통")}`}>{goal.priority}</Badge>
                        </div>
                        {goal.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{goal.description}</p>
                        )}
                        {goal.dueDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            마감: {new Date(goal.dueDate).toLocaleDateString("ko-KR")}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteGoal.mutate({ id: goal.id })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Map className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">아직 등록된 목표가 없어요</p>
                <p className="text-xs text-muted-foreground mt-1">첫 번째 목표를 추가해 보세요!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="dday" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5"
              onClick={() => addPresets.mutate()}
              disabled={addPresets.isPending}
            >
              <Download className="h-4 w-4" />
              {addPresets.isPending ? "등록 중..." : "주요 입시 일정 자동 등록"}
            </Button>
            <Dialog open={ddayDialogOpen} onOpenChange={(open) => { setDdayDialogOpen(open); if (!open) resetNewDday(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-xl">
                  <Plus className="mr-2 h-4 w-4" />
                  D-Day 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 D-Day 추가</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>이벤트 이름</Label>
                    <Input value={newDday.title} onChange={(e) => setNewDday({ ...newDday, title: e.target.value })} placeholder="예: 2027학년도 수능" className="mt-1" />
                  </div>
                  <div>
                    <Label>날짜</Label>
                    <Input type="date" value={newDday.eventDate} onChange={(e) => setNewDday({ ...newDday, eventDate: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>카테고리</Label>
                    <Select value={newDday.category} onValueChange={(v: any) => setNewDday({ ...newDday, category: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["수능", "수시", "정시", "모의고사", "기타"].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3 p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm">알림 설정</Label>
                      </div>
                      <Switch
                        checked={newDday.alertEnabled === 1}
                        onCheckedChange={(checked) => setNewDday({ ...newDday, alertEnabled: checked ? 1 : 0 })}
                      />
                    </div>
                    {newDday.alertEnabled === 1 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">며칠 전부터 알림</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="number"
                            min={1}
                            max={365}
                            value={newDday.alertDaysBefore}
                            onChange={(e) => setNewDday({ ...newDday, alertDaysBefore: Math.max(1, Math.min(365, parseInt(e.target.value) || 7)) })}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">일 전</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>메모 (선택)</Label>
                    <Textarea
                      value={newDday.memo}
                      onChange={(e) => setNewDday({ ...newDday, memo: e.target.value })}
                      placeholder="추가 메모..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  <Button
                    onClick={() => createDday.mutate(newDday)}
                    disabled={!newDday.title || !newDday.eventDate || createDday.isPending}
                    className="w-full rounded-xl"
                  >
                    {createDday.isPending ? "추가 중..." : "D-Day 추가"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {sortedDdayEvents.length > 0 ? (
              sortedDdayEvents.map((event) => {
                const diff = getDdayDiff(event.eventDate);
                const isEditing = editingDday === event.id;
                return (
                  <Card key={event.id} className={`border-0 shadow-sm border-l-4 ${getUrgencyBorder(diff)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {diff <= 7 && diff >= 0 && (
                              <AlertTriangle className={`h-4 w-4 shrink-0 ${diff <= 3 ? "text-red-500" : "text-orange-500"}`} />
                            )}
                            <p className="font-medium text-sm">{event.title}</p>
                            <Badge className={`text-xs ${categoryColor(event.category || "기타")}`}>
                              {event.category}
                            </Badge>
                            {(event as any).isPreset === 1 && (
                              <Badge variant="outline" className="text-xs">프리셋</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(event.eventDate).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
                          </p>
                          {(event as any).memo && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{(event as any).memo}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={`font-bold ${getUrgencyBadge(diff)}`}>
                            {getDday(event.eventDate)}
                          </Badge>
                        </div>
                      </div>

                      {/* Alert Settings Row */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-3">
                          <button
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => {
                              const newEnabled = (event as any).alertEnabled === 1 ? 0 : 1;
                              updateDday.mutate({ id: event.id, alertEnabled: newEnabled });
                              toast.success(newEnabled ? "알림이 켜졌습니다" : "알림이 꺼졌습니다");
                            }}
                          >
                            {(event as any).alertEnabled === 1 ? (
                              <Bell className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <BellOff className="h-3.5 w-3.5" />
                            )}
                            <span>{(event as any).alertEnabled === 1 ? `${(event as any).alertDaysBefore || 7}일 전 알림` : "알림 꺼짐"}</span>
                          </button>
                          {(event as any).alertEnabled === 1 && (
                            <button
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => setEditingDday(isEditing ? null : event.id)}
                            >
                              <Settings2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteDday.mutate({ id: event.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Inline Alert Settings Editor */}
                      {isEditing && (
                        <div className="mt-3 p-3 rounded-lg bg-muted/30 space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs whitespace-nowrap">알림 시점:</Label>
                            <Input
                              type="number"
                              min={1}
                              max={365}
                              defaultValue={(event as any).alertDaysBefore || 7}
                              className="w-20 h-8 text-xs"
                              onBlur={(e) => {
                                const val = Math.max(1, Math.min(365, parseInt(e.target.value) || 7));
                                updateDday.mutate({ id: event.id, alertDaysBefore: val });
                                toast.success(`알림이 ${val}일 전으로 설정되었습니다`);
                                setEditingDday(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                            />
                            <span className="text-xs text-muted-foreground">일 전</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12">
                <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">등록된 D-Day가 없어요</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">주요 입시 일정을 자동으로 등록해 보세요!</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5"
                  onClick={() => addPresets.mutate()}
                  disabled={addPresets.isPending}
                >
                  <Download className="h-4 w-4" />
                  {addPresets.isPending ? "등록 중..." : "주요 입시 일정 자동 등록"}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
