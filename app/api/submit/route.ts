import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/component/api-server/mongoose'
import { SurveyResponse } from '@/component/model/survey-response-schema.model'
import { ResultType } from '@/component/interface/survey-response.interface'


export const POST = async (req: NextRequest) => {
    try {
        await connectDB()
        const body = await req.json()
        
        const { anxietyScore, avoidanceScore, anxietyCount, avoidanceCount } = body
        
        if (typeof anxietyScore !== 'number' || typeof avoidanceScore !== 'number' || typeof anxietyCount !== 'number' ||
            typeof avoidanceCount !== 'number' || anxietyCount <= 0 || avoidanceCount <= 0) {
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 }) // 400 Bad Request
        }
        
        const anxietyPoint = anxietyScore / anxietyCount
        const avoidancePoint = avoidanceScore / avoidanceCount
        
        let resultType: ResultType = 'secure'
        if (anxietyPoint >= 3.0 && avoidancePoint < 3.0) {
            resultType = 'anxious'
        } else if (anxietyPoint < 3.0 && avoidancePoint >= 3.0) {
            resultType = 'avoidant'
        } else if (anxietyPoint >= 3.0 && avoidancePoint >= 3.0) {
            resultType = 'fearful'
        }
        
        const newSubmit = await SurveyResponse.create({
            anxietyScore,
            avoidanceScore,
            resultType
        })
        return NextResponse.json(newSubmit, { status: 201 }) // 201 Created
    } catch {
        return NextResponse.json({ error: 'Database error' }, { status: 500 }) // 500 Internal Server Error
    }
}
