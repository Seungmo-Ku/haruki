import mongoose from 'mongoose'


const surveyResponseSchema = new mongoose.Schema({
    anxietyScore: { type: Number, required: true, min: 0 },
    avoidanceScore: { type: Number, required: true, min: 0 },
    resultType: { type: String, enum: ['secure', 'anxious', 'avoidant', 'fearful'], required: true }
}, { timestamps: true })

export const SurveyResponse = mongoose.models.SurveyResponse || mongoose.model('SurveyResponse', surveyResponseSchema)