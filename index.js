const express = require('express');
// const session = require('express-session');
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

// Flag - will be revealed through the CTF challenge
const FLAG = "gfgCTF{pr0t0_p0llut10n_1s_d4ng3r0us}";

// Serverless-compatible session handling
// For Vercel deployments, we'll use cookies to store essential data
// instead of relying on server-side session storage
app.use((req, res, next) => {
  // Parse cookies manually
  const cookies = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim());
    });
  }
  
  // Create our custom session object
  req.session = {
    // Parse stored data from cookies or set defaults
    customizationSettings: cookies.customizationSettings ? 
      JSON.parse(cookies.customizationSettings) : 
      { colorScheme: "light", fontSize: "medium", layout: "grid" },
    
    pollutedProps: cookies.pollutedProps ? 
      JSON.parse(cookies.pollutedProps) : 
      {},
    
    // Store feedback in URL instead of session for serverless compatibility
    feedback: req.query.feedback || '',
    
    // Simple method to save session data to cookies
    save: () => {
      res.cookie('customizationSettings', JSON.stringify(req.session.customizationSettings), {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      res.cookie('pollutedProps', JSON.stringify(req.session.pollutedProps), {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
  };
  
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

// Product data is now stored directly in cookies
function getUserProducts(cookies) {
  if (cookies.userProducts) {
    try {
      return JSON.parse(cookies.userProducts);
    } catch (e) {
      return {};
    }
  }
  return {};
}

// Utility function to redirect with feedback
function redirectWithFeedback(res, url, message) {
  const redirectUrl = `${url}${url.includes('?') ? '&' : '?'}feedback=${encodeURIComponent(message)}`;
  res.redirect(redirectUrl);
}

// Routes
app.get('/', (req, res) => {
  const userProducts = getUserProducts(req.cookies || {});
  
  res.render('index', { 
    settings: req.session.customizationSettings,
    products: userProducts,
    feedback: req.query.feedback || '',
    pollutedProps: req.session.pollutedProps
  });
});

app.get('/customize', (req, res) => {
  res.render('customize', { 
    settings: req.session.customizationSettings,
    feedback: req.query.feedback || '',
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
      if (newSettings.__proto__ && newSettings.__proto__.isAdmin) {
        req.session.pollutedProps.isAdmin = true;
      }
    }
    
    // Merging settings using vulnerable function
    req.session.customizationSettings = mergeObjects(req.session.customizationSettings, newSettings);
    
    // Save to cookies
    req.session.save();
    
    // Redirect with feedback
    redirectWithFeedback(res, '/customize', 'Settings updated successfully!');
  } catch (error) {
    redirectWithFeedback(res, '/customize', 'Error updating settings: ' + error.message);
  }
});

app.get('/products', (req, res) => {
  const userProducts = getUserProducts(req.cookies || {});
  
  res.render('products', { 
    products: userProducts,
    settings: req.session.customizationSettings,
    feedback: req.query.feedback || '',
    pollutedProps: req.session.pollutedProps
  });
});

app.post('/products/add', (req, res) => {
  const { name, description, price } = req.body;
  const productId = crypto.randomBytes(8).toString('hex');
  
  // Get existing products
  let userProducts = getUserProducts(req.cookies || {});
  
  // Add new product
  userProducts[productId] = {
    id: productId,
    name: name || "Unnamed Product",
    description: description || "No description",
    price: price || "0.00",
    dateAdded: new Date().toISOString()
  };
  
  // Save products to cookie
  res.cookie('userProducts', JSON.stringify(userProducts), {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  
  redirectWithFeedback(res, '/products', 'Product added successfully!');
});

app.get('/products/:id', (req, res) => {
  const userProducts = getUserProducts(req.cookies || {});
  const product = userProducts[req.params.id];
  
  if (!product) {
    return redirectWithFeedback(res, '/products', 'Product not found!');
  }
  
  res.render('product-detail', {
    product,
    settings: req.session.customizationSettings,
    feedback: req.query.feedback || '',
    pollutedProps: req.session.pollutedProps
  });
});

app.get('/check-admin', (req, res) => {
  // Check the pollutedProps for isAdmin
  if (req.session.pollutedProps.isAdmin === true) {
    res.render('admin', { 
      flag: FLAG, 
      settings: req.session.customizationSettings,
      pollutedProps: req.session.pollutedProps 
    });
  } else {
    redirectWithFeedback(res, '/', "You don't have admin privileges!");
  }
});

app.get('/hints', (req, res) => {
  res.render('hints', { 
    settings: req.session.customizationSettings,
    pollutedProps: req.session.pollutedProps,
    feedback: req.query.feedback || ''
  });
});

app.get('/about', (req, res) => {
  res.render('about', { 
    settings: req.session.customizationSettings,
    pollutedProps: req.session.pollutedProps,
    feedback: req.query.feedback || ''
  });
});

// Debug route for serverless environment
app.get('/debug', (req, res) => {
  res.json({
    cookies: req.cookies || {},
    customizationSettings: req.session.customizationSettings,
    pollutedProps: req.session.pollutedProps,
    query: req.query
  });
});

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

module.exports = app;