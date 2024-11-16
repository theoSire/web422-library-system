import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    bookID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
    },
    bookTitle: {
        type: String,
        required: true,
    },
    borrowDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    returnDate: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        enum: ['borrowed', 'returned'],
        default: 'borrowed'
    }
})

const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction