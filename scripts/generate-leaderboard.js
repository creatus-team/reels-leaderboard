// 리더보드 데이터 생성 — creatus-student-tracker의 주간 TOP20 API를 소스로 사용.
// (2026-08-04 이전 소스였던 Make→Airtable 파이프라인을 대체. 썸네일은 Supabase Storage
//  영구 공개 URL이라 별도 다운로드가 필요 없다.)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRACKER_URL = process.env.TRACKER_URL || 'https://creatus-student-tracker.vercel.app';
const TRACKER_PASS = process.env.TRACKER_PASS;

if (!TRACKER_PASS) {
  console.error('❌ 환경변수가 설정되지 않았습니다: TRACKER_PASS');
  process.exit(1);
}

// 조회수 포맷팅 함수
const formatViewCount = (count) => {
  if (count >= 10000) {
    return `${Math.floor(count / 10000)}만`;
  } else if (count >= 1000) {
    return `${Math.floor(count / 1000)}천`;
  }
  return `${count}`;
};

async function fetchWeeklyTop(days) {
  const res = await fetch(`${TRACKER_URL}/api/weekly_top?days=${days}`, {
    headers: { Cookie: `dash_auth=${encodeURIComponent(TRACKER_PASS)}` }
  });
  if (!res.ok) {
    throw new Error(`weekly_top API 오류: HTTP ${res.status}`);
  }
  const body = await res.json();
  if (!Array.isArray(body.items)) {
    throw new Error('weekly_top 응답 형식이 올바르지 않습니다.');
  }
  return body;
}

async function generateLeaderboard() {
  try {
    console.log(`🚀 student-tracker에서 주간 TOP을 가져오는 중... (${TRACKER_URL})`);

    // 기간별 시도: 14일 → 28일 → 56일 (데이터 부족 시 자동 확대)
    const periodDays = [14, 28, 56];
    let result = null;

    for (const days of periodDays) {
      result = await fetchWeeklyTop(days);
      console.log(`📅 최근 ${days}일 기준: ${result.items.length}개 (${result.week_start} ~ ${result.week_end})`);
      if (result.items.length >= 15 || days === periodDays[periodDays.length - 1]) {
        if (result.items.length < 15) {
          console.log(`⚠️ 최대 기간(${days}일)까지 확대했지만 ${result.items.length}개뿐입니다.`);
        }
        break;
      }
      console.log(`📈 ${result.items.length}개로 부족합니다. 기간을 확대합니다...`);
    }

    // 트래커가 이미 계정당 1개·조회수 내림차순·제외계정 반영까지 끝낸 TOP 20을 준다.
    let missingThumb = 0;
    const transformedData = result.items.map((it) => {
      // 절대 URL 썸네일만 사용 (상대경로는 트래커 비번 게이트 뒤라 외부에서 못 읽음)
      const thumbUrl = /^https?:\/\//.test(it.thumb || '') ? it.thumb : null;
      if (!thumbUrl) missingThumb++;
      return {
        'Instagram ID': it.handle || it.primary_ig || '@unknown',
        '조회수': it.view_count || 0,
        '조회수_한국어': formatViewCount(it.view_count || 0),
        '날짜': (it.taken_at || '').slice(0, 10),
        '카테고리': '',
        '캡션': '',
        '썸네일': thumbUrl ? [{ url: thumbUrl }] : null,
        '영상URL': it.url || null
      };
    });

    console.log(`✨ ${transformedData.length}개의 리더보드 항목을 생성했습니다.`);
    if (missingThumb > 0) {
      console.log(`⚠️ 썸네일 없는 항목 ${missingThumb}개 → 플레이스홀더로 표시됩니다.`);
    }

    // JSON 파일 생성
    const leaderboardData = {
      data: transformedData,
      lastUpdated: new Date().toISOString(),
      weekStart: result.week_start || getWeekStart(new Date()),
      generatedAt: new Date().toISOString()
    };

    const dataDir = path.join(__dirname, '../public/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const currentPath = path.join(dataDir, 'current.json');
    fs.writeFileSync(currentPath, JSON.stringify(leaderboardData, null, 2));
    console.log(`💾 current.json 파일이 생성되었습니다: ${currentPath}`);

    const backupPath = path.join(dataDir, `leaderboard-${leaderboardData.weekStart}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(leaderboardData, null, 2));
    console.log(`💾 백업 파일이 생성되었습니다: ${backupPath}`);

    console.log('🎉 리더보드 JSON 파일 생성 완료!');
    return transformedData;
  } catch (error) {
    console.error('❌ 리더보드 생성 중 오류 발생:', error);
    throw error;
  }
}

// 주의 시작일 (월요일) 계산
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

generateLeaderboard()
  .then(() => {
    console.log('✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 스크립트 실행 실패:', error);
    process.exit(1);
  });
