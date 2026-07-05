import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import TabBar from './TabBar'
import type { Tab } from './TabBar'
import HomePage from '../pages/HomePage'
import WritePage from '../pages/WritePage'
import GratitudePage from '../pages/GratitudePage'
import PlaceholderPage from '../pages/PlaceholderPage'

// 로그인한 사용자가 보는 전체 틀입니다.
// 아래 탭바로 화면을 오가고, 전체 화면(작성·감사일기)은 위에 덮어서 띄웁니다.
type Props = {
  session: Session
}

// 탭바 위에 전체 화면으로 덮이는 화면들
type Overlay = null | 'write' | 'gratitude'

export default function AppShell({ session }: Props) {
  const [tab, setTab] = useState<Tab>('home')
  const [overlay, setOverlay] = useState<Overlay>(null)

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

  return (
    <div className="app-shell">
      {tab === 'home' && (
        <HomePage
          session={session}
          onWrite={() => setOverlay('write')}
          onGratitude={() => setOverlay('gratitude')}
        />
      )}
      {tab === 'records' && <PlaceholderPage title="기록" />}
      {tab === 'report' && <PlaceholderPage title="리포트" />}
      {tab === 'settings' && <PlaceholderPage title="설정" />}

      <TabBar active={tab} onChange={setTab} onAdd={() => setOverlay('write')} />
    </div>
  )
}
