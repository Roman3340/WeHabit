import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import HabitsPage from './pages/HabitsPage'
import FeedPage from './pages/FeedPage'
import ProfilePage from './pages/ProfilePage'
import ProfileEditPage from './pages/ProfileEditPage'
import HabitDetailPage from './pages/HabitDetailPage'
import FriendsPage from './pages/FriendsPage'
import FriendProfilePage from './pages/FriendProfilePage'
import AchievementsPage from './pages/AchievementsPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import YearlyReportPage from './pages/YearlyReportPage'

const basename = import.meta.env.BASE_URL?.replace(/\/$/, '') || ''

function App() {
  return (
    <BrowserRouter basename={basename}>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<ProfileEditPage />} />
          <Route path="/profile/friends" element={<FriendsPage />} />
          <Route path="/profile/friends/:id" element={<FriendProfilePage />} />
          <Route path="/profile/achievements" element={<AchievementsPage />} />
          <Route path="/profile/yearly-report" element={<YearlyReportPage />} />
          <Route path="/profile/notifications" element={<NotificationsPage />} />
          <Route path="/profile/settings" element={<SettingsPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/habits/:id" element={<HabitDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App

