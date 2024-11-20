import User from "../models/User.js"
import bcrypt from 'bcrypt'
import { resetMenuItems } from "../middlewares/middleware.js"

// error page titles
const error400Title = '400 Error'
const error500Title = '500 - Internal Server Error'

// show the registratioin page
export const showRegisterPage = async (req, res) => {
    req.session.hasVisitedDonate = true
    
    const message = req.session.message || null
    delete req.session.message
    req.session.save()
    
    res.render('register', {
        title: 'Register',
        isAuthPage: true,
        message
    })
}

// handle user registration
export const registerUser = async (req, res) => {
    const { username, password, confirmPassword, email } = req.body
    const errorMessages = []

    try {
        // check if passwords match
        if (password !== confirmPassword) {
            errorMessages.push("Passwords do not match.")
        }

        // check if the username and email already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] })
        if (existingUser) {
            if (existingUser.username === username) {
                errorMessages.push("Username already exists. Please choose another.")
            }
            if (existingUser.email === email) {
                errorMessages.push("Email already exists. Please choose another.")
            }
        }

        // display the validation errors, if any
        if (errorMessages.length > 0) {
            req.session.message = { title: 'Error', content: errorMessages }
            req.session.save()

            return res.status(400).render('register', {
                title: error400Title,
                message: req.session.message,
                username,
                password,
                confirmPassword,
                email
            })
        }

        // create and save new user if there are no errors
        const newUser = new User({ username, password, email })
        await newUser.save()

        // set session variables after successful registration
        req.session.isRegistered = true
        req.session.user = { username, email }
        req.session.message = { title: 'Success', content: ["User registered successfully."] }
        req.session.save()

        return res.redirect('/login')

    } catch (err) {
        console.error("Error registering user:", err)
        let errorMessages = []
        
        // check if the error is a validation error from mongoose
        if (err.name === 'ValidationError') {
            errorMessages.push(err.message)
        } else {
            errorMessages.push("Internal server error.")
        }

        // set error message and render the registration page again with error details
        req.session.message = { title: error500Title, content: errorMessages }
        req.session.save()
        
        return res.status(500).render('register', {
            title: error500Title,
            message: req.session.message,
            username,
            password,
            confirmPassword,
            email
        })
    }
}

// show the login page
export const showLoginPage = async (req, res) => {
    req.session.hasVisitedDonate = true

    const message = req.session.message || null
    delete req.session.message
    req.session.isAuthPage = true
    req.session.save()
    
    res.render('login', {
        title: 'Login',
        isAuthPage: true,
        message
    })
}

// handle user login
export const loginUser = async (req, res) => {
    const { username, password } = req.body
    const errorMessages = []
    req.session.isAuthPage = true

    try {
        const user = await User.findOne({ username })
        
        // check if the user exists and if the password matches
        if (!user) {
            errorMessages.push("User not found. Please check your username.")
        } else if (!(await bcrypt.compare(password, user.password))) {
            errorMessages.push("Invalid credentials. Please try again.")
        }

        // display validation errors, if any
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

        // set session variable after successful login
        req.session.isLoggedIn = true
        req.session.isRegistered = true
        req.session.user = { 
            userID: user._id,
            username, 
            email: user.email 
        }
        
        // update local variables for menu items and authentication status
        res.locals.isLoggedIn = req.session.isLoggedIn
        res.locals.isRegistered = req.session.isRegistered
        res.locals.menuItems = resetMenuItems(req)
        
        // redirect to the appropriate page after login
        const redirectTo = req.session.redirectTo || '/'
        delete req.session.redirectTo

        // set success message in session
        req.session.message = { title: 'Success', content: ["User logged in successfully."] }
        req.isAuthPage = false
        req.session.save()

        res.redirect(redirectTo)

    } catch (err) {
        console.error("Login error:", err)
        const errorMessages = ["An error occurred. Please try again later."]

        req.session.message = { title: error500Title, content: errorMessages }
        req.session.save()

        return res.status(500).render('login', {
            title: error500Title,
            message: req.session.message,
            username,
            password
        })
    }
}

// handle user logout
export const logoutUser = async (req, res) => {
    try {
        if (req.session) {
            // log the user out by clearing session variables
            req.session.isLoggedIn = false
            req.session.isRegistered = false
            
            req.session.message = {
                title: 'Success', 
                content: ["User logged out successfully."]
            }

            // save the session and render the home page
            req.session.save(() => {
                res.locals.menuItems = resetMenuItems(req)
                res.render('index', {
                    title: 'Home',
                    message: req.session.message
                })
                delete req.session.message
                req.session.save()
            })
        } else {
            // if no session exists, redirect to login page
            return res.redirect('/login')
        }
    } catch (err) {
        console.error('Logout Error:', err)

        return res.status(500).render('500', {
            title: error500Title,
            message: 'An unexpected error occurred during logout. Please try again later.'
        })
    }
}