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
app.use(session({
  secret: crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

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
  // Create isolated session-specific prototype
  if (!req.session.objectPrototype) {
    req.session.objectPrototype = Object.create(Object.prototype);
  }
  next();
});

// Custom merge function with vulnerability (preserved for CTF challenge)
function mergeObjects(target, source, sessionPrototype) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && typeof target[key] === 'object' && target[key] !== null) {
        mergeObjects(target[key], source[key], sessionPrototype);
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
    feedback: req.session.feedback || ''
  });
});

app.get('/customize', (req, res) => {
  res.render('customize', { 
    settings: req.session.customizationSettings,
    feedback: req.session.feedback || ''
  });
});

app.post('/customize', (req, res) => {
  try {
    // Parse JSON from request body - this is the vulnerable part (intentionally)
    const newSettings = req.body.settings ? JSON.parse(req.body.settings) : {};
    
    // Handle prototype pollution attempt within the session scope
    if (newSettings.__proto__) {
      // Apply the prototype pollution to the session's isolated prototype
      mergeObjects(req.session.objectPrototype, newSettings.__proto__);
      delete newSettings.__proto__; // Remove it from the regular settings
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
    feedback: req.session.feedback || ''
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
    feedback: req.session.feedback || ''
  });
});

app.get('/check-admin', (req, res) => {
  // Check the session's objectPrototype for the isAdmin property
  if (req.session.objectPrototype.isAdmin === true) {
    res.render('admin', { flag: FLAG, settings: req.session.customizationSettings });
  } else {
    req.session.feedback = "You don't have admin privileges!";
    res.redirect('/');
  }
});

app.get('/hints', (req, res) => {
  res.render('hints', { settings: req.session.customizationSettings });
});

app.get('/about', (req, res) => {
  res.render('about', { settings: req.session.customizationSettings });
});

app.get('*', (req, res) => {
  res.status(404).send('404 Not Found');
});

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

module.exports = app;