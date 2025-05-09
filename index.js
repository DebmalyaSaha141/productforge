const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware for user isolation
// Make sure session works on serverless environment with proper storage
const sessionConfig = {
  secret: 'gfg-ctf-secure-session-key',  // Fixed secret so sessions persist between serverless invocations
  resave: true,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// In production, you might want to use a proper session store like Redis
// This is a simplified version for the CTF
app.use(session(sessionConfig));

// Flag - will be revealed through prototype pollution
const FLAG = "gfgCTF{pr0t0_p0llut10n_1s_d4ng3r0us}";

// Initialize session data
app.use((req, res, next) => {
  if (!req.session.userProducts) {
    req.session.userProducts = {};
  }
  if (!req.session.customizationSettings) {
    req.session.customizationSettings = {
      colorScheme: "light",
      fontSize: "medium",
      layout: "grid"
    };
  }
  if (!req.session.pollutedProps) {
    req.session.pollutedProps = {};
  }
  next();
});

// Custom merge function with vulnerability (preserved for CTF challenge)
function mergeObjects(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && 
          typeof target[key] === 'object' && target[key] !== null) {
        mergeObjects(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

// Routes
app.get('/', (req, res) => {
  res.render('index', { 
    settings: req.session.customizationSettings,
    products: req.session.userProducts,
    feedback: req.session.feedback || '',
    pollutedProps: req.session.pollutedProps
  });
});

app.get('/customize', (req, res) => {
  res.render('customize', { 
    settings: req.session.customizationSettings,
    feedback: req.session.feedback || '',
    pollutedProps: req.session.pollutedProps
  });
});

app.post('/customize', (req, res) => {
  try {
    // Parse JSON from request body - this is the vulnerable part
    const newSettings = req.body.settings ? JSON.parse(req.body.settings) : {};
    
    // Explicitly handle prototype pollution attempt for Vercel compatibility
    if (newSettings.__proto__) {
      // Store polluted properties in session instead of actual prototype
      mergeObjects(req.session.pollutedProps, newSettings.__proto__);
      delete newSettings.__proto__; // Remove it from regular settings
      
      // Explicitly check for isAdmin
      if (newSettings.__proto__.isAdmin) {
        req.session.pollutedProps.isAdmin = newSettings.__proto__.isAdmin;
      }
    }
    
    // Merging settings using vulnerable function
    req.session.customizationSettings = mergeObjects(req.session.customizationSettings, newSettings);
    
    req.session.feedback = "Settings updated successfully!";
    res.redirect('/customize');
  } catch (error) {
    req.session.feedback = "Error updating settings: " + error.message;
    res.redirect('/customize');
  }
});

app.get('/products', (req, res) => {
  res.render('products', { 
    products: req.session.userProducts,
    settings: req.session.customizationSettings,
    feedback: req.session.feedback || '',
    pollutedProps: req.session.pollutedProps
  });
});

app.post('/products/add', (req, res) => {
  const { name, description, price } = req.body;
  const productId = crypto.randomBytes(8).toString('hex');
  
  req.session.userProducts[productId] = {
    id: productId,
    name: name || "Unnamed Product",
    description: description || "No description",
    price: price || "0.00",
    dateAdded: new Date().toISOString()
  };
  
  req.session.feedback = "Product added successfully!";
  res.redirect('/products');
});

app.get('/products/:id', (req, res) => {
  const product = req.session.userProducts[req.params.id];
  if (!product) {
    req.session.feedback = "Product not found!";
    return res.redirect('/products');
  }
  
  res.render('product-detail', {
    product,
    settings: req.session.customizationSettings,
    feedback: req.session.feedback || '',
    pollutedProps: req.session.pollutedProps
  });
});

app.get('/check-admin', (req, res) => {
  // Check the session's pollutedProps for isAdmin
  if (req.session.pollutedProps.isAdmin === true) {
    res.render('admin', { 
      flag: FLAG, 
      settings: req.session.customizationSettings,
      pollutedProps: req.session.pollutedProps 
    });
  } else {
    req.session.feedback = "You don't have admin privileges!";
    res.redirect('/');
  }
});

app.get('/hints', (req, res) => {
  res.render('hints', { 
    settings: req.session.customizationSettings,
    pollutedProps: req.session.pollutedProps
  });
});

app.get('/about', (req, res) => {
  res.render('about', { 
    settings: req.session.customizationSettings,
    pollutedProps: req.session.pollutedProps
  });
});

// Debug route for serverless environment
app.get('/debug', (req, res) => {
  res.json({
    sessionActive: req.session ? true : false,
    settings: req.session.customizationSettings,
    pollutedProps: req.session.pollutedProps,
    products: Object.keys(req.session.userProducts || {}).length,
    feedback: req.session.feedback || 'No feedback'
  });
});

app.get('*', (req, res) => {
  res.status(404).send('404 Not Found');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;