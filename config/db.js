import mongoose, { connect } from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('MongoDB connected successfully')
    } catch(err) {
        console.error('MongoDB connection error:', err)
        process.exit(1)
    }
}