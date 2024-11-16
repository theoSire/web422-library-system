import Book from "../models/Book.js"
import Transaction from "../models/Transaction.js"
import { requireLogin, setModalMessage } from "../middlewares/authentication.js"

const error500Title = '500 - Internal Server Error'
const transactionsTitle = 'Transactions'

export const getTransactions = async (req, res) => {
    const userID = req.session.user ? req.session.user.userID : null

    try {
        if (!requireLogin(req, res, "Please log in to get the transaction details", '/transactions')) return

        const transactions = await Transaction.find({ userID })
            .populate('userID')
            .populate('bookID')
            .sort({ borrowDate: -1 })
            .lean()
        res.render('transactions', {
            title: transactionsTitle,
            transactions, 
            message: req.session.message
        })
        delete req.session.message
    } catch (err) {
               console.error('Error borrowing book:', err)
        res.status(500).render('500', {
            title: error500Title,
            message: 'Could not retrieve transactions' 
        }) 
    }
}

export const borrowBook = async (req, res) => {
    const { bookID } = req.body
    const userID = req.session.user ? req.session.user.userID : null

    try {
        const book = await Book.findById(bookID)

        if (!requireLogin(req, res, "Please log in to borrow the book.", `/books/${book.ISBN}`)) return

        if (!book || book.status !== 'available') {
            setModalMessage(req, 'Error', "The book is currently unavailable.")
            return res.redirect(`/books/${book.ISBN}`)
        }

        const transaction = new Transaction({ 
            userID,
            bookID,
            bookTitle: book.title,
            borrowDate: new Date(),
            status: 'borrowed'
        })

        await transaction.save()

        book.status = 'borrowed'
        await book.save()

        setModalMessage(req, 'Success', "Book borrowed successfully.")
        res.redirect(`/books/${book.ISBN}`)
    } catch (err) {
        console.error('Error borrowing book:', err)
        res.status(500).render('500', { 
            title: error500Title,
            message: 'Error borrowing book' })
    }
}

export const returnBook = async (req, res) => {
    const { bookID } = req.body
    const userID = req.session.user ? req.session.user.userID : null

    try {
        const book = await Book.findById(bookID)
        if (!requireLogin(req, res, "Please log in to return the book.", `/books/${book.ISBN}`)) return;

        const transaction = await Transaction.findOne({
            userID,
            bookID,
            status: 'borrowed'
        })
        
        if (!transaction || transaction.status === 'returned') {
            setModalMessage(req, 'Error', "Transaction not found or already returned.")
            return res.redirect(`/books/${book.ISBN}`)
        }
        
        transaction.returnDate = new Date()
        transaction.status = 'returned'
        await transaction.save()
        
        book.status = 'available'
        await book.save()

        setModalMessage(req, 'Success', "Book returned successfully.")
        res.redirect(`/books/${book.ISBN}`)
    } catch (err) {
        console.error('Error returning book:', err)
        res.status(500).render('500', { 
            title: error500Title,
            message: 'Error returning book'
        })
    }
}