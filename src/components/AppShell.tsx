import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import TabBar from './TabBar'
import type { Tab } from './TabBar'
import HomePage from '../pages/HomePage'
import WritePage from '../pages/WritePage'
import PlaceholderPage from '../pages/PlaceholderPage'

// 로그인한 사용자가 보는 전체 틀입니다.
// 아래 탭바로 화면을 오가고, ➕는 일기 작성 화면을 띄웁니다.
type Props = {
  session: Session
}

export default function AppShell({ session }: Props) {
  const [tab, setTab] = useState<Tab>('home')
  const [writing, setWriting] = useState(false) // ➕ 로 여는 일기 작성 화면

  // 일기 작성은 집중할 수 있게 전체 화면으로 (탭바 없이) 띄웁니다.
  if (writing) {
    return (
      <WritePage
        session={session}
        onDone={() => {
          setWriting(false)
          setTab('home') // 저장 후 홈으로 (목록 새로고침)
        }}
        onCancel={() => setWriting(false)}
      />
    )
  }

  return (
    <div className="app-shell">
      {tab === 'home' && (
        <HomePage session={session} onWrite={() => setWriting(true)} />
      )}
      {tab === 'records' && <PlaceholderPage title="기록" />}
      {tab === 'report' && <PlaceholderPage title="리포트" />}
      {tab === 'settings' && <PlaceholderPage title="설정" />}

      <TabBar active={tab} onChange={setTab} onAdd={() => setWriting(true)} />
    </div>
  )
}
