import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import { TeamOnlyRoute } from './components/TeamOnlyGate'
import Dashboard from './pages/Dashboard'
import StakeholderNetworkPage from './pages/StakeholderNetworkPage'
import HypothesisTracker from './pages/HypothesisTracker'
import InterviewProtocol from './pages/InterviewProtocol'
import CaseStudies from './pages/CaseStudies'
import ResearchLibrary from './pages/ResearchLibrary'
import Contacts from './pages/Contacts'
import LeonLivingSeasBriefing from './pages/LeonLivingSeasBriefing'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/network" element={<StakeholderNetworkPage />} />
              <Route path="/hypotheses" element={<TeamOnlyRoute><HypothesisTracker /></TeamOnlyRoute>} />
              <Route path="/interview" element={<TeamOnlyRoute><InterviewProtocol /></TeamOnlyRoute>} />
              <Route path="/cases" element={<CaseStudies />} />
              <Route path="/library" element={<ResearchLibrary />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/leon-living-seas" element={<TeamOnlyRoute><LeonLivingSeasBriefing /></TeamOnlyRoute>} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </AuthProvider>
  )
}
