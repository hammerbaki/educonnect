import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Send, X, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const CATEGORIES = [
  { value: "입시정보", label: "입시정보" },
  { value: "학습질문", label: "학습질문" },
  { value: "전공탐색", label: "전공탐색" },
  { value: "자유게시판", label: "자유게시판" },
  { value: "합격수기", label: "합격수기" },
];

export default function CommunityWrite() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const editId = searchParams.get("edit");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("자유게시판");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Load existing post for editing
  const { data: existingPost } = trpc.community.post.useQuery(
    { id: Number(editId) },
    { enabled: !!editId }
  );

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setContent(existingPost.content);
      setCategory(existingPost.category);
      setTags((existingPost.tags as string[]) || []);
    }
  }, [existingPost]);

  const utils = trpc.useUtils();

  const createMutation = trpc.community.create.useMutation({
    onSuccess: () => {
      toast.success("게시글이 등록되었습니다.");
      utils.community.posts.invalidate();
      setLocation("/community");
    },
    onError: (err) => toast.error(err.message || "게시글 등록에 실패했습니다."),
  });

  const updateMutation = trpc.community.update.useMutation({
    onSuccess: () => {
      toast.success("게시글이 수정되었습니다.");
      utils.community.posts.invalidate();
      if (editId) utils.community.post.invalidate({ id: Number(editId) });
      setLocation(editId ? `/community/post/${editId}` : "/community");
    },
    onError: (err) => toast.error(err.message || "게시글 수정에 실패했습니다."),
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.error("내용을 입력해주세요.");
      return;
    }

    if (editId) {
      updateMutation.mutate({
        id: Number(editId),
        title,
        content,
        category: category as any,
        tags,
      });
    } else {
      createMutation.mutate({
        title,
        content,
        category: category as any,
        tags,
      });
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4 p-6">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-muted-foreground mb-4">
          글을 작성하려면 로그인이 필요합니다.
        </p>
        <Button
          onClick={() => {
            window.location.href = getLoginUrl();
          }}
          className="rounded-xl"
        >
          로그인하기
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
        onClick={() => setLocation("/community")}
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Button>

      <Card className="border-0 shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">
            {editId ? "게시글 수정" : "새 글 작성"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">카테고리</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-xl bg-muted/20 border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">제목</Label>
            <Input
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl bg-muted/20 border-0 focus-visible:ring-1"
              maxLength={200}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">내용</Label>
            <Textarea
              placeholder="내용을 입력하세요. 마크다운 형식을 지원합니다."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[300px] rounded-xl bg-muted/20 border-0 focus-visible:ring-1 resize-y"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              태그 (최대 5개)
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="태그를 입력하고 Enter 또는 추가 버튼"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="rounded-xl bg-muted/20 border-0 focus-visible:ring-1"
                maxLength={20}
              />
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl shrink-0"
                onClick={addTag}
                disabled={tags.length >= 5}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs gap-1 pr-1"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setLocation("/community")}
            >
              취소
            </Button>
            <Button
              className="gap-2 rounded-xl"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Send className="h-4 w-4" />
              {editId ? "수정하기" : "등록하기"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
