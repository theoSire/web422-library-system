import mongoose from 'mongoose'

const defaultImagePath = '/static/img/default_image.png'

const bookSchema = new mongoose.Schema({
    ISBN: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
    },
    image: { 
        type: String,
        default: defaultImagePath,
    },
    status: {
        type: String,
        enum: ['available', 'borrowed'],
        default: 'available',
    },
})

const Book = mongoose.model('Book', bookSchema)

export default Book