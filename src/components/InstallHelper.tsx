import { useEffect, useState } from 'react'
import './install.css'

// 브라우저가 "설치할 수 있어요" 하고 알려줄 때 받는 이벤트의 최소 형태
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// 이번 방문에서 안내를 닫았는지 기억하는 열쇠 (닫으면 잠시 안 보이게)
const DISMISS_KEY = 'soso-install-dismissed'

// 지금 앱이 '설치된 상태'(홈 화면에서 실행)인지 확인
function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari 전용 표시
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

// 화면을 어떤 안내로 보여줄지 구분합니다.
type Mode =
  | 'none' // 안내 필요 없음 (이미 설치됐거나 데스크톱 등)
  | 'kakao' // 카카오톡 안에서 열림 → 바깥 브라우저로 안내
  | 'android' // 안드로이드 크롬 등 → 설치 버튼
  | 'ios' // 아이폰 사파리 → 공유→홈 화면에 추가 안내

export default function InstallHelper() {
  const [mode, setMode] = useState<Mode>('none')
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    // 이미 홈 화면 앱으로 실행 중이면 아무 안내도 필요 없습니다.
    if (isStandalone()) return
    // 이번에 이미 닫았다면 다시 띄우지 않습니다.
    if (sessionStorage.getItem(DISMISS_KEY)) {
      setClosed(true)
      return
    }

    const ua = navigator.userAgent || ''
    const isKakao = /KAKAOTALK/i.test(ua)
    const isIOS = /iPhone|iPad|iPod/i.test(ua)
    // 카카오톡·네이버·인스타 등 '인앱 브라우저'는 홈 화면 설치를 막습니다.
    const isInApp =
      isKakao || /NAVER|Instagram|FBAN|FBAV|Line\//i.test(ua)

    if (isKakao || isInApp) {
      setMode('kakao')
    } else if (isIOS) {
      // 아이폰 사파리: 자동 설치가 없어 '공유→홈 화면에 추가'를 안내합니다.
      setMode('ios')
    }
    // 안드로이드 크롬 등은 아래 beforeinstallprompt 로 설치 버튼을 켭니다.

    // 브라우저가 "설치 가능" 신호를 주면, 기본 배너를 잠시 막고
    // 우리 버튼으로 원할 때 설치창을 띄웁니다.
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as InstallPromptEvent)
      setMode('android')
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    // 설치가 끝나면 안내를 감춥니다.
    const onInstalled = () => setClosed(true)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // 카카오톡 안에서 → 휴대폰 기본 브라우저로 다시 열기
  // (카카오톡이 지원하는 '바깥 브라우저로 열기' 신호. 안드로이드에서 특히 잘 동작)
  function openInBrowser() {
    const url = window.location.href
    window.location.href =
      'kakaotalk://web/openExternal?url=' + encodeURIComponent(url)
  }

  // 안드로이드: 실제 설치창 띄우기
  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setClosed(true)
  }

  // 안내 닫기 (이번 방문 동안만 숨김)
  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setClosed(true)
  }

  if (closed || mode === 'none') return null

  return (
    <div className="install-help" role="dialog" aria-label="앱 설치 안내">
      <button
        className="install-close"
        onClick={dismiss}
        aria-label="닫기"
        type="button"
      >
        ✕
      </button>

      {mode === 'kakao' && (
        <>
          <p className="install-title">🍀 홈 화면에 설치하기</p>
          <p className="install-text">
            카카오톡 안에서는 설치가 안 돼요.
            <br />
            아래 버튼으로 <b>기본 브라우저</b>에서 열어주세요.
          </p>
          <button className="install-btn" onClick={openInBrowser} type="button">
            기본 브라우저로 열기
          </button>
          <p className="install-hint">
            아이폰은 오른쪽 아래 <b>사파리 아이콘</b>을 눌러 열어도 돼요.
          </p>
        </>
      )}

      {mode === 'android' && (
        <>
          <p className="install-title">🍀 소소 다이어리 설치</p>
          <p className="install-text">
            홈 화면에 추가하면 앱처럼 바로 열 수 있어요.
          </p>
          <button className="install-btn" onClick={install} type="button">
            홈 화면에 설치
          </button>
        </>
      )}

      {mode === 'ios' && (
        <>
          <p className="install-title">🍀 홈 화면에 추가하기</p>
          <p className="install-text">
            화면 아래 <b>공유 버튼</b>(네모 상자에 ↑ 화살표)을 누른 뒤
            <br />
            <b>‘홈 화면에 추가’</b>를 선택하면 앱처럼 쓸 수 있어요.
          </p>
        </>
      )}
    </div>
  )
}
