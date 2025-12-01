import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/component/api-server/mongoose'
import { SurveyResponse } from '@/component/model/survey-response-schema.model'
import { ResultType } from '@/component/interface/survey-response.interface'

// 💡 밸런스 패치: 3.0 -> 3.2로 상향 조정
// 이유: "보통이다(3점)"라고 응답한 사람들을 '안정형' 쪽으로 흡수하기 위함입니다.
// 3.0일 때는 3점 평균인 사람이 '공포형(불안높음/회피높음)'으로 빠지기 쉽지만,
// 3.2로 올리면 3점 초반대까지 '안정형'으로 분류되어 비율이 약 25~30% 정도로 늘어날 것입니다.
const THRESHOLD = 3.2;

export const POST = async (req: NextRequest) => {
    try {
        await connectDB()
        const body = await req.json()
        
        const { anxietyScore, avoidanceScore, anxietyCount, avoidanceCount } = body
        
        // 유효성 검사
        if (typeof anxietyScore !== 'number' || typeof avoidanceScore !== 'number' ||
            typeof anxietyCount !== 'number' || typeof avoidanceCount !== 'number' ||
            anxietyCount <= 0 || avoidanceCount <= 0) {
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
        }
        
        // 평균 점수 계산
        const anxietyPoint = anxietyScore / anxietyCount
        const avoidancePoint = avoidanceScore / avoidanceCount
        
        let resultType: ResultType = 'secure'
        
        // 4분면 로직 적용 (THRESHOLD 기준으로 분류)
        if (anxietyPoint >= THRESHOLD && avoidancePoint < THRESHOLD) {
            resultType = 'anxious' // 불안형 (불안 높음 / 회피 낮음)
        } else if (anxietyPoint < THRESHOLD && avoidancePoint >= THRESHOLD) {
            resultType = 'avoidant' // 회피형 (불안 낮음 / 회피 높음)
        } else if (anxietyPoint >= THRESHOLD && avoidancePoint >= THRESHOLD) {
            resultType = 'fearful' // 혼란형 (둘 다 높음)
        }
        // 그 외 (둘 다 THRESHOLD 미만) -> secure (안정형)
        
        const newSubmit = await SurveyResponse.create({
            anxietyScore: anxietyPoint,
            avoidanceScore: avoidancePoint,
            resultType
        })
        
        return NextResponse.json(newSubmit, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
}