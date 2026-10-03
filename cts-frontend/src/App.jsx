// src/App.jsx
import { Routes, Route, Navigate } from "react-router";
import { lazy, Suspense } from 'react';
import ProtectedRoute from "./Components/ProtectedRoute.jsx";

const Landing         = lazy(() => import('./Pages/Landing.jsx'));
const ResultatsPublics= lazy(() => import('./Pages/ResultatsPublics.jsx'));
const LoginCTS        = lazy(() => import('./Pages/Login.jsx'));
const SignUp          = lazy(() => import('./Pages/signup.jsx'));
const Adminpage       = lazy(() => import('./Pages/Admin.jsx'));
const Votes           = lazy(() => import('./Pages/Votes.jsx'));
const Electeurs       = lazy(() => import('./Pages/Electeurs.jsx'));
const Candidats       = lazy(() => import('./Pages/Settings.jsx'));
const VoterDashboard  = lazy(() => import('./Pages/VoterDashboard.jsx'));
const VoterChoice     = lazy(() => import('./Components/VoterChoice.jsx'));
const VoterBallot     = lazy(() => import('./Pages/VoterBallot.jsx'));
const VoterRecap      = lazy(() => import('./Components/VoterRecap.jsx'));
const VoterHistory    = lazy(() => import('./Pages/VoterHistory.jsx'));
const AdminresultsPage= lazy(() => import('./Pages/adminresult.jsx'));
const ElecteurScrutins= lazy(() => import('./Pages/ElecteurScrutins.jsx'));
const AdminCandidatures=lazy(() => import('./Pages/AdminCandidatures.jsx'));
const CandidatureForm = lazy(() => import('./Pages/CandidatureForm.jsx'));
const AuditLogPage    = lazy(() => import('./Pages/AuditLog.jsx'));

function AppContent() {
    return (
        <Suspense fallback={null}>
        <Routes>
            {/* ── Publiques ── */}
            <Route path="/"         element={<Landing />} />
            <Route path="/resultats" element={<ResultatsPublics />} />
            <Route path="/login"    element={<LoginCTS />} />
            <Route path="/signup"   element={<SignUp />} />

            {/* ── Électeur ── */}
            <Route path="/voterDashboard" element={
                <ProtectedRoute allowedRole="electeur"><VoterDashboard /></ProtectedRoute>
            } />
            <Route path="/voterChoice" element={
                <ProtectedRoute allowedRole="electeur"><VoterChoice /></ProtectedRoute>
            } />
            <Route path="/voterBallot" element={
                <ProtectedRoute allowedRole="electeur"><VoterBallot /></ProtectedRoute>
            } />
            <Route path="/voterRecap" element={
                <ProtectedRoute allowedRole="electeur"><VoterRecap /></ProtectedRoute>
            } />
            <Route path="/voterHistory" element={
                <ProtectedRoute allowedRole="electeur"><VoterHistory /></ProtectedRoute>
            } />
            <Route path="/voterProfile" element={<Navigate to="/voterDashboard" replace />} />
            <Route path="/scrutins" element={
                <ProtectedRoute allowedRole="electeur"><ElecteurScrutins /></ProtectedRoute>
            } />
            <Route path="/candidature" element={
                <ProtectedRoute allowedRole="electeur"><CandidatureForm /></ProtectedRoute>
            } />

            {/* ── Admin ── */}
            <Route path="/admin" element={
                <ProtectedRoute allowedRole="admin"><Adminpage /></ProtectedRoute>
            } />
            <Route path="/candidatures" element={
                <ProtectedRoute allowedRole="admin"><AdminCandidatures /></ProtectedRoute>
            } />
            <Route path="/votes-elections" element={
                <ProtectedRoute allowedRole="admin"><Votes /></ProtectedRoute>
            } />
            <Route path="/candidats" element={
                <ProtectedRoute allowedRole="admin"><Candidats /></ProtectedRoute>
            } />
            <Route path="/electeurs" element={
                <ProtectedRoute allowedRole="admin"><Electeurs /></ProtectedRoute>
            } />
            <Route path="/adminresultsPage" element={
                <ProtectedRoute allowedRole="admin"><AdminresultsPage /></ProtectedRoute>
            } />
            <Route path="/audit-log" element={
                <ProtectedRoute allowedRole="admin"><AuditLogPage /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
    );
}

function App() { return <AppContent />; }

export default App;
