import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

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

// 이미지 다운로드 함수
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filepath);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(filepath, () => {}); // 실패 시 파일 삭제
          reject(err);
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// 안전한 파일명 생성
function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
}

// 리더보드 데이터 생성
async function generateLeaderboard() {
  try {
    console.log('🚀 Airtable에서 데이터를 가져오는 중...');
    
    // 2주 전 날짜 계산 (한국시간 기준)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const dateFilter = twoWeeksAgo.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    console.log(`📅 필터링 기준: ${dateFilter} 이후 영상들만 대상`);
    
    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}?` +
      `sort%5B0%5D%5Bfield%5D=조회수&sort%5B0%5D%5Bdirection%5D=desc&` +
      `maxRecords=100&` + // 필터링 후 15개 확보를 위해 100개로 증가
      `filterByFormula=IS_AFTER({날짜}, '${dateFilter}')&` + // 2주 전 이후 날짜만
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
      
      // 안전장치: 15개 미만이면 경고
      if (transformedData.length < 15) {
        console.log(`⚠️  경고: 최근 2주간 영상이 ${transformedData.length}개만 있습니다. (목표: 15개)`);
        console.log(`📊 전체 필터링된 영상 수: ${allData.length}개`);
        console.log(`👥 중복 제거 후: ${uniqueData.length}개`);
      }

      // 이미지 다운로드 및 로컬 경로로 변경
      console.log('🖼️  썸네일 이미지 다운로드 중...');
      
      // public/assets/thumbnails 디렉토리 생성
      const thumbnailsDir = path.join(__dirname, '../public/assets/thumbnails');
      if (!fs.existsSync(thumbnailsDir)) {
        fs.mkdirSync(thumbnailsDir, { recursive: true });
      }

      // 각 항목의 이미지 다운로드
      for (let i = 0; i < transformedData.length; i++) {
        const item = transformedData[i];
        if (item['썸네일'] && item['썸네일'].length > 0) {
          try {
            const thumbnailUrl = item['썸네일'][0].url;
            const instagramId = sanitizeFilename(item['Instagram ID']);
            const filename = `${instagramId}.jpg`;
            const filepath = path.join(thumbnailsDir, filename);
            
            console.log(`📥 다운로드 중: ${item['Instagram ID']} -> ${filename}`);
            await downloadImage(thumbnailUrl, filepath);
            
            // 로컬 경로로 변경 (Airtable 임시 URL 완전 제거, 필요한 메타데이터만 보존)
            transformedData[i]['썸네일'] = [{
              url: `/assets/thumbnails/${filename}`,
              localPath: filepath,
              filename: filename,
              width: item['썸네일'][0].width,
              height: item['썸네일'][0].height,
              size: item['썸네일'][0].size,
              type: item['썸네일'][0].type
              // thumbnails 객체는 완전 제거하여 Airtable 임시 URL 방지
            }];
            
            console.log(`✅ 완료: ${filename}`);
          } catch (error) {
            console.log(`❌ 실패: ${item['Instagram ID']} - ${error.message}`);
            // 실패 시 원본 URL 유지
          }
        }
      }
      
      console.log('🖼️  썸네일 다운로드 완료!');

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
