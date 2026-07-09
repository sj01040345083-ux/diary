import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import TabBar from './TabBar'
import type { Tab } from './TabBar'
import { getSettings, applySettings, getCachedSettings } from '../lib/settings'
import HomePage from '../pages/HomePage'
import WritePage from '../pages/WritePage'
import TransactionsPage from '../pages/TransactionsPage'
import FavoritesPage from '../pages/FavoritesPage'
import StatsPage from '../pages/StatsPage'
import SettingsPage from '../pages/SettingsPage'
import RecordsPage from '../pages/RecordsPage'

// 로그인한 사용자가 보는 전체 틀입니다.
// 아래 탭바로 화면을 오가고, 전체 화면(작성 등)은 위에 덮어서 띄웁니다.
type Props = {
  session: Session
}

// 탭바 위에 전체 화면으로 덮이는 화면들
type Overlay = null | 'write' | 'transactions' | 'favorites'

export default function AppShell({ session }: Props) {
  const [tab, setTab] = useState<Tab>('home')
  const [overlay, setOverlay] = useState<Overlay>(null)
  // 일기 작성/수정 대상 날짜 (null = 오늘 새로 쓰기)
  const [editDate, setEditDate] = useState<string | null>(null)

  useEffect(() => {
    // 1) 로컬 캐시가 있으면 먼저 즉시 적용 (서버 응답을 기다리지 않고 배경 유지)
    const cached = getCachedSettings()
    if (cached) applySettings(cached)
    // 2) 서버에서 최신 설정을 받아 다시 적용
    getSettings()
      .then(applySettings)
      .catch(() => {})
  }, [])

  // 새 일기 쓰기 (오늘)
  function openWrite() {
    setEditDate(null)
    setOverlay('write')
  }

  // 기록에서 특정 날짜 일기 수정
  function openEdit(date: string) {
    setEditDate(date)
    setOverlay('write')
  }

  // 일기 작성/수정은 집중할 수 있게 전체 화면(탭바 없이)으로 띄웁니다.
  if (overlay === 'write') {
    return (
      <WritePage
        session={session}
        targetDate={editDate ?? undefined}
        onDone={() => {
          setOverlay(null)
          // 오늘 새로 쓴 경우 홈으로(목록 새로고침), 과거 수정은 있던 탭 유지
          if (editDate === null) setTab('home')
          setEditDate(null)
        }}
        onCancel={() => {
          setOverlay(null)
          setEditDate(null)
        }}
      />
    )
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
          onWrite={openWrite}
          onEditDiary={openEdit}
          onTransactions={() => setOverlay('transactions')}
          onFavorites={() => setOverlay('favorites')}
        />
      )}
      {tab === 'records' && <RecordsPage onEditDiary={openEdit} />}
      {tab === 'stats' && <StatsPage />}
      {tab === 'settings' && <SettingsPage session={session} />}

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
