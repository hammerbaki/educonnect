import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import AuthGuard from "./components/AuthGuard";
import { useAuth } from "./_core/hooks/useAuth";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Aptitude from "./pages/Aptitude";
import Explore from "./pages/Explore";
import Roadmap from "./pages/Roadmap";
import Documents from "./pages/Documents";
import Interview from "./pages/Interview";
import Community from "./pages/Community";
import CommunityPost from "./pages/CommunityPost";
import CommunityWrite from "./pages/CommunityWrite";
import MyPage from "./pages/MyPage";

function HomePage() {
  const { user } = useAuth();
  return user ? <Home /> : <Landing />;
}

function ProtectedAptitude() {
  return (
    <AuthGuard message="AI 전공 적성 분석을 받으려면 로그인이 필요합니다.">
      <Aptitude />
    </AuthGuard>
  );
}

function ProtectedRoadmap() {
  return (
    <AuthGuard message="입시 로드맵을 관리하려면 로그인이 필요합니다.">
      <Roadmap />
    </AuthGuard>
  );
}

function ProtectedDocuments() {
  return (
    <AuthGuard message="생기부/자소서 가이드를 이용하려면 로그인이 필요합니다.">
      <Documents />
    </AuthGuard>
  );
}

function ProtectedInterview() {
  return (
    <AuthGuard message="AI 면접 연습을 하려면 로그인이 필요합니다.">
      <Interview />
    </AuthGuard>
  );
}

function ProtectedMyPage() {
  return (
    <AuthGuard message="마이페이지를 이용하려면 로그인이 필요합니다.">
      <MyPage />
    </AuthGuard>
  );
}

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/aptitude" component={ProtectedAptitude} />
        <Route path="/explore" component={Explore} />
        <Route path="/roadmap" component={ProtectedRoadmap} />
        <Route path="/documents" component={ProtectedDocuments} />
        <Route path="/interview" component={ProtectedInterview} />
        <Route path="/community" component={Community} />
        <Route path="/community/post/:id" component={CommunityPost} />
        <Route path="/community/write" component={CommunityWrite} />
        <Route path="/mypage" component={ProtectedMyPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
