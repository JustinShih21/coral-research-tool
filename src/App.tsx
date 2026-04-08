import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import { TeamOnlyRoute } from './components/TeamOnlyGate'
import LoginPage from './pages/LoginPage'

const HomePage = lazy(() => import('./pages/HomePage'))
const DonationPage = lazy(() => import('./pages/DonationPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ReefHealth = lazy(() => import('./pages/ReefHealth'))
const StakeholderNetworkPage = lazy(() => import('./pages/StakeholderNetworkPage'))
const HypothesisTracker = lazy(() => import('./pages/HypothesisTracker'))
const InterviewProtocol = lazy(() => import('./pages/InterviewProtocol'))
const CaseStudies = lazy(() => import('./pages/CaseStudies'))
const ResearchLibrary = lazy(() => import('./pages/ResearchLibrary'))
const Contacts = lazy(() => import('./pages/Contacts'))
const LeonLivingSeasBriefing = lazy(() => import('./pages/LeonLivingSeasBriefing'))

function PageLoading() {
  return <div className="page-loading">Loading…</div>
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Suspense fallback={<PageLoading />}><HomePage /></Suspense>} />
              <Route path="/reef-health" element={<Suspense fallback={<PageLoading />}><ReefHealth /></Suspense>} />
              <Route path="/donate" element={<Suspense fallback={<PageLoading />}><DonationPage /></Suspense>} />
              <Route path="/research" element={<Suspense fallback={<PageLoading />}><Dashboard /></Suspense>} />
              <Route path="/dashboard" element={<Navigate to="/research" replace />} />
              <Route path="/network" element={<Suspense fallback={<PageLoading />}><StakeholderNetworkPage /></Suspense>} />
              <Route
                path="/hypotheses"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <TeamOnlyRoute><HypothesisTracker /></TeamOnlyRoute>
                  </Suspense>
                }
              />
              <Route
                path="/interview"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <TeamOnlyRoute><InterviewProtocol /></TeamOnlyRoute>
                  </Suspense>
                }
              />
              <Route path="/cases" element={<Suspense fallback={<PageLoading />}><CaseStudies /></Suspense>} />
              <Route path="/library" element={<Suspense fallback={<PageLoading />}><ResearchLibrary /></Suspense>} />
              <Route path="/contacts" element={<Suspense fallback={<PageLoading />}><Contacts /></Suspense>} />
              <Route
                path="/leon-living-seas"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <TeamOnlyRoute><LeonLivingSeasBriefing /></TeamOnlyRoute>
                  </Suspense>
                }
              />
            </Routes>
          </Layout>
        } />
      </Routes>
    </AuthProvider>
  )
}
