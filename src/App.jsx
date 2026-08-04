import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Trophy, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import './App.css'
import placeholderImage from './assets/placeholder.jpg'
import thumb1 from './assets/thumb1.jpeg'
import thumb2 from './assets/thumb2.jpeg'
import thumb3 from './assets/thumb3.jpeg'
import thumb4 from './assets/thumb4.jpeg'

function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [leaderboardData, setLeaderboardData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [cardsPerView, setCardsPerView] = useState(4)

  const testThumbnails = [thumb1, thumb2, thumb3, thumb4]

  const fetchLeaderboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('📊 정적 JSON 파일에서 리더보드 데이터를 로딩 중...')
      
      // 정적 JSON 파일에서 데이터 읽기
      const response = await fetch('/data/current.json')
      
      if (!response.ok) {
        throw new Error(`JSON 파일 로딩 실패: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.data && Array.isArray(result.data)) {
        console.log(`✅ ${result.data.length}개의 리더보드 항목을 로딩했습니다.`)
        console.log(`📅 마지막 업데이트: ${result.lastUpdated}`)
        
        setLeaderboardData(result.data)
        setLastUpdated(new Date(result.lastUpdated))
      } else {
        throw new Error('JSON 파일 형식이 올바르지 않습니다.')
      }
    } catch (err) {
      console.error('❌ 리더보드 데이터 로딩 실패:', err)
      setError(err.message)
      setLeaderboardData([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatViewCount = (count) => {
    if (count >= 10000) {
      return `${Math.floor(count / 10000)}만`
    } else if (count >= 1000) {
      return `${Math.floor(count / 1000)}천`
    }
    return `${count}`
  }

  useEffect(() => {
    fetchLeaderboardData()
    
    // 자동 업데이트 스케줄링 - 매주 월요일 21:00
    const checkAndUpdate = () => {
      const now = new Date()
      const dayOfWeek = now.getDay() // 0=일요일, 1=월요일
      const hour = now.getHours()
      const minute = now.getMinutes()
      
      // 월요일 21:00~21:01 사이에 업데이트
      if (dayOfWeek === 1 && hour === 21 && minute === 0) {
        console.log('자동 업데이트 실행: 매주 월요일 21:00')
        fetchLeaderboardData()
      }
    }
    
    // 1분마다 체크
    const scheduleInterval = setInterval(checkAndUpdate, 60000)
    
    return () => clearInterval(scheduleInterval)
  }, [])

  // Responsive cards per view
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setCardsPerView(1) // Mobile: 1 card
      } else if (width < 1280) {
        setCardsPerView(2) // Tablet: 2 cards
      } else {
        setCardsPerView(5) // Desktop: 5 cards
      }
    }

    handleResize() // Initial check
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // CSS 애니메이션으로 진짜 무한 슬라이드 구현 (JavaScript 타이머 제거)

  // 긴 아이디 폰트 크기 자동 조절 함수
  const getIdFontSize = (id) => {
    if (!id) return 'text-lg'
    const length = id.length
    if (length > 20) return 'text-xs' // 매우 긴 아이디
    if (length > 15) return 'text-sm' // 긴 아이디
    if (length > 10) return 'text-base' // 보통 아이디
    return 'text-lg' // 짧은 아이디
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  const getRankColor = (rank) => {
    if (rank === 1) return 'bg-yellow-500 text-white'
    if (rank === 2) return 'bg-gray-400 text-white'
    if (rank === 3) return 'bg-amber-600 text-white'
    if (rank <= 5) return 'bg-blue-500 text-white'
    if (rank <= 10) return 'bg-green-500 text-white'
    return 'bg-purple-500 text-white'
  }

  const getMedalIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getInstagramUrl = (username) => {
    return `https://www.instagram.com/${username.replace('@', '')}/`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">리더보드를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">데이터를 불러오는 중 오류가 발생했습니다</h2>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button 
              onClick={fetchLeaderboardData}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!leaderboardData || leaderboardData.length === 0) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">리더보드 데이터가 없습니다.</p>
        </div>
      </div>
    )
  }

  const maxIndex = leaderboardData.length - cardsPerView; // Maximum scroll index
  const totalIndicators = maxIndex + 1; // Total number of indicators

  return (
    <div className="leaderboard-main min-h-screen py-8">
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="header-container w-full max-w-6xl text-center mb-8">
          <div className="mobile-header bg-blue-600 text-white py-3 px-4 md:py-4 md:px-8 rounded-lg shadow-lg inline-block mb-6 max-w-full">
            <h1 className="title-text text-base sm:text-lg md:text-2xl lg:text-3xl font-bold leading-tight">
                크리투스에선 매주 새로운 성과가 쏟아지고 있습니다
            </h1>
          </div>
        </div>

        <div className="slider-main w-full max-w-6xl flex flex-col items-center">
          <div className="mobile-container slider-wrapper relative overflow-hidden">
            <div className="slider-track">
              {/* 진짜 무한 슬라이드를 위해 카드를 5번 반복 */}
              {[...leaderboardData, ...leaderboardData, ...leaderboardData, ...leaderboardData, ...leaderboardData].map((item, index) => {
                const originalIndex = index % leaderboardData.length
                const rank = originalIndex + 1

                
                return (
                  <Card 
                    key={`${item["Instagram ID"]}-${index}`}
                    className={`card-item flex-shrink-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
                      hoveredCard === index ? 'scale-105' : ''
                    }`}
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => {
                      const url = item["영상URL"] || getInstagramUrl(item["Instagram ID"])
                      window.open(url, '_blank')
                    }}
                  >
                    <CardContent className="p-0 h-full flex flex-col">
                      <div className="relative flex-1 overflow-hidden rounded-t-lg">
                        <img 
                          src={item["썸네일"] && item["썸네일"].length > 0 ? item["썸네일"][0].url : placeholderImage} 
                          alt={`${item["Instagram ID"]} 썸네일`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = placeholderImage
                          }}
                        />
                        
                        <div className={`absolute top-3 left-3 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${getRankColor(rank)}`}>
                          <span className={rank <= 3 ? 'text-2xl' : 'text-sm'}>
                            {getMedalIcon(rank)}
                          </span>
                        </div>
                        
                        <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-sm font-medium">
                          📅 {item["날짜"]}
                        </div>
                        
                        <div className="absolute bottom-28 left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{item["조회수_한국어"]}</div>
                          </div>
                        </div>
                        

                      </div>
                      
                      <div className="p-4 flex items-center" style={{ minHeight: '72px' }}>
                        <h3 className={`font-bold text-gray-800 break-words ${getIdFontSize(item["Instagram ID"])}`}>
                          {item["Instagram ID"]}
                        </h3>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* CSS 무한 슬라이드로 인해 네비게이션 버튼 및 인디케이터 제거 */}          </div>

        </div>
        </div>
        </div>
  )
}

export default App

