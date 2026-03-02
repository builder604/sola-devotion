import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Prayers from './pages/Prayers';
import ReadingPlan from './pages/ReadingPlan';
import Settings from './pages/Settings';
import History from './pages/History';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Sola Devotion</h1>
          <p className="app-subtitle">Soli Deo Gloria</p>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/prayers" element={<Prayers />} />
          <Route path="/reading-plan" element={<ReadingPlan />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      <Navigation />
    </div>
  );
}
