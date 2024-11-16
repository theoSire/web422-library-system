import express from 'express'
const router = express.Router()
import { getAllBooks, searchBook, getBookByISBN, donateBook, deleteBookByISBN, showDonatePage } from '../controllers/bookControllers.js'

router.get('/', getAllBooks)
router.get('/donate', showDonatePage)
router.post('/donate', donateBook)
router.get('/search', searchBook)
router.get('/:isbn', getBookByISBN)
router.delete('/:isbn', deleteBookByISBN) 

export default router