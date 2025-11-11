import mongoose from 'mongoose'


let isConnected = false

export const connectDB = async () => {
    if (isConnected) return
    
    try {
        await mongoose.connect(process.env.MONGODB_URI!)
        isConnected = true
    } catch (err) {
        console.error('MongoDB connection error:', err)
    }
}