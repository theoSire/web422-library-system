import express from 'express'
const router = express.Router()
import { borrowBook, returnBook, getTransactions } from '../controllers/transactionControllers.js'

router.get('/', getTransactions)
router.post('/borrow', borrowBook)
router.post('/return', returnBook)

export default router