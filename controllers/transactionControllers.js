import Book from "../models/Book.js"
import Transaction from "../models/Transaction.js"
import { requireLogin } from "../middlewares/middleware.js"

// transactions page and error titles
const transactionsTitle = 'Transactions'
const error500Title = '500 - Internal Server Error'

// fetch all transactions for a logged-in user
export const getTransactions = async (req, res) => {
    const userID = req.session.user ? req.session.user.userID : null

    try {
        // check if the user is logged in before accessing transactions
        if (!requireLogin(req, res, "Please log in to get the transaction details", '/transactions')) return

        // fetch transactions, sorting by borrow date (newest first)
        const transactions = await Transaction.find({ userID })
            .populate('userID') // populate user details
            .populate('bookID') // populate book details
            .sort({ borrowDate: -1 })
            .lean()
        
        res.render('transactions', {
            title: transactionsTitle,
            transactions, 
            message: req.session.message
        })
        delete req.session.message
        req.session.save()

    } catch (err) {
        console.error('Error borrowing book:', err)
        res.status(500).render('500', {
            title: error500Title,
            message: 'Could not retrieve transactions' 
        }) 
    }
}

// handle borrowing a book
export const borrowBook = async (req, res) => {
    const { bookID } = req.body
    const userID = req.session.user ? req.session.user.userID : null

    try {
        const book = await Book.findById(bookID) // fetch book by ID

        // check if the user is logged in before borrowing a book
        if (!requireLogin(req, res, "Please log in to borrow the book.", `/books/${book.ISBN}`)) return

        // ensure the book is available for borrowing
        if (!book || book.status !== 'available') {
            req.session.message = {
                title: 'Error', 
                content: ["The book is currently unavailable."]
            }
            req.session.save()
            return res.redirect(`/books/${book.ISBN}`)
        }

        // create a new transaction for the borrowed book
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

        req.session.message = {
            title: 'Success', 
            content: ["Book borrowed successfully."]
        }
        req.session.save()
        res.redirect(`/books/${book.ISBN}`)

    } catch (err) {
        console.error('Error borrowing book:', err)
        res.status(500).render('500', { 
            title: error500Title,
            message: 'Error borrowing book' })
    }
}

// handle returning a book
export const returnBook = async (req, res) => {
    const { bookID } = req.body
    const userID = req.session.user ? req.session.user.userID : null

    try {
        const book = await Book.findById(bookID)
        // Check if the user is logged in before returning a book
        if (!requireLogin(req, res, "Please log in to return the book.", `/books/${book.ISBN}`)) return;
        
        // find the transaction for the borrowed book
        const transaction = await Transaction.findOne({
            userID,
            bookID,
            status: 'borrowed'
        })
        
        // handle cases where transaction doesn't exist or the book is already returned
        if (!transaction || transaction.status === 'returned') {
            req.session.message = {
                title: 'Error', 
                content: ["Transaction not found or already returned."]
            }
            req.session.save()
            return res.redirect(`/books/${book.ISBN}`)
        }
        
        // Update the transaction's return date and status
        transaction.returnDate = new Date()
        transaction.status = 'returned'
        await transaction.save()
        
        book.status = 'available'
        await book.save()

        req.session.message = {
            title: 'Success', 
            content: ["Book returned successfully."]
        }
        req.session.save()
        res.redirect(`/books/${book.ISBN}`)

    } catch (err) {
        console.error('Error returning book:', err)
        res.status(500).render('500', { 
            title: error500Title,
            message: 'Error returning book'
        })
    }
}