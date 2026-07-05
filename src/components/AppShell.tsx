import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import TabBar from './TabBar'
import type { Tab } from './TabBar'
import { getSettings, applySettings } from '../lib/settings'
import HomePage from '../pages/HomePage'
import WritePage from '../pages/WritePage'
import GratitudePage from '../pages/GratitudePage'
import TransactionsPage from '../pages/TransactionsPage'
import FavoritesPage from '../pages/FavoritesPage'
import ReportPage from '../pages/ReportPage'
import SettingsPage from '../pages/SettingsPage'
import PlaceholderPage from '../pages/PlaceholderPage'

// 로그인한 사용자가 보는 전체 틀입니다.
// 아래 탭바로 화면을 오가고, 전체 화면(작성·감사일기)은 위에 덮어서 띄웁니다.
type Props = {
  session: Session
}

// 탭바 위에 전체 화면으로 덮이는 화면들
type Overlay = null | 'write' | 'gratitude' | 'transactions' | 'favorites'

export default function AppShell({ session }: Props) {
  const [tab, setTab] = useState<Tab>('home')
  const [overlay, setOverlay] = useState<Overlay>(null)

  useEffect(() => {
    // 앱을 열 때 저장된 화면 설정(배경색·글씨체·크기)을 불러와 적용합니다.
    getSettings()
      .then(applySettings)
      .catch(() => {})
  }, [])

  // 일기 작성은 집중할 수 있게 전체 화면(탭바 없이)으로 띄웁니다.
  if (overlay === 'write') {
    return (
      <WritePage
        session={session}
        onDone={() => {
          setOverlay(null)
          setTab('home') // 저장 후 홈으로 (목록 새로고침)
        }}
        onCancel={() => setOverlay(null)}
      />
    )
  }

  // 감사일기도 전체 화면으로 띄웁니다.
  if (overlay === 'gratitude') {
    return <GratitudePage session={session} onBack={() => setOverlay(null)} />
  }

  // 소비/수입 기록도 전체 화면으로 띄웁니다.
  if (overlay === 'transactions') {
    return <TransactionsPage session={session} onBack={() => setOverlay(null)} />
  }

  // 명언 즐겨찾기 모음 화면
  if (overlay === 'favorites') {
    return <FavoritesPage onBack={() => setOverlay(null)} />
  }

  return (
    <div className="app-shell">
      {tab === 'home' && (
        <HomePage
          session={session}
          onWrite={() => setOverlay('write')}
          onGratitude={() => setOverlay('gratitude')}
          onTransactions={() => setOverlay('transactions')}
          onFavorites={() => setOverlay('favorites')}
        />
      )}
      {tab === 'records' && <PlaceholderPage title="기록" />}
      {tab === 'report' && <ReportPage />}
      {tab === 'settings' && <SettingsPage session={session} />}

      <TabBar active={tab} onChange={setTab} onAdd={() => setOverlay('write')} />
    </div>
  )
}
