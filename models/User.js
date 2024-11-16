import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }]
})

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next()

    try {
        console.log('Original Password:', this.password)
        const salt = await bcrypt.genSalt(10)
        this.password = await bcrypt.hash(this.password, salt)
        console.log('Hashed Password:', this.password)
        next()
    } catch (err) {
        next(err)
    }
})

userSchema.post('save', (doc, next) => {
    console.log('User saved successfully:', doc)
    next()
})

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model('User', userSchema)

export default User