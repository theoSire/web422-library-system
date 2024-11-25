import express from 'express'
import { engine } from 'express-handlebars'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import methodOverride from 'method-override'
import cookieParser from 'cookie-parser'
import favicon from 'serve-favicon'
import mongoose from 'mongoose'
import { connectDB } from './config/db.js'
import { jwtSession } from './middlewares/jwtSession.js'
import { menuMiddleware, setAuthPageFlag } from './middlewares/middleware.js'
import userRoutes from './routes/userRoutes.js'
import bookRoutes from './routes/bookRoutes.js'
import transactionRoutes from './routes/transactionRoutes.js'

const app = express()
const PORT = process.env.PORT || 5000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// configure handlebars with custom template helpers for conditional rendering
app.engine('hbs', engine({
    helpers: {
        statusBadge: (status) => {
            return status === 'available' ? 'bg-success' : 'bg-danger';
        },
        statusChecker: (status) => {
            return status === 'available'
        },
        // logical helpers
        and: (a, b) => a && b,
        or: (a, b) => a || b,
        not: (value) => !value
    },
    defaultLayout: 'main',
    extname: '.hbs'
}));

app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'views'))

// establish database connection
connectDB();

// prevent browser caching of dynamic content
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

// middleware for request processing
app.use(cors())
app.use(cookieParser())
app.use(jwtSession)
app.use(express.json())
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }))
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use('/static', express.static(path.join(__dirname, 'public')))
app.use(methodOverride('_method'))

// custom middleware for navigation and authentication
app.use(menuMiddleware)
app.use(setAuthPageFlag)

// route configurations
app.use('/', userRoutes)
app.use('/books', bookRoutes)
app.use('/transactions', transactionRoutes)

// Home route with session message handling
app.get('/', (req, res) => {
    const message = req?.session?.message || null
    delete req.session.message
    req.session.save()

    return res.render('index', { title: 'Home', message })
})

// About page route
app.use('/about', (req, res) => {
    res.render('about', { title: 'About' })
})

// 404 error handler for undefined routes
app.use((req, res) => {
    res.status(404).render('error', {
        title: '404 - Not Found',
        message: "We can't seem to find what you are looking for."
    })
})

// global error handling middleware
app.use((err, req, res, next) => {
    res.status(500).render('500', { 
        title: '500 - Internal Server Error',
        message: err.message || "Something went wrong on our end. Please try again later."
    })
})

// start server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

// handle graceful shutdown on SIGINT (for example: Ctrl+C)
process.on('SIGINT', async () => {
    console.log('SIGINT received. Shutting down gracefully...')
    server.close(() => {
        console.log('Server closed.')
    })

    // close database connection
    await mongoose.connection.close()
    console.log('MongoDB connection closed')
    // exit the process
    process.exit(0)
})