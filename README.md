# 릴스 수강생 성과 리더보드

매주 월요일 21:00에 자동 업데이트되는 수강생 성과 리더보드입니다.

## 🚀 배포 방법 (Vercel)

### 1. Vercel 계정 생성
- [vercel.com](https://vercel.com)에서 GitHub 계정으로 로그인

### 2. 프로젝트 배포
1. Vercel 대시보드에서 "New Project" 클릭
2. GitHub 리포지토리 연결 또는 폴더 업로드
3. Framework Preset: **Vite** 선택
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Install Command: `npm install --legacy-peer-deps`

### 3. 환경변수 설정
Vercel 프로젝트 설정에서 다음 환경변수 추가:
```
VITE_AIRTABLE_API_KEY=patvZr35hzPXZDDF0.38f4bf9d7b76e00d073fdff6351bc6201e5f552ab2ab37af25d49d33bf945e11
VITE_BASE_ID=apphCg257EyPVwr7T
VITE_TABLE_NAME=영상 DB
```

### 4. 배포 완료
- 자동으로 빌드 및 배포됨
- `https://your-project-name.vercel.app` 형태의 URL 생성

## 🎯 임베드 사용법

생성된 URL을 iframe으로 임베드:
```html
<iframe 
  src="https://your-project-name.vercel.app" 
  width="100%" 
  height="800px" 
  frameborder="0">
</iframe>
```

## ✨ 주요 기능

- 🏆 1-3위 메달 디자인
- 📱 완전 반응형 (모바일/태블릿/데스크톱)
- 🔄 매주 월요일 21:00 자동 업데이트
- 🎨 투명 배경으로 임베드 최적화
- ⚡ 빠른 로딩 및 부드러운 애니메이션

