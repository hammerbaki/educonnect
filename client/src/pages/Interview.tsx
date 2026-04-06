import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Send, Loader2, ArrowLeft, Award, Clock, User, Bot } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function Interview() {
  const { data: sessions } = trpc.interview.list.useQuery();
  const utils = trpc.useUtils();

  const createSession = trpc.interview.create.useMutation({
    onSuccess: (data) => {
      utils.interview.list.invalidate();
      setActiveSessionId(data.id as number);
      setCreateOpen(false);
    },
  });
  const chatMutation = trpc.interview.chat.useMutation({
    onSuccess: () => {
      utils.interview.get.invalidate();
      setUserInput("");
    },
  });
  const feedbackMutation = trpc.interview.feedback.useMutation({
    onSuccess: (data) => {
      const text = typeof data === "string" ? data : "";
      setFeedbackText(text);
      utils.interview.get.invalidate();
      utils.interview.list.invalidate();
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [newSession, setNewSession] = useState({ university: "", major: "", interviewType: "인성면접" as const });
  const [userInput, setUserInput] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: activeSession } = trpc.interview.get.useQuery(
    { id: activeSessionId! },
    { enabled: !!activeSessionId }
  );

  const messages = (activeSession?.messages || []) as { role: string; content: string }[];
  const displayMessages = messages.filter((m) => m.role !== "system");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages.length]);

  const handleSend = () => {
    if (!userInput.trim() || !activeSessionId) return;
    chatMutation.mutate({ sessionId: activeSessionId, message: userInput });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndInterview = () => {
    if (!activeSessionId) return;
    feedbackMutation.mutate({ sessionId: activeSessionId });
  };

  // Active Session View
  if (activeSessionId && activeSession) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => { setActiveSessionId(null); setFeedbackText(""); }} className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h2 className="font-semibold text-base">
              {activeSession.university || "대학"} {activeSession.major || ""} 면접
            </h2>
            <Badge variant="outline" className="text-xs">{activeSession.interviewType}</Badge>
          </div>
          {!feedbackText && !activeSession.feedback && (
            <Button variant="outline" size="sm" onClick={handleEndInterview} disabled={feedbackMutation.isPending} className="rounded-xl">
              {feedbackMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Award className="mr-2 h-4 w-4" />}
              면접 종료 및 평가
            </Button>
          )}
        </div>

        {/* Feedback */}
        {(feedbackText || activeSession.feedback) && (
          <Card className="border-0 shadow-sm bg-gradient-to-r from-pastel-blue-light/20 to-pastel-pink-light/10 shrink-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                면접 평가 결과
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-sm">
                <Streamdown>{feedbackText || (typeof activeSession.feedback === "string" ? activeSession.feedback : "") || ""}</Streamdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Messages */}
        <Card className="border-0 shadow-sm flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {displayMessages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-pastel-blue-light flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted/60 rounded-bl-md"
                  }`}>
                    {msg.role === "assistant" ? (
                      <Streamdown>{msg.content}</Streamdown>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-pastel-pink-light flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-pink-600" />
                    </div>
                  )}
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pastel-blue-light flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted/60 p-3 rounded-2xl rounded-bl-md">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          {!feedbackText && !activeSession.feedback && (
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="답변을 입력하세요..."
                  disabled={chatMutation.isPending}
                  className="rounded-xl"
                />
                <Button size="icon" onClick={handleSend} disabled={!userInput.trim() || chatMutation.isPending} className="rounded-xl shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // List View
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI 면접 연습</h1>
          <p className="text-sm text-muted-foreground mt-1">AI 면접관과 실전처럼 연습하세요</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              새 면접
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 면접 세션</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>지원 대학</Label>
                <Input value={newSession.university} onChange={(e) => setNewSession({ ...newSession, university: e.target.value })} placeholder="예: 서울대학교" className="mt-1" />
              </div>
              <div>
                <Label>지원 학과</Label>
                <Input value={newSession.major} onChange={(e) => setNewSession({ ...newSession, major: e.target.value })} placeholder="예: 컴퓨터공학과" className="mt-1" />
              </div>
              <div>
                <Label>면접 유형</Label>
                <Select value={newSession.interviewType} onValueChange={(v: any) => setNewSession({ ...newSession, interviewType: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="심층면접">심층면접</SelectItem>
                    <SelectItem value="인성면접">인성면접</SelectItem>
                    <SelectItem value="제시문면접">제시문면접</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createSession.mutate(newSession)} disabled={createSession.isPending} className="w-full rounded-xl">
                {createSession.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />세션 생성 중...</> : "면접 시작"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Guide Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-pastel-pink-light/20 to-pastel-blue-light/10">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
            <MessageSquare className="h-5 w-5 text-pink-600" />
          </div>
          <div>
            <p className="font-medium text-sm">AI 면접 연습 가이드</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              지원 대학과 학과, 면접 유형을 선택하면 AI 면접관이 실제 면접처럼 질문합니다.
              면접이 끝나면 종합 평가와 구체적인 피드백을 받을 수 있어요.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Session List */}
      <div className="space-y-3">
        {sessions && sessions.length > 0 ? (
          sessions.map((session) => (
            <Card
              key={session.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setActiveSessionId(session.id); setFeedbackText(""); }}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-pastel-pink-light/50 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-5 w-5 text-pink-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {session.university || "대학"} {session.major || ""} 면접
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{session.interviewType}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(session.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  </div>
                </div>
                {session.feedback && (
                  <Badge className="text-xs bg-emerald-100 text-emerald-700 shrink-0">평가 완료</Badge>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">아직 면접 연습 기록이 없어요</p>
            <p className="text-xs text-muted-foreground mt-1">새 면접을 시작해 보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
