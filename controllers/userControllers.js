import User from "../models/User.js"
import bcrypt from 'bcrypt'
import { resetMenuItems } from "../middlewares/middleware.js"

const error400Title = '400 Error'
const error500Title = '500 - Internal Server Error'

export const showRegisterPage = async (req, res) => {
    req.session.hasVisitedDonate = true
    req.session.save()

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
            req.session.message = { title: 'Error', content: errorMessages }
            req.session.save()
            // setModalMessage(req, 'Error', errorMessages) 
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
        req.session.message = { title: 'Success', content: ["User registered successfully."] }
        req.session.save()

        return res.redirect('/login')

    } catch (err) {
        console.error("Error registering user:", err)
        let errorMessages = []
        
        if (err.name === 'ValidationError') {
            errorMessages.push(err.message)
        } else {
            errorMessages.push("Internal server error.")
        }

        req.session.message = { title: error500Title, content: errorMessages }
        req.session.save()
        
        return res.status(500).render('register', {
            title: error500Title,
            error: errorMessages,
            username,
            password,
            confirmPassword,
            email
        })
    }
}

export const showLoginPage = async (req, res) => {
    req.session.hasVisitedDonate = true
    req.session.save()

    const message = req.session.message || null
    delete req.session.message 
    
    res.render('login', {
        title: 'Login',
        isAuthPage: true,
        message
    })
}

export const loginUser = async (req, res) => {
    console.log('Login Request Body:', req.body);
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
            req.session.message = { title: 'Error', content: errorMessages }
            req.session.save()
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
        console.log('Session after login:', req.session)
        
        res.locals.isLoggedIn = req.session.isLoggedIn
        res.locals.isRegistered = req.session.isRegistered
        res.locals.menuItems = resetMenuItems(req)
        
        const redirectTo = req.session.redirectTo || '/'
        console.log("redirectTo link:", redirectTo)
        delete req.session.redirectTo

        req.session.message = { title: 'Success', content: ["User logged in successfully."] }
        req.session.save()

        res.redirect(redirectTo)

    } catch (err) {
        console.error("Login error:", err)
        const errorMessages = ["An error occurred. Please try again later."]

        req.session.message = { title: error500Title, content: errorMessages }
        req.session.save()

        return res.status(500).render('login', {
            title: error500Title,
            error: errorMessages,
            username,
            password
        })
    }
}

export const logoutUser = async (req, res) => {
    try {
        if (req.session) {
            req.session.isLoggedIn = false
            res.locals.isLoggedIn = false
            req.session.isRegistered = false
            res.locals.isRegistered = false
            
            req.session.message = { title: 'Success', content: ["User logged out successfully."] }
            req.session.save(() => {
                res.locals.menuItems = resetMenuItems(req)
                return res.render('index', {
                    title: 'Home',
                    message: req.session.message
                })
            })
        } else {
            return res.redirect('/login')
        }
    } catch (err) {
        console.error('Logout Error:', err)
        req.session.message = {
            title: error500Title,
            content: ['An unexpected error occurred during logout. Please try again later.']
        }
        req.session.save()

        return res.status(500).render('500', {
            title: error500Title,
            message: req.session.message
        })
    }
}