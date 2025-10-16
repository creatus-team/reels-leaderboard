import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Airtable 설정
const AIRTABLE_API_KEY = process.env.VITE_AIRTABLE_API_KEY || 'patvZr35hzPXZDDF0.38f4bf9d7b76e00d073fdff6351bc6201e5f552ab2ab37af25d49d33bf945e11';
const BASE_ID = process.env.VITE_BASE_ID || 'apphCg257EyPVwr7T';
const TABLE_NAME = process.env.VITE_TABLE_NAME || '영상 DB';

// 조회수 포맷팅 함수
const formatViewCount = (count) => {
  if (count >= 10000) {
    return `${Math.floor(count / 10000)}만`;
  } else if (count >= 1000) {
    return `${Math.floor(count / 1000)}천`;
  }
  return `${count}`;
};

// 리더보드 데이터 생성
async function generateLeaderboard() {
  try {
    console.log('🚀 Airtable에서 데이터를 가져오는 중...');
    
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}?` +
      `sort%5B0%5D%5Bfield%5D=조회수&sort%5B0%5D%5Bdirection%5D=desc&` +
      `maxRecords=50&` + // 최대 50개 레코드만 가져오기
      `fields%5B%5D=Instagram%20ID&` +
      `fields%5B%5D=조회수&` +
      `fields%5B%5D=날짜&` +
      `fields%5B%5D=카테고리&` +
      `fields%5B%5D=캡션&` +
      `fields%5B%5D=썸네일&` +
      `fields%5B%5D=URL`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`📊 ${result.records.length}개의 레코드를 가져왔습니다.`);

    if (result.records) {
      // 썸네일이 있는 데이터만 필터링하고 변환
      const allData = result.records
        .filter(record => record.fields['썸네일'] && record.fields['썸네일'].length > 0)
        .map(record => ({
          'Instagram ID': record.fields['Instagram ID'] || '@unknown',
          '조회수': record.fields['조회수'] || 0,
          '조회수_한국어': formatViewCount(record.fields['조회수'] || 0),
          '날짜': record.fields['날짜'] || '',
          '카테고리': record.fields['카테고리'] || '기타',
          '캡션': record.fields['캡션'] || '릴스 영상을 확인해보세요!',
          '썸네일': record.fields['썸네일'] || null,
          '영상URL': record.fields['URL'] || null
        }))
        .sort((a, b) => b["조회수"] - a["조회수"]);

      // Instagram ID별 중복 제거 (최고 조회수만 유지)
      const uniqueData = [];
      const seenIds = new Set();

      for (const item of allData) {
        if (!seenIds.has(item['Instagram ID'])) {
          seenIds.add(item['Instagram ID']);
          uniqueData.push(item);
        }
      }

      // 상위 15개만 선택
      const transformedData = uniqueData.slice(0, 15);
      console.log(`✨ ${transformedData.length}개의 고유한 리더보드 항목을 생성했습니다.`);

      // JSON 파일 생성
      const leaderboardData = {
        data: transformedData,
        lastUpdated: new Date().toISOString(),
        weekStart: getWeekStart(new Date()),
        generatedAt: new Date().toISOString()
      };

      // public/data 디렉토리 확인 및 생성
      const dataDir = path.join(__dirname, '../public/data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // current.json 파일 생성
      const currentPath = path.join(dataDir, 'current.json');
      fs.writeFileSync(currentPath, JSON.stringify(leaderboardData, null, 2));
      console.log(`💾 current.json 파일이 생성되었습니다: ${currentPath}`);

      // 백업 파일도 생성 (날짜별)
      const backupPath = path.join(dataDir, `leaderboard-${leaderboardData.weekStart}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(leaderboardData, null, 2));
      console.log(`💾 백업 파일이 생성되었습니다: ${backupPath}`);

      console.log('🎉 리더보드 JSON 파일 생성 완료!');
      return transformedData;

    } else {
      throw new Error('No records found');
    }

  } catch (error) {
    console.error('❌ 리더보드 생성 중 오류 발생:', error);
    throw error;
  }
}

// 주의 시작일 (월요일) 계산
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0]; // YYYY-MM-DD 형식
}

// 스크립트 직접 실행 시
const isMainModule = import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMainModule) {
  generateLeaderboard()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export { generateLeaderboard };
