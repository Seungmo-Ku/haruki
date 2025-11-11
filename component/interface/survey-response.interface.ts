export type ResultType = 'secure' | 'anxious' | 'avoidant' | 'fearful'

export interface ISurveyResponse {
    anxietyScore: number
    avoidanceScore: number
    resultType: ResultType
    createdAt?: Date
    updatedAt?: Date
}

export type ISurveyStats = Partial<Record<ResultType, number>>