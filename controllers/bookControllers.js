import Book from '../models/Book.js'
import Transaction from '../models/Transaction.js'
import { requireLogin } from '../middlewares/middleware.js'

// titles for various pages and error types
const error400Title = '400 Error'
const error500Title = '500 - Internal Server Error'
const booksTitle = 'Book List'

// fetch all books and render the books list page
export const getAllBooks = async (req, res) => {
    try {
        const books = await Book.find().lean() // retrieve all books from the db

        // retrieve session messages, if any
        const message = req.session.message || null
        delete req.session.message
        req.session.save()

        res.render('books', {
            title: booksTitle,
            books, 
            resultsTitle: booksTitle,
            message,
            isAuthPage: false // is not an authentication page
        })
    } catch (err) {
        console.error('Error fetching books:', err)
        res.status(500).render('error', { 
            title: error500Title,
            message: 'Error retrieving books',
            isAuthPage: false
        })
    }
}

// search for books by title based on a query parameter
export const searchBook = async (req, res) => {
    const query = req.query.query
    
    try {
        const books = await Book.find({
            title: { $regex: new RegExp(query, 'i') } // for case-insensitive partial match
        }).lean()

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

        // check if the book is borrowed and who borrowed it
        const transaction = await Transaction.findOne({
            bookID: book._id,
            status: 'borrowed'
        }).populate('userID').lean()

        // check if the current user borrowed the book
        const userID = req.session.user ? req.session.user.userID.toString() : null
        const isBookBorrowed = transaction ? true : false
        const isUserAlreadyBorrowed = transaction && transaction.userID._id.toString() === userID

        // retrieve and clear session messages, if any
        const message = req.session.message || null
        delete req.session.message
        req.session.save()

        res.render('book', {
            title: `${book.booksTitle}`,
            book,
            isBookBorrowed,
            isUserAlreadyBorrowed,
            message
        })

    } catch (err) {
        console.error(`Error retrieving the book with ISBN ${isbn}:`, err)
        res.status(500).render('error', { 
            title: error500Title,
            message: 'Error retrieving the book' 
        })
    }
}

// show the donation page
export const showDonatePage = async (req, res) => {
    // check if the user is logged in before accessing donation page
    if (!requireLogin(req, res, 'Please log in to donate the book.', '/books/donate')) return

    req.session.hasVisitedDonate = true // flag to track if user visited the donate page
    const message = req.session.message || null
    delete req.session.message 
    req.session.save()

    res.render('donate', { 
        title: 'Donate',
        message 
    })
}

// handle the donation of a new book
export const donateBook = async (req, res) => {
    const { ISBN, title, author, year, image } = req.body

    try {
        // check if the user is logged in before donating a book
        if (!requireLogin(req, res, 'Please log in to donate the book.', '/books/donate')) return

        // create a new book document for the donation
        const donation = new Book({
            ISBN,
            title,
            author,
            year,
            image,
            status: 'available',
            isAvailable: true
        })
        
        await donation.save()

        // success message
        req.session.message = { 
            title: 'Success', 
            content: ['Book donated successfully!'] 
        }
        req.session.save()
        delete req.session.message

        res.redirect(`/books/${donation.ISBN}`)
    } catch (err) {
        console.error("Error donating book:", err)
        let errorMessages = []
        
        // handle duplicate ISBN error
        if (err.code === 11000) {
            errorMessages.push('A book with this ISBN already exists.')
        } else if (err.name === 'ValidationError') { // handle validation errors
            errorMessages.push(err.message)
        } else {
            errorMessages.push('Internal server error.')
        }

        // render the donate with error message in the modal
        return res.status(500).render('donate', {
            title: error500Title,
            message: { title: error500Title, content: errorMessages },
            ISBN,
            title,
            author,
            year,
            image,
        })
    }
}

// displays the edit book
export const showEditPage = async (req, res) => {
    const { isbn } = req.params

    try {
        // check if the user is logged in before accessing edit page
        if (!requireLogin(req, res, 'Please log in to edit the book.', `/books/edit/${isbn}`)) return
    
        const message = req.session.message || null
        delete req.session.message 
        req.session.save()
    
        const book = await Book.findOne({ ISBN: isbn }).lean()

        if (!book) { // renders an error page, if book is not found
            return res.status(404).render('error', {
                title: '404 - Not Found',
                message: 'Book not found'
            })
        }
    
        res.render('edit', { 
            title: 'Edit',
            book,
            message 
        })
    } catch (err) {
        console.error('Error retrieving book for editing:', err)
        res.status(500).render('error', {
            title: error500Title,
            message: 'An error occurred while trying to load the edit page.'
        })
    }
}

// edit book information by ISBN
export const editBookByISBN = async (req, res) => {
    const { isbn } = req.params
    const updatedData = req.body

    try {
        // update the book with the given ISBN and return the updated document
        const book = await Book.findOneAndUpdate(
            { ISBN: isbn },
            updatedData,
            { new: true }
        )

        // if the book is not found, render a 404 error page
        if (!book) {
            return res.status(404).render('error', { 
                title: error400Title,
                message: 'Book not found' 
            })
        }

        // success message
        req.session.message = {
            title: 'Success', 
            content: ['Book info updated successfully!']
        }

        res.locals.title = 'Edit Book'
        req.session.save()
        res.redirect(`/books/${book.ISBN}`)
        delete req.session.message
    } catch (err) {
        console.error("Error updating book:", err)

        // render the edit page with error messgaes
        const message = {
            title: error500Title,
            content: ['Error updating book']
        }
        req.session.save()

        // render the donate with error message in the modal
        return res.status(500).render('edit', {
            title: error500Title,
            message,
            updatedData
        })
    }
}

// delete a book by its ISBN
export const deleteBookByISBN = async (req, res) => {
    const { isbn } = req.params

    try {
        // check if the user is logged in before deleting a book
        if (!requireLogin(req, res, 'Please log in to delete the book.', `/books/${isbn}`)) return

        const deletedBook = await Book.findOneAndDelete({ ISBN: isbn }) // delete the book
        if (!deletedBook) {
            // set a session error message if no book is found
            req.session.message = {
                title: 'Error', 
                content: [`Book with ISBN ${isbn} not found`]
            }
            req.session.save()
            return res.redirect('/books')
        }
        
        // set a success message in the session
        req.session.message = {
            title: 'Success', 
            content: ['Book deleted successfully!']
        }
        req.session.save()
        res.redirect('/books')
    } catch (err) {
        console.error(`Error deleting book with ISBN ${isbn}:`, err)
        message = {
            title: error500Title,
            content: ['Error deleting book']
        }
        res.status(500).render('500', {
            title: error500Title,
            message
        })
    }
}