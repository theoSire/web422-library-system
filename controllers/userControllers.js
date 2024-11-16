import User from "../models/User.js"
import bcrypt from 'bcrypt'
import { resetMenuItems, setModalMessage } from "../middlewares/middleware.js"

const error400Title = '400 Error'
const error500Title = '500 - Internal Server Error'

export const showRegisterPage = async (req, res) => {
    req.session.hasVisitedDonate = true

    const message = req.session.message || null
    delete req.session.message
    
    res.render('register', {
        title: 'Register',
        isAuthPage: true,
        message
    })
}

export const registerUser = async (req, res) => {
    const { username, password, confirmPassword, email } = req.body
    const errorMessages = []
    req.session.isAuthPage = true

    try {
        if (password !== confirmPassword) {
            errorMessages.push("Passwords do not match.")
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] })

        if (existingUser) {
            if (existingUser.username === username) {
                errorMessages.push("Username already exists. Please choose another.")
            }
            if (existingUser.email === email) {
                errorMessages.push("Email already exists. Please choose another.")
            }
        }

        if (errorMessages.length > 0) {
            setModalMessage(req, 'Error', errorMessages) 
            return res.status(400).render('register', {
                title: error400Title,
                message: req.session.message,
                username,
                password,
                confirmPassword,
                email
            })
        }

        const newUser = new User({ username, password, email })
        await newUser.save()

        req.session.isRegistered = true
        req.session.user = { username, email }
        setModalMessage(req, 'Success', "User registered successfully.")

        return res.redirect('/login')

    } catch (err) {
        console.error("Error registering user:", err)
        let errorMessages = []
        
        if (err.name === 'ValidationError') {
            errorMessages.push(err.message)
        } else {
            errorMessages.push("Internal server error.")
        }
        
        return res.status(500).render('register', {
            title: error500Title,
            error: errorMessages,
            username,
            password,
            confirmPassword,
            email
        })
    } finally {
        delete req.session.message
    }
}

export const showLoginPage = async (req, res) => {
    req.session.hasVisitedDonate = true

    const message = req.session.message || null
    delete req.session.message 
    
    res.render('login', {
        title: 'Login',
        isAuthPage: true,
        message
    })
}

export const loginUser = async (req, res) => {
    const { username, password } = req.body
    const errorMessages = []
    req.session.isAuthPage = true

    try {
        const user = await User.findOne({ username })
        
        if (!user) {
            errorMessages.push("User not found. Please check your username.")
        } else if (!(await bcrypt.compare(password, user.password))) {
            errorMessages.push("Invalid credentials. Please try again.")
        }

        if (errorMessages.length > 0) {
            setModalMessage(req, 'Error', errorMessages) 
            return res.status(400).render('login', {
                title: error400Title,
                message: req.session.message,
                username,
                password
            })
        }

        req.session.isLoggedIn = true
        req.session.isRegistered = true
        req.session.user = { 
            userID: user._id,
            username, 
            email: user.email 
        }
        
        res.locals.isLoggedIn = req.session.isLoggedIn
        res.locals.isRegistered = req.session.isRegistered
        res.locals.menuItems = resetMenuItems(req)
        
        const redirectTo = req.session.redirectTo || '/'
        delete req.session.redirectTo

        setModalMessage(req, 'Success', "User logged in successfully.")
        res.redirect(redirectTo)

    } catch (err) {
        console.error("Login error:", err)
        errorMessages.push("An error occurred. Please try again later.")
        return res.status(500).render('login', {
            title: error500Title,
            error: errorMessages,
            username,
            password
        })
    } finally {
        delete req.session.message
    }
}

export const logoutUser = async (req, res) => {
    try {

        if (req.session) {
            req.session.isLoggedIn = false
            res.locals.isLoggedIn = false
            req.session.isRegistered = false
            res.locals.isRegistered = false
    
            req.session.destroy((err) => {
                if (err) {
                    return res.status(500).render('error', {
                        title: error500Title,
                        message: 'Unable to log out. Please try again later.'
                    })
                }
    
                res.locals.menuItems = resetMenuItems(req)
                const message = { title: 'Success', content: ["User logged out successfully."] }
                return res.render('index', {
                    title: 'Home',
                    message 
                })
            })
    
        } else {
            return res.redirect('/login')
        }
    } catch (err) {
        console.error('Logout Error:', error)
        return res.status(500).render('500', {
            title: error500Title,
            message: 'An unexpected error occurred during logout. Please try again later.'
        })
    }
}