// 앱이 Supabase(로그인·데이터 서버)와 대화하는 통로입니다.
// 여기서 만든 supabase 객체를 화면에서 가져다 씁니다.

import { createClient } from '@supabase/supabase-js'

// .env 파일에서 주소와 키를 읽어옵니다. (VITE_ 로 시작해야 화면에서 읽을 수 있어요)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// 값이 비어 있으면 개발자가 바로 알아채도록 안내합니다.
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase 환경변수가 없습니다. .env 파일에 VITE_SUPABASE_URL 과 VITE_SUPABASE_PUBLISHABLE_KEY 를 넣고 개발 서버를 다시 켜세요.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
