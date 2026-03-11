import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import StakeholderNetworkPage from './pages/StakeholderNetworkPage'
import FundingFlows from './pages/FundingFlows'
import HypothesisTracker from './pages/HypothesisTracker'
import InterviewProtocol from './pages/InterviewProtocol'
import CaseStudies from './pages/CaseStudies'
import BottleneckDiagnostic from './pages/BottleneckDiagnostic'

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
      </Routes>
    </Layout>
  )
}
