import express from 'express'
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
import cookieParser from 'cookie-parser'
import { jwtSession } from './middlewares/jwtSession.js'

const app = express()
const PORT = process.env.PORT || 5000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
app.use(cookieParser())
app.use(jwtSession)
app.use(express.json())
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }))
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use('/static', express.static(path.join(__dirname, 'public')))
app.use(methodOverride('_method'))
app.use(menuMiddleware)

app.use('/', userRoutes)
app.use('/books', bookRoutes)
app.use('/transactions', transactionRoutes)

app.get('/env-check', (req, res) => {
    res.send({ vercelEnv: process.env.VERCEL_ENV });
})

app.get('/protected', (req, res) => {
    if (!req.session || !req.session.userID) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    res.status(200).json({ message: 'Access granted', session: req.session });
});

app.post('/update-session', (req, res) => {
    req.session.customData = 'Updated value';
    req.session.save(() => {
        res.status(200).json({ message: 'Session updated' });
    });
    console.log(req.cookies)
});

app.get('/', (req, res) => {
    console.log('Accessed Home Route');
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

// Add this after your jwtSession middleware
// app.use((req, res, next) => {
//     console.log('\n--- Session Debug Info ---');
//     console.log('Session Contents:', req.session);
//     console.log('Cookie Header:', req.headers.cookie);
//     console.log('JWT Cookie:', req.cookies?.session);
//     console.log('Is Logged In:', req.session.isLoggedIn);
//     console.log('------------------------\n');
//     next();
// });

app.use((req, res) => {
    res.status(404).render('error', {
        title: '404 - Not Found',
        message: "We can't seem to find what you are looking for."
    })
})

app.use((err, req, res, next) => {
    res.status(500).render('500', { 
        title: '500 - Internal Server Error',
        message: err.message || "Something went wrong on our end. Please try again later."
    })
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
