import Book from "../models/Book.js"
import Transaction from "../models/Transaction.js";
import { requireLogin } from "../middlewares/middleware.js";

const error400Title = '400 Error'
const error500Title = '500 - Internal Server Error'
const donateTitle = 'Donate'
const booksTitle = 'Book List'

export const getAllBooks = async (req, res) => {
    try {
        const books = await Book.find().lean()
        res.render('books', {
            title: booksTitle,
            books, 
            resultsTitle: "Book List",
            message: req.session.message,
            isAuthPage: false
        })
        delete req.session.message
        req.session.save()

    } catch (err) {
        console.error('Error fetching books:', err)
        res.status(500).render('error', { 
            title: error500Title,
            message: 'Error retrieving books',
            isAuthPage: false
        })
    }
}

export const searchBook = async (req, res) => {
    const query = req.query.query
    
    try {
         const books = await Book.find({
            title: { $regex: new RegExp(query, 'i') }
        }).lean();

        if (books.length === 0) {
            return res.status(404).render('error', { 
                title: error400Title,
                message: 'No books found.',
                query,
                isAuthPage: false
            })
        }
        res.render('books', { 
            title: `${query} - Search`,
            books,
            query,
            resultsTitle: `Search Results for: ${query}`,
            isAuthPage: false
        })

    } catch (err) {
        console.error('Error searching for books:', err)
        res.status(500).render('500', { 
            title: error500Title,
            message: 'Error searching for books.',
            query,
            isAuthPage: false
        })
    }
}

export const getBookByISBN = async (req, res) => {
    const { isbn } = req.params
    try {
        const book = await Book.findOne({ ISBN: isbn }).lean()
        if (!book) {
            return res.status(404).render('error', { 
                title: error400Title,
                message: 'Book not found' 
            })
        }

        const transaction = await Transaction.findOne({
            bookID: book._id,
            status: 'borrowed'
        }).populate('userID').lean()

        const userID = req.session.user ? req.session.user.userID.toString() : null

        const isBookBorrowed = transaction ? true : false
        const isUserAlreadyBorrowed = transaction && transaction.userID._id.toString() === userID

        res.render('book', {
            title: `${book.booksTitle}`,
            book,
            isBookBorrowed,
            isUserAlreadyBorrowed,
            message: req.session.message
        })
        delete req.session.message
        req.session.save()

    } catch (err) {
        console.error(err)
        res.status(500).render('error', { 
            title: error500Title,
            message: 'Error retrieving the book' 
        })
    }
}

export const showDonatePage = async (req, res) => {
    if (!requireLogin(req, res, "Please log in to donate the book.", '/books/donate')) return

    const message = req.session.message || null
    delete req.session.message 
    req.session.hasVisitedDonate = true
    req.session.save()
    res.render('donate', { 
        title: donateTitle,
        message 
    })
}

export const donateBook = async (req, res) => {
    const { ISBN, title, author, year, image } = req.body
    try {
        if (!requireLogin(req, res, "Please log in to donate the book.", '/books/donate')) return

        const donation = new Book({
            ISBN,
            title,
            author,
            year,
            image,
            status: 'available',
            isAvailable: true
        })

        req.session.message = {
            title: 'Success', 
            content: ["Book donated successfully!"]
        }
        req.session.save()

        await donation.save()
        res.render('book', {
            title,
            book: donation.toObject(), 
            message: req.session.message
        })
        delete req.session.message
        req.session.save()

    } catch (err) {
        let errorMessages = []
        
        if (err.code === 11000) {
            errorMessages.push('A book with this ISBN already exists.')
            req.session.message = {
                title: 'Error',
                content: errorMessages
            }
            return res.status(400).render('donate', {
                title: error400Title,
                message: req.session.message,
                ISBN,
                title,
                author,
                year,
                image,
            })
        } else if (err.name === 'ValidationError') {
            errorMessages.push(err.message)
        } else {
            errorMessages.push("Internal server error.")
        }

        req.session.message = {
                title: error500Title,
                content: errorMessages
        }
        req.session.save()

        return res.status(500).render('donate', {
            title: error500Title,
            error: errorMessages,
            ISBN,
            title,
            author,
            year,
            image,
        })
    }
}

export const deleteBookByISBN = async (req, res) => {
    const { isbn } = req.params
    try {
        if (!requireLogin(req, res, "Please log in to delete the book.", `/books/${isbn}`)) return;

        const deletedBook = await Book.findOneAndDelete({ ISBN: isbn })
        if (!deletedBook) {
            req.session.message = {
                title: 'Error', 
                content: [`Book with ISBN ${isbn} not found`]
            }
            req.session.save()
            return res.redirect('/books')
        }
       
        req.session.message = {
            title: 'Success', 
            content: ["Book deleted successfully!"]
        }
        req.session.save()
        res.redirect('/books')

    } catch (err) {
        console.error(`Error deleting book with ISBN ${isbn}:`, err)
        req.session.message = {
            title: error500Title,
            content: ['Error deleting book']
        }
        res.status(500).render('500', {
            title: error500Title,
            message: req.session.message
        })
    }
}