import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET env variable is required')
}

export const jwtSession = (req, res, next) => {
    req.session = {
        message: null,
        save: (callback) => {
            const sessionData = {
                ...req.session,
                save: undefined
            }

            const token = generateToken(sessionData)

            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                samesite: 'strict',
                maxAge: 24 * 60 * 60 * 1000,
                path: '/'
            }

            res.cookie('session', token, cookieOptions)
            if (callback) callback()
        }
    }

    const token = req.cookies?.session

    if (token) {
        try {
            const decoded = verifyToken(token)

            req.session = {
                ...decoded,
                save: req.session.save
            }
        } catch (err) {
            console.error('Session validation failed:', err);
            res.clearCookie('session', { path: '/' });
        }
    }

    next();
}

export const generateToken = (data) => {
    const { exp, iat, ...cleanData } = data
    return jwt.sign(cleanData, JWT_SECRET, { expiresIn: '1h' })
}

export const verifyToken = (token) => {
    if (!token) {
        throw new Error('Token not provided')
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        return decoded
    } catch (err) {
        console.error('Invalid Token:', err)
        if (err.name === 'TokenExpiredError') {
            console.error('Token expired at:', err.expiredAt)
            throw new Error('Session expired. Please log in again.')
        } else {
            throw new Error('Invalid token')
        }
    }
}