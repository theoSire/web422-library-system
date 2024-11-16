import express from 'express'
const router = express.Router()
import { borrowBook, returnBook, getTransactions } from '../controllers/transactionControllers.js'
// import { ensureAuthenticated } from '../middlewares/authentication.js'

router.get('/', getTransactions)
router.post('/borrow', borrowBook)
router.post('/return', returnBook)

export default router