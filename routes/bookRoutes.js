import express from 'express'
const router = express.Router()
import { 
    getAllBooks, 
    showDonatePage,
    donateBook, 
    searchBook, 
    getBookByISBN,
    showEditPage,
    editBookByISBN,
    deleteBookByISBN, 
} from '../controllers/bookControllers.js'

router.get('/', getAllBooks)
router.get('/donate', showDonatePage)
router.post('/donate', donateBook)
router.get('/search', searchBook)
router.put('/edit/:isbn', showEditPage)
router.post('/edit/:isbn', editBookByISBN)
router.get('/:isbn', getBookByISBN)
router.delete('/:isbn', deleteBookByISBN) 

export default router