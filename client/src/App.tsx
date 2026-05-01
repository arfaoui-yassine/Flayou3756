import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import QuizPage from "@/pages/QuizPage";
import ElMarchi from "@/pages/ElMarchi";
import ProfilePage from "@/pages/ProfilePage";
import RoueElHadh from "@/pages/RoueElHadh";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Navigation } from "./components/Navigation";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/quiz"} component={QuizPage} />
      <Route path={"/marchi"} component={ElMarchi} />
      <Route path={"/profile"} component={ProfilePage} />
      <Route path={"/roue"} component={RoueElHadh} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <div className="pb-24">
            <Router />
          </div>
          <Navigation />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
