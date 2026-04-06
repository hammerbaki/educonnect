import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Heart,
  Eye,
  Plus,
  Search,
  TrendingUp,
  Clock,
  Pin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "입시정보", label: "입시정보" },
  { value: "학습질문", label: "학습질문" },
  { value: "전공탐색", label: "전공탐색" },
  { value: "자유게시판", label: "자유게시판" },
  { value: "합격수기", label: "합격수기" },
];

const CATEGORY_COLORS: Record<string, string> = {
  입시정보: "bg-blue-50 text-blue-700 border-blue-200",
  학습질문: "bg-emerald-50 text-emerald-700 border-emerald-200",
  전공탐색: "bg-violet-50 text-violet-700 border-violet-200",
  자유게시판: "bg-gray-50 text-gray-600 border-gray-200",
  합격수기: "bg-amber-50 text-amber-700 border-amber-200",
};

function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function Community() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  const queryInput = useMemo(
    () => ({
      category: category === "all" ? undefined : category,
      search: searchQuery || undefined,
      sort,
      page,
      limit,
    }),
    [category, searchQuery, sort, page, limit]
  );

  const { data, isLoading } = trpc.community.posts.useQuery(queryInput);
  const { data: popularPosts } = trpc.community.popular.useQuery({ limit: 5 });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">커뮤니티</h1>
          <p className="text-sm text-muted-foreground mt-1">
            입시 정보를 공유하고, 함께 성장하는 공간
          </p>
        </div>
        {user && (
          <Button
            onClick={() => setLocation("/community/write")}
            className="gap-2 rounded-xl shadow-sm"
          >
            <Plus className="h-4 w-4" />
            글쓰기
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Category Tabs */}
          <Tabs
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
          >
            <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
              {CATEGORIES.map((cat) => (
                <TabsTrigger
                  key={cat.value}
                  value={cat.value}
                  className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Search & Sort */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="검색어를 입력하세요..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 rounded-xl bg-muted/30 border-0 focus-visible:ring-1"
              />
            </div>
            <Select
              value={sort}
              onValueChange={(v) => setSort(v as "latest" | "popular")}
            >
              <SelectTrigger className="w-[120px] rounded-xl bg-muted/30 border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    최신순
                  </span>
                </SelectItem>
                <SelectItem value="popular">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    인기순
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Posts List */}
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : data?.posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">아직 게시글이 없습니다</p>
                  {user && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 rounded-xl"
                      onClick={() => setLocation("/community/write")}
                    >
                      첫 글을 작성해 보세요
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {data?.posts.map((post) => (
                    <button
                      key={post.id}
                      className="w-full text-left px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() =>
                        setLocation(`/community/post/${post.id}`)
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            {post.isPinned ? (
                              <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
                            ) : null}
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 font-normal ${CATEGORY_COLORS[post.category] || ""}`}
                            >
                              {post.category}
                            </Badge>
                          </div>
                          <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {post.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {post.content.replace(/<[^>]*>/g, "").slice(0, 100)}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{post.authorName || "익명"}</span>
                            <span>{timeAgo(post.createdAt)}</span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.viewCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {post.likeCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {post.commentCount}
                            </span>
                          </div>
                          {/* Tags */}
                          {post.tags &&
                            (post.tags as string[]).length > 0 && (
                              <div className="flex gap-1.5 mt-2 flex-wrap">
                                {(post.tags as string[]).slice(0, 3).map(
                                  (tag, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded"
                                    >
                                      #{tag}
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 rounded-lg text-xs"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar - Popular Posts */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                인기 게시글
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {popularPosts && popularPosts.length > 0 ? (
                <div className="space-y-3">
                  {popularPosts.map((post, idx) => (
                    <button
                      key={post.id}
                      className="w-full text-left group cursor-pointer"
                      onClick={() =>
                        setLocation(`/community/post/${post.id}`)
                      }
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-xs font-bold text-primary/70 mt-0.5 w-4 shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-relaxed">
                            {post.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <Heart className="h-2.5 w-2.5" />
                              {post.likeCount}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <MessageSquare className="h-2.5 w-2.5" />
                              {post.commentCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  아직 인기 게시글이 없습니다
                </p>
              )}
            </CardContent>
          </Card>

          {/* Category Stats */}
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                게시판 카테고리
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1.5">
              {CATEGORIES.filter((c) => c.value !== "all").map((cat) => (
                <button
                  key={cat.value}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  onClick={() => {
                    setCategory(cat.value);
                    setPage(1);
                  }}
                >
                  <span className="text-xs font-medium">{cat.label}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[cat.value] || ""}`}
                  >
                    {cat.value === category ? "선택됨" : "보기"}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
