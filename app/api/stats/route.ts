import { connectDB } from '@/component/api-server/mongoose'
import { SurveyResponse } from '@/component/model/survey-response-schema.model'
import { ISurveyStats } from '@/component/interface/survey-response.interface'


export const GET = async () => {
    
    try {
        await connectDB()
        const pipeline = [
            {
                $group: {
                    _id: '$resultType',
                    count: { $sum: 1 }
                }
            }
        ]
        
        const results = await SurveyResponse.aggregate(pipeline)
        
        const stats: ISurveyStats = results.reduce((acc, item) => {
            if (item._id) {
                acc[item._id] = item.count
            }
            return acc
        }, {} as { [key: string]: number })
        
        if (!stats['secure']) stats['secure'] = 0
        if (!stats['anxious']) stats['anxious'] = 0
        if (!stats['avoidant']) stats['avoidant'] = 0
        if (!stats['fearful']) stats['fearful'] = 0
        
        return new Response(JSON.stringify(stats), { status: 200 }) // 200 OK
    } catch {
        return new Response(JSON.stringify({ error: 'Database error' }), { status: 500 }) // 500 Internal Server Error
    }
    
}