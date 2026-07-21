import { useMemo, useState } from 'react'
import {
  STEMS,
  STEMS_HANJA,
  BRANCHES,
  BRANCHES_HANJA,
  BRANCH_ANIMAL,
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  ELEMENT_INFO,
  ELEMENTS,
} from './data'
import { computeSaju } from './engine'
import type { Pillar, SajuResult } from './engine'
import { interpret, todayFortune } from './interpret'
import './saju.css'

// 오늘 날짜 (오늘의 운세용)
const NOW = new Date()
const TODAY = { year: NOW.getFullYear(), month: NOW.getMonth() + 1, day: NOW.getDate() }

type FormState = {
  name: string
  gender: 'male' | 'female'
  year: string
  month: string
  day: string
  unknownTime: boolean
  hour: string
  minute: string
}

const emptyForm: FormState = {
  name: '',
  gender: 'male',
  year: '1990',
  month: '1',
  day: '1',
  unknownTime: false,
  hour: '12',
  minute: '0',
}

export default function SajuApp() {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [result, setResult] = useState<SajuResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const y = Number(form.year)
    const m = Number(form.month)
    const d = Number(form.day)
    if (!y || y < 1900 || y > 2100) return setError('연도를 1900~2100 사이로 입력해 주세요.')
    if (!m || m < 1 || m > 12) return setError('월을 1~12 사이로 입력해 주세요.')
    if (!d || d < 1 || d > 31) return setError('일을 1~31 사이로 입력해 주세요.')
    const date = new Date(y, m - 1, d)
    if (date.getMonth() !== m - 1) return setError('존재하지 않는 날짜입니다. 다시 확인해 주세요.')

    const saju = computeSaju({
      year: y,
      month: m,
      day: d,
      hour: form.unknownTime ? undefined : Number(form.hour),
      minute: form.unknownTime ? undefined : Number(form.minute),
      gender: form.gender,
    })
    setResult(saju)
    // 결과로 부드럽게 스크롤
    requestAnimationFrame(() => {
      document.getElementById('saju-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <div className="saju-root">
      <header className="saju-header">
        <div className="saju-logo">☯︎</div>
        <h1>오늘의 사주</h1>
        <p className="saju-sub">생년월일시로 보는 나의 사주팔자와 운세</p>
      </header>

      <form className="saju-card saju-form" onSubmit={onSubmit}>
        <label className="saju-field">
          <span>이름 (선택)</span>
          <input
            type="text"
            value={form.name}
            placeholder="홍길동"
            onChange={(e) => update('name', e.target.value)}
          />
        </label>

        <div className="saju-field">
          <span>성별</span>
          <div className="saju-seg">
            <button
              type="button"
              className={form.gender === 'male' ? 'on' : ''}
              onClick={() => update('gender', 'male')}
            >
              남성
            </button>
            <button
              type="button"
              className={form.gender === 'female' ? 'on' : ''}
              onClick={() => update('gender', 'female')}
            >
              여성
            </button>
          </div>
        </div>

        <div className="saju-field">
          <span>생년월일 (양력)</span>
          <div className="saju-ymd">
            <input type="number" value={form.year} min={1900} max={2100}
              onChange={(e) => update('year', e.target.value)} aria-label="연" />
            <em>년</em>
            <input type="number" value={form.month} min={1} max={12}
              onChange={(e) => update('month', e.target.value)} aria-label="월" />
            <em>월</em>
            <input type="number" value={form.day} min={1} max={31}
              onChange={(e) => update('day', e.target.value)} aria-label="일" />
            <em>일</em>
          </div>
        </div>

        <div className="saju-field">
          <span>태어난 시간</span>
          <label className="saju-check">
            <input
              type="checkbox"
              checked={form.unknownTime}
              onChange={(e) => update('unknownTime', e.target.checked)}
            />
            시간을 몰라요 (시주 제외)
          </label>
          {!form.unknownTime && (
            <div className="saju-ymd">
              <input type="number" value={form.hour} min={0} max={23}
                onChange={(e) => update('hour', e.target.value)} aria-label="시" />
              <em>시</em>
              <input type="number" value={form.minute} min={0} max={59}
                onChange={(e) => update('minute', e.target.value)} aria-label="분" />
              <em>분</em>
            </div>
          )}
        </div>

        {error && <p className="saju-error">{error}</p>}

        <button type="submit" className="saju-submit">사주 보기</button>
        <p className="saju-note">※ 재미와 자기 성찰을 위한 참고용입니다. 표준시는 한국(UTC+9) 기준.</p>
      </form>

      {result && <SajuResultView result={result} name={form.name} />}
    </div>
  )
}

// ── 결과 화면 ──────────────────────────────────────────────
function SajuResultView({ result, name }: { result: SajuResult; name: string }) {
  const interpretation = useMemo(() => interpret(result), [result])
  const fortune = useMemo(() => todayFortune(result.dayMaster, TODAY), [result])
  const total = result.elementCounts.reduce((a, b) => a + b, 0)

  // 십신 라벨을 자리별로 찾기
  const godAt = (position: string) => result.tenGods.find((g) => g.position === position)?.god ?? ''

  return (
    <section id="saju-result" className="saju-result">
      <h2 className="saju-result-title">
        {name ? `${name} 님의 사주` : '나의 사주팔자'}
      </h2>
      <p className="saju-birth">
        {result.input.year}년 {result.input.month}월 {result.input.day}일
        {result.hour !== null && ` ${String(result.input.hour).padStart(2, '0')}시 ${String(result.input.minute ?? 0).padStart(2, '0')}분`}
        {' · '}
        {result.input.gender === 'male' ? '남성' : '여성'}
      </p>

      {/* 4기둥 표 */}
      <div className="saju-card">
        <h3 className="saju-h3">사주팔자 (四柱八字)</h3>
        <div className="saju-pillars">
          <PillarColumn label="시주" sub="時" pillar={result.hour} godTop={godAt('시간')} godBot={godAt('시지')} />
          <PillarColumn label="일주" sub="日" pillar={result.day} godTop="일간(나)" godBot={godAt('일지')} isDay />
          <PillarColumn label="월주" sub="月" pillar={result.month} godTop={godAt('월간')} godBot={godAt('월지')} />
          <PillarColumn label="년주" sub="年" pillar={result.year} godTop={godAt('년간')} godBot={godAt('년지')} />
        </div>
      </div>

      {/* 오행 분포 */}
      <div className="saju-card">
        <h3 className="saju-h3">오행 분포 (五行)</h3>
        <div className="saju-elements">
          {ELEMENTS.map((el, i) => {
            const c = result.elementCounts[i]
            const info = ELEMENT_INFO[i]
            return (
              <div className="saju-el-row" key={el}>
                <span className="saju-el-name" style={{ color: info.color }}>
                  {info.hanja} {el}
                </span>
                <div className="saju-el-bar">
                  <div
                    className="saju-el-fill"
                    style={{ width: `${total ? (c / total) * 100 : 0}%`, background: info.color }}
                  />
                </div>
                <span className="saju-el-count">{c}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 오늘의 운세 */}
      <div className="saju-card saju-fortune">
        <h3 className="saju-h3">오늘의 운세 · {fortune.pillarLabel}</h3>
        <p className="saju-fortune-god">{fortune.god}</p>
        <p className="saju-fortune-msg">{fortune.message}</p>
      </div>

      {/* 해석 */}
      <div className="saju-card">
        <h3 className="saju-h3">사주 풀이</h3>
        {interpretation.paragraphs.map((p, i) => (
          <div className="saju-para" key={i}>
            <h4>{p.heading}</h4>
            {p.body.split('\n').map((line, j) =>
              line.trim() ? <p key={j}>{line}</p> : <br key={j} />,
            )}
          </div>
        ))}
      </div>

      <p className="saju-note saju-note-bottom">
        사주는 태어난 기운의 지도일 뿐, 삶을 바꾸는 것은 오늘의 선택입니다. 🍀
      </p>
    </section>
  )
}

// ── 기둥 한 칸 ─────────────────────────────────────────────
function PillarColumn({
  label, sub, pillar, godTop, godBot, isDay = false,
}: {
  label: string
  sub: string
  pillar: Pillar | null
  godTop: string
  godBot: string
  isDay?: boolean
}) {
  return (
    <div className={`saju-col${isDay ? ' is-day' : ''}`}>
      <div className="saju-col-head">
        {label}<span>{sub}</span>
      </div>
      {pillar ? (
        <>
          <div className="saju-god">{godTop}</div>
          <Char kind="stem" idx={pillar.stem} />
          <Char kind="branch" idx={pillar.branch} />
          <div className="saju-god">{godBot}</div>
        </>
      ) : (
        <div className="saju-col-empty">시간<br />모름</div>
      )}
    </div>
  )
}

function Char({ kind, idx }: { kind: 'stem' | 'branch'; idx: number }) {
  const elementIdx = kind === 'stem' ? STEM_ELEMENT[idx] : BRANCH_ELEMENT[idx]
  const color = ELEMENT_INFO[elementIdx].color
  const kor = kind === 'stem' ? STEMS[idx] : BRANCHES[idx]
  const han = kind === 'stem' ? STEMS_HANJA[idx] : BRANCHES_HANJA[idx]
  return (
    <div className="saju-char" style={{ background: color }}>
      <span className="saju-char-han">{han}</span>
      <span className="saju-char-kor">
        {kor}
        {kind === 'branch' && <em>{BRANCH_ANIMAL[idx]}</em>}
      </span>
    </div>
  )
}
