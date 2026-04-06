import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Aptitude from "./pages/Aptitude";
import Explore from "./pages/Explore";
import Roadmap from "./pages/Roadmap";
import Documents from "./pages/Documents";
import Interview from "./pages/Interview";
import Community from "./pages/Community";
import CommunityPost from "./pages/CommunityPost";
import CommunityWrite from "./pages/CommunityWrite";
import MyPage from "./pages/MyPage";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/aptitude" component={Aptitude} />
        <Route path="/explore" component={Explore} />
        <Route path="/roadmap" component={Roadmap} />
        <Route path="/documents" component={Documents} />
        <Route path="/interview" component={Interview} />
        <Route path="/community" component={Community} />
        <Route path="/community/post/:id" component={CommunityPost} />
        <Route path="/community/write" component={CommunityWrite} />
        <Route path="/mypage" component={MyPage} />
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
