import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogIn } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  message?: string;
}

export default function AuthGuard({ children, message }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse space-y-4 w-full max-w-md">
          <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
          <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-6 p-8 max-w-sm w-full text-center">
          <div className="relative">
            <div className="absolute -top-4 -left-6 w-12 h-12 rounded-full bg-pastel-blue-light/60 blur-sm" />
            <div className="absolute -top-1 -right-4 w-8 h-8 rounded-lg bg-pastel-pink-light/50 rotate-12 blur-sm" />
            <GraduationCap className="h-12 w-12 text-primary relative z-10" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">
              로그인이 필요합니다
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message || "이 기능을 사용하려면 로그인해주세요."}
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <LogIn className="h-4 w-4 mr-2" />
            로그인하기
          </Button>
          <p className="text-xs text-muted-foreground">
            학과 탐색과 커뮤니티는 로그인 없이도 이용 가능합니다.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
