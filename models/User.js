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
    transactions: [{ // array to store reference to transactions (ForeignKey)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }]
})

// middleware to hash the password before saving the user document
userSchema.pre('save', async function(next) {
    // check if the password has been modified
    if (!this.isModified('password')) return next() // skip hashing, if the password is not modified

    try {
        // generate a salt with a strength of 10 rounds
        const salt = await bcrypt.genSalt(10)
        this.password = await bcrypt.hash(this.password, salt)
        next()
    } catch (err) {
        next(err)
    }
})

// method to compare a provided password with the hashed password in the db
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model('User', userSchema)

export default User