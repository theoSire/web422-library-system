import express from 'express'
import session from 'express-session'
import { engine } from 'express-handlebars'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import methodOverride from 'method-override'
import favicon from 'serve-favicon'

import userRoutes from './routes/userRoutes.js'
import bookRoutes from './routes/bookRoutes.js'
import transactionRoutes from './routes/transactionRoutes.js'

import { connectDB } from './config/db.js'
import { menuMiddleware } from './middlewares/middleware.js'

const app = express()
const PORT = process.env.PORT || 5000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}))

app.use(menuMiddleware)

app.engine('hbs', engine({
    helpers: {
        statusBadge: (status) => {
            return status === 'available' ? 'bg-success' : 'bg-danger';
        },
        isEndOfRow: (index) => {
            return (index + 1) % 4 === 0; // Adjust based on how many columns you want per row
        },
        and: (a, b) => {
            return a && b
        },
        or: (a, b) => {
            return a || b
        },
        not: (value) => {
            return !value
        },
        statusChecker: (status) => {
            return status === 'available'
        }
    },
    defaultLayout: 'main',
    extname: '.hbs'
}));

app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'views'))

connectDB();

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

app.use(cors())
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }))
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use('/static', express.static(path.join(__dirname, 'public')))
app.use(methodOverride('_method'))

app.use('/', userRoutes)
app.use('/books', bookRoutes)
app.use('/transactions', transactionRoutes)

app.get('/', (req, res) => {
    const message = req.session.message || null
    delete req.session.message
    req.session.hasVisitedDonate = true
    res.render('index', { title: 'Home', message })
})

app.use('/about', (req, res) => {
    res.render('about', {
        title: 'About'
    })
})

app.use((req, res) => {
    res.status(404).render('error', {
        title: '404 - Not Found',
        message: "We can't seem to find what you are looking for."
    })
})

app.use((err, res) => {
    res.status(500).render('500', { 
        title: '500 - Internal Server Error',
        message: err.message || "Something went wrong on our end. Please try again later."
    })
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
