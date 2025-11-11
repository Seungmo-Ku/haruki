// /app/page.tsx
'use client'
import { useMemo, useState } from 'react'
import { ResultType } from '@/component/interface/survey-response.interface'

// --- 타입 정의 ---
type QuestionType = 'anxiety' | 'avoidance'

interface Question {
    id: string
    text: string
    type: QuestionType
}

type Answers = {
    [key: string]: number; // key: 'a1', 'b1', ... / value: 1~5
};

// --- 질문 데이터 ---
const questions: Question[] = [
    {
        id: 'a1',
        text: '💖 (카톡 읽씹) 연인의 카톡 답장이 1시간 이상 늦어지면, \'혹시 내가 뭐 잘못했나?\' 하는 생각이 스멀스멀 올라온다.',
        type: 'anxiety'
    },
    {
        id: 'b1',
        text: '🌵 (나만의 시간) 아무리 사랑하는 사이라도, 주말 내내 꼭 붙어있기보다 나만의 시간이 반드시 필요하다.',
        type: 'avoidance'
    },
    {
        id: 'a2',
        text: '💖 (애정 확인) 나는 연인에게 "사랑해" 같은 애정 표현을 자주 들어야 마음이 놓인다.',
        type: 'anxiety'
    },
    {
        id: 'b2',
        text: '🌵 (혼자 해결) 힘든 일이 생겼을 때, 연인에게 털어놓기보다 일단 혼자 해결하는 게 편하다.',
        type: 'avoidance'
    },
    {
        id: 'a3',
        text: '💖 (나 없이?) 연인이 나 없이 친구들과 신나게 놀고 있으면, 나도 모르게 살짝 서운하다.',
        type: 'anxiety'
    },
    {
        id: 'b3',
        text: '🌵 (비밀의 방) 나의 모든 것을 100% 다 오픈하는 것은 좀 부담스럽다.',
        type: 'avoidance'
    },
    {
        id: 'a4',
        text: '💖 (상상의 나래) 가끔 \'이 사람이 갑자기 날 떠나면 어떡하지?\' 하는 상상을 하곤 한다.',
        type: 'anxiety'
    },
    {
        id: 'b4',
        text: '🌵 (독립 선언) 나는 \'독립적이고 멋진 사람\'으로 보이는 것이 더 중요하다.',
        type: 'avoidance'
    }
]

const totalQuestions = questions.length
const options = [1, 2, 3, 4, 5] // 1점 ~ 5점

// --- 컴포넌트 ---
export default function Home() {
    const [currentStep, setCurrentStep] = useState(0)
    const [answers, setAnswers] = useState<Answers>({})
    const [result, setResult] = useState<ResultType | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    
    const currentQuestion = questions[currentStep]
    const progressPercent = ((currentStep + 1) / totalQuestions) * 100
    
    const resultIntoKorean = useMemo(() => {
        switch (result) {
            case null:
                return '오류가 발생했습니다.'
            case 'secure':
                return '안정형 (안전기지 🏕️)'
            case 'anxious':
                return '불안형 (애정 갈구 💌)'
            case 'avoidant':
                return '회피형 (거리두기 🧊)'
            case 'fearful':
                return '혼란형 (복잡미묘 🎭)'
        }
    }, [result])
    
    // 답변 선택
    const handleSelect = (value: number) => {
        setAnswers({
            ...answers,
            [currentQuestion.id]: value
        })
    }
    
    // 다음 / 이전
    const handleNext = () => {
        if (currentStep < totalQuestions - 1) {
            setCurrentStep(currentStep + 1)
        }
    }
    
    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }
    
    // 최종 제출
    const handleSubmit = async () => {
        if (isLoading) return
        setIsLoading(true)
        setResult(null)
        
        // 점수 계산
        let anxietyScore = 0
        let avoidanceScore = 0
        let anxietyCount = 0
        let avoidanceCount = 0
        
        for (const q of questions) {
            const score = answers[q.id] || 3 // 답변 안했으면 중간값 3
            if (q.type === 'anxiety') {
                anxietyScore += score
                anxietyCount++
            } else {
                avoidanceScore += score
                avoidanceCount++
            }
        }
        
        // API로 전송 (DB 저장)
        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    anxietyScore,
                    avoidanceScore,
                    anxietyCount,
                    avoidanceCount
                })
            })
            
            const data = await response.json() // { resultType: "안정형 (안전기지 🏕️)" }
            setResult(data.resultType)
            
        } catch (error) {
            console.error('Submit failed:', error)
            setResult(null)
        } finally {
            setIsLoading(false)
        }
    }
    
    // --- 렌더링 ---
    
    if (isLoading) {
        return <div className='flex items-center justify-center h-screen'><h2>결과를 분석 중입니다...</h2></div>
    }
    
    if (result) {
        return (
            <div className='w-full h-full py-6 px-2 bg-white flex flex-col items-center justify-start'>
                <h2 className='text-lg text-black'>당신의 애착 유형은...</h2>
                <h1 className='text-4xl font-bold text-blue-600 my-4'>{resultIntoKorean}</h1>
                {/* 여기에 유형별 설명 추가 */}
                {/* <p>당신은 어쩌구 저쩌구...</p> */}
                <button
                    className='mt-6 px-4 py-2 bg-black rounded-lg font-semibold text-white'
                    onClick={() => {
                        setResult(null)
                        setAnswers({})
                        setCurrentStep(0)
                    }}
                >
                    다시하기
                </button>
            </div>
        )
    }
    
    return (
        <div className='w-full h-full py-6 px-2 bg-white flex flex-col items-center justify-start'>
            {/* 프로그레스 바 */}
            <div className='w-full bg-gray-200 rounded-full h-2.5 mb-2'>
                <div
                    className='bg-blue-600 h-2.5 rounded-full'
                    style={{ width: `${progressPercent}%` }} // 이 부분만 인라인 스타일
                ></div>
            </div>
            <p className='text-center text-sm text-gray-500 mb-6'>{currentStep + 1} / {totalQuestions}</p>
            
            {/* 질문 */}
            <h2 className='text-xl font-semibold text-center min-h-[120px] my-6 text-black break-keep'>
                {currentQuestion.text}
            </h2>
            
            {/* 선택지 (1점 ~ 5점) */}
            <div className='w-full max-w-[500px] flex justify-between items-center my-8 px-4'>
                <span className='text-12-regular text-gray-500'>전혀 아님</span>
                {options.map((value) => (
                    <button
                        key={value}
                        className={`w-10 h-10 rounded-full font-bold transition-colors
                                ${answers[currentQuestion.id] === value
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-500'}
                            `}
                        onClick={() => handleSelect(value)}
                    >
                        {value}
                    </button>
                ))}
                <span className='text-sm text-gray-500'>매우 공감</span>
            </div>
            
            {/* 네비게이션 버튼 */}
            <div className='flex w-full max-w-[500px] justify-between mt-10'>
                <button
                    className='px-6 py-2 border rounded-lg font-semibold disabled:opacity-50 bg-black text-white'
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                >
                    이전
                </button>
                
                {currentStep < totalQuestions - 1 ? (
                    <button
                        className='px-6 py-2 border rounded-lg font-semibold disabled:opacity-50 bg-black text-white'
                        onClick={handleNext}
                        disabled={!answers[currentQuestion.id]}
                    >
                        다음
                    </button>
                ) : (
                     <button
                         className='px-6 py-2 bg-blue-600 rounded-lg font-bold disabled:opacity-50 text-white'
                         onClick={handleSubmit}
                         disabled={!answers[currentQuestion.id]}
                     >
                         결과 보기
                     </button>
                 )}
            </div>
        </div>
    )
}