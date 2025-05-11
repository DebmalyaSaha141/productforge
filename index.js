const express = require('express');
const path = require('path');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const FLAG = "gfgCTF{pr0t0_p0llut10n_1s_d4ng3r0us}";

app.use((req, res, next) => {
  const cookies = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim());
    });
  }
  
  req.session = {
    customizationSettings: cookies.customizationSettings ? 
      JSON.parse(cookies.customizationSettings) : 
      { colorScheme: "light", fontSize: "medium", layout: "grid" },
    
    pollutedProps: cookies.pollutedProps ? 
      JSON.parse(cookies.pollutedProps) : 
      {},
    
    feedback: req.query.feedback || '',
    
    save: () => {
      res.cookie('customizationSettings', JSON.stringify(req.session.customizationSettings), {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      res.cookie('pollutedProps', JSON.stringify(req.session.pollutedProps), {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
  };
  
  next();
});

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

function redirectWithFeedback(res, url, message) {
  const redirectUrl = `${url}${url.includes('?') ? '&' : '?'}feedback=${encodeURIComponent(message)}`;
  res.redirect(redirectUrl);
}

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
    const newSettings = req.body.settings ? JSON.parse(req.body.settings) : {};
    
    if (newSettings.__proto__) {
      mergeObjects(req.session.pollutedProps, newSettings.__proto__);
      delete newSettings.__proto__;
      
      if (newSettings.__proto__ && newSettings.__proto__.isAdmin) {
        req.session.pollutedProps.isAdmin = true;
      }
    }
    
    req.session.customizationSettings = mergeObjects(req.session.customizationSettings, newSettings);
    
    req.session.save();
    
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
  
  let userProducts = getUserProducts(req.cookies || {});
  
  userProducts[productId] = {
    id: productId,
    name: name || "Unnamed Product",
    description: description || "No description",
    price: price || "0.00",
    dateAdded: new Date().toISOString()
  };
  
  res.cookie('userProducts', JSON.stringify(userProducts), {
    maxAge: 7 * 24 * 60 * 60 * 1000,
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

app.get('/debug', (req, res) => {
  res.json({
    cookies: req.cookies || {},
    customizationSettings: req.session.customizationSettings,
    pollutedProps: req.session.pollutedProps,
    query: req.query
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
