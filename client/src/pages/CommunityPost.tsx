import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Heart,
  Eye,
  MessageSquare,
  Trash2,
  Edit,
  Send,
  Clock,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const CATEGORY_COLORS: Record<string, string> = {
  입시정보: "bg-blue-50 text-blue-700 border-blue-200",
  학습질문: "bg-emerald-50 text-emerald-700 border-emerald-200",
  전공탐색: "bg-violet-50 text-violet-700 border-violet-200",
  자유게시판: "bg-gray-50 text-gray-600 border-gray-200",
  합격수기: "bg-amber-50 text-amber-700 border-amber-200",
};

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

export default function CommunityPost() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const postId = Number(params.id);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: post, isLoading } = trpc.community.post.useQuery(
    { id: postId },
    { enabled: !!postId }
  );

  const { data: comments } = trpc.community.comments.useQuery(
    { postId },
    { enabled: !!postId }
  );

  // Get user likes for this post
  const postIds = useMemo(() => (post ? [post.id] : []), [post]);
  const { data: userPostLikes } = trpc.community.userLikes.useQuery(
    { targetType: "post", targetIds: postIds },
    { enabled: !!user && postIds.length > 0 }
  );

  const commentIds = useMemo(
    () => (comments ? comments.map((c) => c.id) : []),
    [comments]
  );
  const { data: userCommentLikes } = trpc.community.userLikes.useQuery(
    { targetType: "comment", targetIds: commentIds },
    { enabled: !!user && commentIds.length > 0 }
  );

  const isLiked = userPostLikes?.includes(postId) ?? false;

  const toggleLikeMutation = trpc.community.toggleLike.useMutation({
    onSuccess: () => {
      utils.community.post.invalidate({ id: postId });
      utils.community.userLikes.invalidate();
    },
  });

  const addCommentMutation = trpc.community.addComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      setReplyTo(null);
      utils.community.comments.invalidate({ postId });
      utils.community.post.invalidate({ id: postId });
      toast.success("댓글이 등록되었습니다.");
    },
    onError: () => toast.error("댓글 등록에 실패했습니다."),
  });

  const deleteCommentMutation = trpc.community.deleteComment.useMutation({
    onSuccess: () => {
      utils.community.comments.invalidate({ postId });
      utils.community.post.invalidate({ id: postId });
      toast.success("댓글이 삭제되었습니다.");
    },
  });

  const deletePostMutation = trpc.community.delete.useMutation({
    onSuccess: () => {
      toast.success("게시글이 삭제되었습니다.");
      setLocation("/community");
    },
    onError: () => toast.error("게시글 삭제에 실패했습니다."),
  });

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate({
      postId,
      content: commentText,
      parentId: replyTo ?? undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/4" />
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-40 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-muted-foreground">게시글을 찾을 수 없습니다.</p>
        <Button
          variant="outline"
          className="mt-4 rounded-xl"
          onClick={() => setLocation("/community")}
        >
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const isAuthor = user?.id === post.userId;
  const topLevelComments = comments?.filter((c) => !c.parentId) || [];
  const getReplies = (parentId: number) =>
    comments?.filter((c) => c.parentId === parentId) || [];

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

      {/* Post Content */}
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-6 space-y-5">
          {/* Category & Meta */}
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={`text-xs px-2 py-0.5 ${CATEGORY_COLORS[post.category] || ""}`}
            >
              {post.category}
            </Badge>
            {isAuthor && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() =>
                    setLocation(`/community/write?edit=${post.id}`)
                  }
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        정말 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수
                        없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          deletePostMutation.mutate({ id: post.id })
                        }
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold tracking-tight">{post.title}</h1>

          {/* Author & Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-pastel-blue-light flex items-center justify-center text-xs font-medium text-primary">
                {(post.authorName || "익")[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {post.authorName || "익명"}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(post.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {post.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {post.commentCount}
              </span>
            </div>
          </div>

          <Separator />

          {/* Content */}
          <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
            <Streamdown>{post.content}</Streamdown>
          </div>

          {/* Tags */}
          {post.tags && (post.tags as string[]).length > 0 && (
            <div className="flex gap-1.5 flex-wrap pt-2">
              {(post.tags as string[]).map((tag, i) => (
                <span
                  key={i}
                  className="text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <Separator />

          {/* Like Button */}
          <div className="flex justify-center">
            <Button
              variant={isLiked ? "default" : "outline"}
              className="gap-2 rounded-xl px-6"
              onClick={() => {
                if (!user) {
                  toast.error("로그인이 필요합니다.");
                  return;
                }
                toggleLikeMutation.mutate({
                  targetType: "post",
                  targetId: post.id,
                });
              }}
              disabled={toggleLikeMutation.isPending}
            >
              <Heart
                className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`}
              />
              좋아요 {post.likeCount}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-6 space-y-5">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            댓글 {comments?.length || 0}
          </h3>

          {/* Comment Input */}
          {user ? (
            <div className="space-y-2">
              {replyTo && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg">
                  <span>답글 작성 중</span>
                  <button
                    className="text-primary hover:underline"
                    onClick={() => setReplyTo(null)}
                  >
                    취소
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  placeholder="댓글을 입력하세요..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[60px] rounded-xl bg-muted/20 border-0 focus-visible:ring-1 resize-none"
                  rows={2}
                />
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-xl shrink-0 self-end"
                  onClick={handleAddComment}
                  disabled={
                    !commentText.trim() || addCommentMutation.isPending
                  }
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-3 bg-muted/20 rounded-xl">
              댓글을 작성하려면 로그인이 필요합니다.
            </p>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {topLevelComments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
              </p>
            ) : (
              topLevelComments.map((comment) => {
                const replies = getReplies(comment.id);
                const commentLiked =
                  userCommentLikes?.includes(comment.id) ?? false;
                return (
                  <div key={comment.id} className="space-y-3">
                    {/* Top-level comment */}
                    <div className="flex gap-3">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5">
                        {(comment.authorName || "익")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">
                            {comment.authorName || "익명"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {timeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-1 leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <button
                            className={`text-[10px] flex items-center gap-1 transition-colors ${commentLiked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => {
                              if (!user) {
                                toast.error("로그인이 필요합니다.");
                                return;
                              }
                              toggleLikeMutation.mutate({
                                targetType: "comment",
                                targetId: comment.id,
                              });
                            }}
                          >
                            <Heart
                              className={`h-3 w-3 ${commentLiked ? "fill-current" : ""}`}
                            />
                            {comment.likeCount}
                          </button>
                          {user && (
                            <button
                              className="text-[10px] text-muted-foreground hover:text-foreground"
                              onClick={() => setReplyTo(comment.id)}
                            >
                              답글
                            </button>
                          )}
                          {user?.id === comment.userId && (
                            <button
                              className="text-[10px] text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                deleteCommentMutation.mutate({
                                  id: comment.id,
                                  postId,
                                })
                              }
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
                    {replies.length > 0 && (
                      <div className="ml-10 space-y-3 border-l-2 border-muted pl-4">
                        {replies.map((reply) => {
                          const replyLiked =
                            userCommentLikes?.includes(reply.id) ?? false;
                          return (
                            <div key={reply.id} className="flex gap-3">
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5">
                                {(reply.authorName || "익")[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">
                                    {reply.authorName || "익명"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {timeAgo(reply.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground mt-1 leading-relaxed whitespace-pre-wrap">
                                  {reply.content}
                                </p>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <button
                                    className={`text-[10px] flex items-center gap-1 transition-colors ${replyLiked ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                    onClick={() => {
                                      if (!user) {
                                        toast.error("로그인이 필요합니다.");
                                        return;
                                      }
                                      toggleLikeMutation.mutate({
                                        targetType: "comment",
                                        targetId: reply.id,
                                      });
                                    }}
                                  >
                                    <Heart
                                      className={`h-3 w-3 ${replyLiked ? "fill-current" : ""}`}
                                    />
                                    {reply.likeCount}
                                  </button>
                                  {user?.id === reply.userId && (
                                    <button
                                      className="text-[10px] text-muted-foreground hover:text-destructive"
                                      onClick={() =>
                                        deleteCommentMutation.mutate({
                                          id: reply.id,
                                          postId,
                                        })
                                      }
                                    >
                                      삭제
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
