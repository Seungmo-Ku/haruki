'use client'

import { ResultType } from '@/component/interface/survey-response.interface'
import { useState, useEffect, useCallback } from 'react'

// API 응답 타입 정의
type Stats = {
    [key: string]: number; // e.g., { "secure": 10, "anxious": 5 }
};

// 그래프 바 색상 (선택 사항)
const TYPE_COLORS: { [key: string]: string } = {
    'secure': 'bg-green-500',
    'anxious': 'bg-yellow-500',
    'avoidant': 'bg-blue-500',
    'fearful': 'bg-red-500'
}

// 타입 키워드로 색상 찾기
const getBarColor = (type: ResultType) => {
    if (type === 'secure') return TYPE_COLORS['secure']
    if (type === 'anxious') return TYPE_COLORS['anxious']
    if (type === 'avoidant') return TYPE_COLORS['avoidant']
    if (type === 'fearful') return TYPE_COLORS['fearful']
    return 'bg-gray-500'
}

export default function ResultsPage() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // 데이터 패칭 함수
    const fetchStats = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch('/api/stats', {
                cache: 'no-store' // 항상 최신 데이터를 가져옴
            })
            if (!response.ok) {
                throw new Error('데이터를 불러오는 데 실패했습니다.')
            }
            const data: Stats = await response.json()
            setStats(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류')
        } finally {
            setIsLoading(false)
        }
    }, []) // useCallback으로 감싸기
    
    // 1. 페이지 로드 시 데이터 가져오기
    useEffect(() => {
        fetchStats()
    }, [fetchStats])
    
    // 2. 5초마다 자동으로 데이터 새로고침 (선택 사항)
    useEffect(() => {
        const interval = setInterval(() => {
            fetchStats()
        }, 5000) // 5초
        return () => clearInterval(interval) // 컴포넌트 언마운트 시 인터벌 정리
    }, [fetchStats])
    
    // --- 계산 (유형별) ---
    const sortedStats = stats
                        ? Object.entries(stats).sort(([, countA], [, countB]) => countB - countA)
                        : []
    
    const totalCount = sortedStats.reduce((sum, [, count]) => sum + count, 0)
    const maxCount = sortedStats.length > 0 ? sortedStats[0][1] : 1 // 1등의 카운트
    
    const resultIntoKorean = useCallback((type: ResultType) => {
        switch (type) {
            case 'secure':
                return '안정형 (안전기지 🏕️)'
            case 'anxious':
                return '불안형 (애정 갈구 💌)'
            case 'avoidant':
                return '회피형 (거리두기 🧊)'
            case 'fearful':
                return '혼란형 (복잡미묘 🎭)'
        }
    }, [])
    
    // --- [NEW] 계산 (안정형 vs 그 외) ---
    const secureCount = stats && stats['secure'] ? stats['secure'] : 0
    const otherCount = totalCount - secureCount
    
    // [NEW] 안정형/그외 그래프를 위한 데이터 배열
    const binaryStats = [
        { type: 'secure', label: resultIntoKorean('secure'), count: secureCount, color: getBarColor('secure') },
        { type: 'others', label: '그 외 유형', count: otherCount, color: 'bg-gray-500' } // '그 외'는 회색으로
    ].sort((a, b) => b.count - a.count) // 이것도 정렬
    
    // [NEW] 안정형/그외 그래프의 최대값 (0으로 나누기 방지)
    const binaryMaxCount = binaryStats.length > 0 && binaryStats[0].count > 0 ? binaryStats[0].count : 1
    
    // --- 렌더링 (유형별) ---
    const renderContent = () => {
        if (isLoading && !stats) { // 첫 로딩
            return <p className='text-center'>결과를 불러오는 중...</p>
        }
        if (error) {
            return <p className='text-center text-red-500'>오류: {error}</p>
        }
        if (totalCount === 0) {
            return <p className='text-center'>아직 제출된 결과가 없습니다.</p>
        }
        
        // 막대 그래프 렌더링
        return (
            <div className='space-y-5'>
                {sortedStats.map(([type, count]) => {
                    const percentage = (count / maxCount) * 100 // 1등 대비 비율
                    const totalPercentage = ((count / totalCount) * 100).toFixed(1) // 전체 대비 비율
                    
                    return (
                        <div key={type} className='w-full'>
                            {/* 레이블 (타입, 인원, %) */}
                            <div className='flex justify-between mb-1'>
                                <span className='text-base font-medium text-white'>{resultIntoKorean(type as ResultType)}</span>
                                <span className='text-base font-bold text-white'>{count}명 ({totalPercentage}%)</span>
                            </div>
                            {/* 막대 그래프 바 */}
                            <div className='w-full bg-gray-200 rounded-full h-6 overflow-hidden'>
                                <div
                                    className={`h-6 rounded-full transition-all duration-500 ease-out ${getBarColor(type as ResultType)}`}
                                    style={{ width: `${percentage}%` }}
                                >
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }
    
    // --- [NEW] 렌더링 (안정형 vs 그 외) ---
    const renderBinaryGraph = () => {
        // 로딩, 에러, 0개 케이스는 renderContent()가 처리하므로 여기선 0개만 체크
        if (totalCount === 0) return null
        
        return (
            <div className='space-y-5'>
                {binaryStats.map(({ type, label, count, color }) => {
                    const percentage = (count / binaryMaxCount) * 100 // 1등(안정형/그외) 대비 비율
                    const totalPercentage = ((count / totalCount) * 100).toFixed(1) // 전체 대비 비율
                    
                    return (
                        <div key={type} className='w-full'>
                            <div className='flex justify-between mb-1'>
                                <span className='text-base font-medium text-white'>{label}</span>
                                <span className='text-base font-bold text-white'>{count}명 ({totalPercentage}%)</span>
                            </div>
                            <div className='w-full bg-gray-200 rounded-full h-6 overflow-hidden'>
                                <div
                                    className={`h-6 rounded-full transition-all duration-500 ease-out ${color}`}
                                    style={{ width: `${percentage}%` }}
                                >
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }
    
    return (
        <div className='w-full h-full p-6 bg-black'>
            <div className='flex justify-between items-center mb-6'>
                <h1 className='text-3xl font-bold text-white'>📊 실시간 집계 결과</h1>
                <button
                    onClick={fetchStats}
                    disabled={isLoading}
                    className='px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-blue-700'
                >
                    {isLoading ? '...' : '수동 새로고침'}
                </button>
            </div>
            <p className='text-lg text-white mb-6 pb-4'>
                총 <strong className='text-xl text-white'>{totalCount}</strong>명이 참여했습니다.
            </p>
            
            {/* [NEW] 2번 그래프: 안정형 vs 그 외 (데이터가 있을 때만 렌더링) */}
            {totalCount > 0 && (
                <>
                    <h2 className='text-2xl font-semibold text-white mt-10 mb-4 pt-4 border-t'>안정형 vs 그 외</h2>
                    {renderBinaryGraph()}
                </>
            )}
            
            {/* [NEW] 1번 그래프: 유형별 상세 */}
            <h2 className='text-2xl font-semibold text-white mb-4 border-t mt-6 pt-4'>유형별 상세</h2>
            {renderContent()}
        </div>
    )
}