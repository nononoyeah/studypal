import { ThemeProvider } from './theme/ThemeProvider'
import { HeroSection } from './components/HeroSection'
import { ThemeToggle } from './components/ThemeToggle'
import { Navbar } from './components/Navbar'
import { StatsCardsSection } from './components/StatsCardsSection'
import { DailyGoalsSection } from './components/DailyGoalsSection'
import { ModulesSection } from './components/ModulesSection'
import { AiSuggestionsSection } from './components/AiSuggestionsSection'
import { TrendChart } from './components/TrendChart'

function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  )
}

export default App
