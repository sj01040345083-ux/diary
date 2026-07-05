// 화면 맨 아래 고정되는 이동 메뉴(탭바)입니다.
export type Tab = 'home' | 'records' | 'report' | 'settings'

type Props = {
  active: Tab
  onChange: (tab: Tab) => void
  onAdd: () => void // 가운데 ➕ (추가)
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

export default function TabBar({ active, onChange, onAdd }: Props) {
  return (
    <nav className="tabbar">
      <TabButton icon="🏠" label="홈" active={active === 'home'} onClick={() => onChange('home')} />
      <TabButton icon="📖" label="기록" active={active === 'records'} onClick={() => onChange('records')} />

      {/* 가운데 추가 버튼 */}
      <button className="tabbar-item tabbar-add" onClick={onAdd} aria-label="추가">
        <span className="tabbar-add-circle">＋</span>
        <span className="tabbar-label">추가</span>
      </button>

      <TabButton icon="📊" label="리포트" active={active === 'report'} onClick={() => onChange('report')} />
      <TabButton icon="⚙️" label="설정" active={active === 'settings'} onClick={() => onChange('settings')} />
    </nav>
  )
}
