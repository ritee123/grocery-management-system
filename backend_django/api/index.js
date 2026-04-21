const { spawn } = require('child_process');
const path = require('path');

// Django serverless handler for Vercel
module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Parse URL to determine endpoint
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Handle different API endpoints
    if (pathname.startsWith('/api/auth/')) {
      return handleAuth(req, res, pathname);
    } else if (pathname.startsWith('/api/customers/')) {
      return handleCustomers(req, res, pathname);
    } else if (pathname.startsWith('/api/products/')) {
      return handleProducts(req, res, pathname);
    } else if (pathname.startsWith('/api/sales/')) {
      return handleSales(req, res, pathname);
    } else if (pathname.startsWith('/api/expenses/')) {
      return handleExpenses(req, res, pathname);
    } else if (pathname === '/api/bootstrap/') {
      return handleBootstrap(req, res);
    } else {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to run Django management commands
function runDjangoCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const djangoProcess = spawn('python', ['manage.py', command, ...args], {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        DJANGO_SETTINGS_MODULE: 'sanu_store.settings'
      }
    });

    let data = '';
    let error = '';

    djangoProcess.stdout.on('data', (chunk) => {
      data += chunk.toString();
    });

    djangoProcess.stderr.on('data', (chunk) => {
      error += chunk.toString();
    });

    djangoProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Django command failed: ${error}`));
      } else {
        resolve(data);
      }
    });
  });
}

// Handler functions for different endpoints
async function handleAuth(req, res, pathname) {
  if (req.method === 'POST' && pathname === '/api/auth/login/') {
    try {
      const result = await runDjangoCommand('shell', [
        `-c`,
        `from django.contrib.auth import authenticate; 
         import json; 
         data = json.loads('${JSON.stringify(req.body)}'); 
         user = authenticate(username=data.get('username'), password=data.get('password')); 
         print(json.dumps({'token': user.auth_token.key if user else None}))`
      ]);
      return res.status(200).json(JSON.parse(result));
    } catch (error) {
      return res.status(500).json({ error: 'Login failed' });
    }
  }
  
  // Add other auth endpoints (signup, logout, etc.)
  return res.status(404).json({ error: 'Auth endpoint not found' });
}

async function handleCustomers(req, res, pathname) {
  if (req.method === 'GET') {
    try {
      const result = await runDjangoCommand('shell', [
        `-c`,
        `from django.core.management import execute_from_command_line; 
         execute_from_command_line(['manage.py', 'dumpdata', 'store.customer', '--indent', '2'], {'DJANGO_SETTINGS_MODULE': 'sanu_store.settings'})`
      ]);
      return res.status(200).json(JSON.parse(result));
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }
  }
  
  return res.status(404).json({ error: 'Customer endpoint not found' });
}

// Similar handlers for products, sales, expenses...
async function handleProducts(req, res, pathname) {
  return res.status(200).json({ message: 'Products endpoint - implement Django logic' });
}

async function handleSales(req, res, pathname) {
  return res.status(200).json({ message: 'Sales endpoint - implement Django logic' });
}

async function handleExpenses(req, res, pathname) {
  return res.status(200).json({ message: 'Expenses endpoint - implement Django logic' });
}

async function handleBootstrap(req, res) {
  return res.status(200).json({
    customers: [],
    products: [],
    sales: [],
    expenses: []
  });
}
