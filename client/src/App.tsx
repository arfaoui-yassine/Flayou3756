import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import QuizPage from "@/pages/QuizPage";
import ElMarchi from "@/pages/ElMarchi";
import ProfilePage from "@/pages/ProfilePage";
import RoueElHadh from "@/pages/RoueElHadh";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Navigation } from "./components/Navigation";
import { AnimatePresence, motion } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1],
};

function AnimatedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <Component />
    </motion.div>
  );
}

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch key={location}>
        <Route path={"/"}>
          <AnimatedRoute component={Home} />
        </Route>
        <Route path={"/quiz"}>
          <AnimatedRoute component={QuizPage} />
        </Route>
        <Route path={"/marchi"}>
          <AnimatedRoute component={ElMarchi} />
        </Route>
        <Route path={"/profile"}>
          <AnimatedRoute component={ProfilePage} />
        </Route>
        <Route path={"/roue"}>
          <AnimatedRoute component={RoueElHadh} />
        </Route>
        <Route path={"/404"}>
          <AnimatedRoute component={NotFound} />
        </Route>
        <Route>
          <AnimatedRoute component={NotFound} />
        </Route>
      </Switch>
    </AnimatePresence>
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
          <div className="min-h-screen pb-20">
            <Router />
          </div>
          <Navigation />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
