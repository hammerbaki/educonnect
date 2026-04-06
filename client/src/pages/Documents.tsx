import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Trash2, Sparkles, Loader2, ArrowLeft, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function Documents() {
  const { data: documents } = trpc.document.list.useQuery();
  const utils = trpc.useUtils();

  const createDoc = trpc.document.create.useMutation({
    onSuccess: () => { utils.document.list.invalidate(); toast.success("서류가 생성되었습니다"); setCreateOpen(false); },
  });
  const updateDoc = trpc.document.update.useMutation({
    onSuccess: () => { utils.document.list.invalidate(); utils.document.get.invalidate(); toast.success("저장되었습니다"); },
  });
  const deleteDoc = trpc.document.delete.useMutation({
    onSuccess: () => { utils.document.list.invalidate(); setSelectedDocId(null); toast.success("삭제되었습니다"); },
  });
  const aiGuide = trpc.document.aiGuide.useMutation({
    onSuccess: (data) => {
      const text = typeof data === "string" ? data : "";
      setAiResult(text);
      if (selectedDocId) {
        updateDoc.mutate({ id: selectedDocId, aiSuggestion: text });
      }
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [newDoc, setNewDoc] = useState({ title: "", docType: "자기소개서" as const, content: "" });
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [aiResult, setAiResult] = useState<string>("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");

  const selectedDoc = documents?.find((d) => d.id === selectedDocId);

  const handleSelectDoc = (id: number) => {
    const doc = documents?.find((d) => d.id === id);
    if (doc) {
      setSelectedDocId(id);
      setEditContent(doc.content || "");
      setEditTitle(doc.title);
      setAiResult(doc.aiSuggestion || "");
    }
  };

  const handleSave = () => {
    if (selectedDocId) {
      updateDoc.mutate({ id: selectedDocId, title: editTitle, content: editContent });
    }
  };

  const handleAiGuide = () => {
    if (!editContent.trim()) {
      toast.error("내용을 먼저 작성해주세요");
      return;
    }
    aiGuide.mutate({
      docType: (selectedDoc?.docType as "자기소개서" | "생기부분석" | "학업계획서") || "자기소개서",
      content: editContent,
      university: university || undefined,
      major: major || undefined,
    });
  };

  // Detail View
  if (selectedDocId && selectedDoc) {
    return (
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedDocId(null)} className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-lg font-bold border-0 px-0 shadow-none focus-visible:ring-0 h-auto"
            />
            <Badge variant="outline" className="text-xs mt-1">{selectedDoc.docType}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={updateDoc.isPending} className="rounded-xl">
            {updateDoc.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "저장"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                내용 작성
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="자기소개서 / 학업계획서 내용을 작성하세요..."
                className="min-h-[400px] resize-none"
              />
              <div className="flex gap-2 mt-4">
                <Input placeholder="지원 대학 (선택)" value={university} onChange={(e) => setUniversity(e.target.value)} className="flex-1" />
                <Input placeholder="지원 학과 (선택)" value={major} onChange={(e) => setMajor(e.target.value)} className="flex-1" />
              </div>
              <Button onClick={handleAiGuide} disabled={aiGuide.isPending} className="w-full mt-3 rounded-xl">
                {aiGuide.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />AI 분석 중...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" />AI 첨삭 가이드 받기</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* AI Suggestion */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI 첨삭 가이드
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiResult ? (
                <div className="prose prose-sm max-w-none text-sm">
                  <Streamdown>{aiResult}</Streamdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-pastel-blue-light/50 flex items-center justify-center mb-4">
                    <Sparkles className="h-7 w-7 text-primary/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    내용을 작성한 후 AI 첨삭 가이드를 요청하세요
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI가 전체 평가, 개선 제안, 수정 예시를 제공합니다
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">생기부/자소서 가이드</h1>
          <p className="text-sm text-muted-foreground mt-1">AI가 도와주는 입시 서류 작성 가이드</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              새 서류
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 서류 작성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>제목</Label>
                <Input value={newDoc.title} onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })} placeholder="예: 서울대 자기소개서 1번" className="mt-1" />
              </div>
              <div>
                <Label>유형</Label>
                <Select value={newDoc.docType} onValueChange={(v: any) => setNewDoc({ ...newDoc, docType: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="자기소개서">자기소개서</SelectItem>
                    <SelectItem value="생기부분석">생기부 분석</SelectItem>
                    <SelectItem value="학업계획서">학업계획서</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createDoc.mutate(newDoc)} disabled={!newDoc.title || createDoc.isPending} className="w-full rounded-xl">
                {createDoc.isPending ? "생성 중..." : "서류 생성"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tips */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-pastel-blue-light/20 to-pastel-pink-light/10">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">AI 첨삭 가이드 활용 팁</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              서류 내용을 작성한 후 AI 첨삭 가이드를 요청하면, 전체 평가와 구체적인 개선 제안, 수정 예시 문장을 받을 수 있습니다.
              지원 대학과 학과를 입력하면 더 정확한 피드백을 받을 수 있어요.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      <div className="space-y-3">
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <Card key={doc.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSelectDoc(doc.id)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{doc.docType}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.updatedAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {doc.aiSuggestion && (
                    <Badge className="text-xs bg-pastel-blue-light text-primary">AI 첨삭 완료</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteDoc.mutate({ id: doc.id }); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">아직 작성한 서류가 없어요</p>
            <p className="text-xs text-muted-foreground mt-1">새 서류를 추가하여 AI 첨삭 가이드를 받아보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
