import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Trophy, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
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

  const testThumbnails = [thumb1, thumb2, thumb3, thumb4]

  const fetchLeaderboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const AIRTABLE_API_KEY = 'patT4JHdBeYWwAiNK.35c9ab03fe7a3dec703efc5c6f837c03fa8410494b098b55879497d5a4f463bc'
      const BASE_ID = 'apphCg257EyPVwr7T'
      const TABLE_NAME = '영상 DB'
      
      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}?sort%5B0%5D%5Bfield%5D=조회수&sort%5B0%5D%5Bdirection%5D=desc`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`
          }
        }
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.records) {
        const transformedData = result.records
          .map(record => ({
            'Instagram ID': record.fields['Instagram ID'] || '@unknown',
            '조회수': record.fields['조회수'] || 0,
            '조회수_한국어': formatViewCount(record.fields['조회수'] || 0),
            '날짜': record.fields['날짜'] || '',
            '카테고리': record.fields['카테고리'] || '기타',
            '캡션': record.fields['캡션'] || '릴스 영상을 확인해보세요!',
            '썸네일': record.fields['썸네일'] || null
          }))
          .sort((a, b) => b["조회수"] - a["조회수"])
          .slice(0, 15)
        
        setLeaderboardData(transformedData)
        setLastUpdated(new Date())
      } else {
        throw new Error('No records found')
      }
    } catch (err) {
      console.error('Error fetching leaderboard data:', err)
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
  }, [])

  useEffect(() => {
    if (!isAutoPlaying || leaderboardData.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const maxIndex = Math.max(0, leaderboardData.length - 4); // 4 cards visible at once
        const totalSlides = Math.ceil(leaderboardData.length / 4);
        return prev >= totalSlides - 1 ? 0 : prev + 1
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, leaderboardData.length])

  const goToPrevious = () => {
    setCurrentIndex(prev => {
      const maxIndex = Math.max(0, leaderboardData.length - 4); // 4 cards visible at once
      const totalSlides = Math.ceil(leaderboardData.length / 4);
      return prev <= 0 ? totalSlides - 1 : prev - 1
    })
  }

  const goToNext = () => {
    setCurrentIndex(prev => {
      const maxIndex = Math.max(0, leaderboardData.length - 4); // 4 cards visible at once
      const totalSlides = Math.ceil(leaderboardData.length / 4);
      return prev >= totalSlides - 1 ? 0 : prev + 1
    })
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  const getCategoryColor = (category) => {
    const colors = {
      '뷰티/미용': 'bg-pink-100 text-pink-800',
      '살림/육아': 'bg-orange-100 text-orange-800',
      '비즈니스': 'bg-blue-100 text-blue-800',
      '헬스케어': 'bg-green-100 text-green-800',
      '퍼스널': 'bg-purple-100 text-purple-800',
      '패션': 'bg-indigo-100 text-indigo-800',
      '기타': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || colors['기타']
  }

  const getRankColor = (rank) => {
    if (rank === 1) return 'bg-yellow-500 text-white'
    if (rank === 2) return 'bg-gray-400 text-white'
    if (rank === 3) return 'bg-amber-600 text-white'
    if (rank <= 5) return 'bg-blue-500 text-white'
    if (rank <= 10) return 'bg-green-500 text-white'
    return 'bg-purple-500 text-white'
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

  const maxIndex = Math.max(0, leaderboardData.length - 4); // 4 cards visible at once
  const totalSlides = Math.ceil(leaderboardData.length / 4); // Calculate total slides based on 4 cards per slide

  return (
    <div className="leaderboard-main min-h-screen py-8">
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="header-container w-full max-w-6xl text-center mb-8">
          <div className="mobile-header bg-blue-600 text-white py-4 px-8 rounded-lg shadow-lg inline-block mb-6">
            <h1 className="title-text text-xl md:text-2xl lg:text-3xl font-bold leading-tight">
              크리투스에선 매주 새로운 성과자가 쏟아지고 있습니다
            </h1>
          </div>
        </div>

        <div className="slider-main w-full max-w-6xl flex flex-col items-center">
          <div className="mobile-container relative overflow-hidden">
            <div 
              className="slider-track flex transition-transform duration-500 ease-in-out gap-2"
              style={{ 
                transform: `translateX(-${currentIndex * (100 / 4)}%)`, // 4 cards visible at once
              }}
            >
              {leaderboardData.map((item, index) => {
                const rank = index + 1

                
                return (
                  <Card 
                    key={`${item["Instagram ID"]}-${index}`}
                    className={`card-item flex-shrink-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
                      hoveredCard === index ? 'scale-105' : ''
                    }`}
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => window.open(getInstagramUrl(item["Instagram ID"]), '_blank')}
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
                        
                        <div className={`absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getRankColor(rank)}`}>
                          #{rank}
                        </div>
                        
                        <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                          📅 {item["날짜"]}
                        </div>
                        
                        <div className="absolute bottom-28 left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{item["조회수_한국어"]}</div>
                          </div>
                        </div>
                        
                        {hoveredCard === index && (
                          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                            <ExternalLink className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4" style={{ minHeight: '120px' }}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-lg text-gray-800">
                            {item["Instagram ID"]}
                          </h3>
                          <Badge className={`text-xs ${getCategoryColor(item["카테고리"])}`}>
                            {item["카테고리"]}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 text-sm line-clamp-3">
                          {item["캡션"] || '릴스 영상을 확인해보세요!'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {leaderboardData.length > 4 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg hover:bg-gray-50 z-10"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg hover:bg-gray-50 z-10"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {totalSlides > 1 && (
            <div className="indicators-container flex justify-center mt-6 space-x-2">
              {Array.from({ length: totalSlides }, (_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentIndex === index 
                      ? 'bg-blue-600 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          )}
        </div>
        </div>
        </div>
  )
}

export default App

