import express from 'express'
const router = express.Router()
import { registerUser, loginUser, logoutUser, showLoginPage, showRegisterPage } from '../controllers/userControllers.js'

router.get('/register', showRegisterPage)
router.get('/login', showLoginPage)
router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/logout', logoutUser)

export default router