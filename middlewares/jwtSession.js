import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'

dotenv.config() // loading env variables

// retrieving the JWT secret
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET env variable is required')
}

// handle JWT-based session management
export const jwtSession = (req, res, next) => {

    // initialize an empty session object if none exists
    req.session = {
        message: null,
        save: (callback) => {
            // create a clean session data obj excluding save method
            const sessionData = {
                ...req.session,
                save: undefined
            }

            const token = generateToken(sessionData)

            // cookie settings for secure and HTTP-only cookie
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // use secure cookies in production
                samesite: 'strict',
                maxAge: 24 * 60 * 60 * 1000, // expiration (1 day)
                path: '/' // cookie is available across the entire site
            }
            
            // send the cookie with the token as a response
            res.cookie('session', token, cookieOptions)

            // invoke the callback function if provided
            if (callback) callback()
        }
    }

    // check if the session cookies exists and verify the JWT token
    const token = req.cookies?.session
    if (token) {
        try {
            const decoded = verifyToken(token)

            // assign the decoded token data to the session
            req.session = {
                ...decoded,
                save: req.session.save
            }

        } catch (err) {
            console.error('Session validation failed:', err);
            res.clearCookie('session', { path: '/' }); // clear the invalid token cookie
        }
    }

    next(); // proceed with the next middleware or route handler
}

// generate a JWT token from the session data
export const generateToken = (data) => {
    // to exclude the exp and iat properties from the session data
    const { exp, iat, ...cleanData } = data
    return jwt.sign(cleanData, JWT_SECRET, { expiresIn: '1h' })
}

// verify and decode a JWT token
export const verifyToken = (token) => {
    try {
        // verify the token using the secret an decode
        const decoded = jwt.verify(token, JWT_SECRET)
        return decoded
    } catch (err) {
        console.error('Invalid Token:', err)

        // handle token expiration error
        if (err.name === 'TokenExpiredError') {
            console.error('Token expired at:', err.expiredAt)
            throw new Error('Session expired. Please log in again.')
        }
        throw new Error('Invalid token')
    }
}