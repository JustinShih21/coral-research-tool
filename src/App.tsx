import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import StakeholderNetworkPage from './pages/StakeholderNetworkPage'
import FundingFlows from './pages/FundingFlows'
import HypothesisTracker from './pages/HypothesisTracker'
import InterviewProtocol from './pages/InterviewProtocol'
import CaseStudies from './pages/CaseStudies'
import BottleneckDiagnostic from './pages/BottleneckDiagnostic'
import ResearchLibrary from './pages/ResearchLibrary'
import Contacts from './pages/Contacts'
import LeonLivingSeasBriefing from './pages/LeonLivingSeasBriefing'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/network" element={<StakeholderNetworkPage />} />
        <Route path="/funding" element={<FundingFlows />} />
        <Route path="/hypotheses" element={<HypothesisTracker />} />
        <Route path="/interview" element={<InterviewProtocol />} />
        <Route path="/cases" element={<CaseStudies />} />
        <Route path="/bottlenecks" element={<BottleneckDiagnostic />} />
        <Route path="/library" element={<ResearchLibrary />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/leon-living-seas" element={<LeonLivingSeasBriefing />} />
      </Routes>
    </Layout>
  )
}
