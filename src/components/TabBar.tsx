// 화면 맨 아래 고정되는 이동 메뉴(탭바)입니다.
export type Tab = 'home' | 'records' | 'stats' | 'settings'

type Props = {
  active: Tab
  onChange: (tab: Tab) => void
}

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`tabbar-item ${active ? 'is-active' : ''}`}
      onClick={onClick}
    >
      <span className="tabbar-icon">{icon}</span>
      <span className="tabbar-label">{label}</span>
    </button>
  )
}

export default function TabBar({ active, onChange }: Props) {
  return (
    <nav className="tabbar">
      <TabButton
        icon="🏠"
        label="홈"
        active={active === 'home'}
        onClick={() => onChange('home')}
      />
      <TabButton
        icon="📖"
        label="일기 기록"
        active={active === 'records'}
        onClick={() => onChange('records')}
      />
      <TabButton
        icon="📊"
        label="가계부 통계"
        active={active === 'stats'}
        onClick={() => onChange('stats')}
      />
      <TabButton
        icon="⚙️"
        label="설정"
        active={active === 'settings'}
        onClick={() => onChange('settings')}
      />
    </nav>
  )
}
