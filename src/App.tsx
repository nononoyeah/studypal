import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeProvider'
import { HeroSection } from './components/HeroSection'
import { ThemeToggle } from './components/ThemeToggle'
import { Navbar } from './components/Navbar'
import { StatsCardsSection } from './components/StatsCardsSection'
import { DailyGoalsSection } from './components/DailyGoalsSection'
import { ModulesSection } from './components/ModulesSection'
import { AiSuggestionsSection } from './components/AiSuggestionsSection'
import { TrendChart } from './components/TrendChart'
import { ChatPage } from './components/ChatPage'
import { LoginPage } from './components/LoginPage'
import { AnalysisLayout } from './components/AnalysisLayout'
import { AnalyticsPage } from './components/AnalyticsPage'
import { AiSuggestionsPage } from './components/AiSuggestionsPage'
import { LearningGoalsPage } from './components/LearningGoalsPage'

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <main>
                  <HeroSection />
                  <StatsCardsSection />
                  <DailyGoalsSection />
                  <ModulesSection />
                  <AiSuggestionsSection />
                  <TrendChart />
                </main>
                <ThemeToggle />
              </>
            }
          />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/analysis" element={<AnalysisLayout />}>
            <Route index element={<AnalyticsPage />} />
            <Route path="suggestions" element={<AiSuggestionsPage />} />
            <Route path="goals" element={<LearningGoalsPage />} />
            <Route path="*" element={<Navigate to="/analysis" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
