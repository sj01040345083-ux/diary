// 이 파일을 수정하면 로그인/회원가입 화면의 숲 배경 이미지가 바뀝니다.
// 새 이미지를 넣으려면 src/assets/backgrounds/ 에 파일을 넣고 아래처럼 import 하세요.

import forest1 from '../assets/backgrounds/forest1.jpg'
import forest2 from '../assets/backgrounds/forest2.jpg'
import forest3 from '../assets/backgrounds/forest3.jpg'
import forest4 from '../assets/backgrounds/forest4.jpg'
import forest5 from '../assets/backgrounds/forest5.jpg'

// 선택 가능한 전체 배경 목록
export const backgrounds = [forest1, forest2, forest3, forest4, forest5]

// 로그인/회원가입 화면에서 실제로 쓸 배경 (여기 숫자만 바꾸면 교체됩니다)
export const authBackground = forest3
