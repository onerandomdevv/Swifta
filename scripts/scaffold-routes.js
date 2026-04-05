const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, '../apps/web/src/app');

// Component template
const pageTemplate = (name) => `export default function PageName() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <h1 className="text-2xl font-semibold">${name} \u2014 Coming Soon</h1>
    </div>
  );
}
`;

// Layout templates
const publicLayout = `export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* TODO: Add Public Header (Login/Register, category bar, WhatsApp button) */}
      <main>{children}</main>
    </>
  );
}
`;

const authLayout = `export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* TODO: Add Auth Header (minimal header, theme toggle) */}
      <main className="min-h-screen flex items-center justify-center bg-muted/30">
        {children}
      </main>
    </>
  );
}
`;

const dashboardLayout = `export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* TODO: Add Dashboard Header (auth gate, avatar/notifications) */}
      <div className="min-h-screen flex flex-col">
        {children}
      </div>
    </>
  );
}
`;

const rolesLayout = `export default function RoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      {/* TODO: Add Role Sidebar */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
`;

// Routes structure
const structure = {
  '(public)': {
    'layout.tsx': publicLayout,
    explore: { 'page.tsx': pageTemplate('Explore') },
    p: { '[code]': { 'page.tsx': pageTemplate('Product Detail') } },
    '_at_[slug]': { 'page.tsx': pageTemplate('Merchant Store') },
    merchants: { 'page.tsx': pageTemplate('Merchant Directory') },
    c: { '[category]': { 'page.tsx': pageTemplate('Category') } },
    about: { 'page.tsx': pageTemplate('About Us') },
    terms: { 'page.tsx': pageTemplate('Terms of Service') },
    privacy: { 'page.tsx': pageTemplate('Privacy Policy') },
    help: { 'page.tsx': pageTemplate('Help Center') },
    contact: { 'page.tsx': pageTemplate('Contact Us') }
  },
  '(auth)': {
    'layout.tsx': authLayout,
    login: { 'page.tsx': pageTemplate('Login') },
    register: { 'page.tsx': pageTemplate('Register') },
    'forgot-password': { 'page.tsx': pageTemplate('Forgot Password') },
    'reset-password': { 'page.tsx': pageTemplate('Reset Password') },
    'verify-email': { 'page.tsx': pageTemplate('Verify Email') }
  },
  '(dashboard)': {
    'layout.tsx': dashboardLayout,
    buyer: {
      'layout.tsx': rolesLayout,
      feed: { 'page.tsx': pageTemplate('Buyer Feed') },
      cart: { 'page.tsx': pageTemplate('Buyer Cart') },
      orders: {
        'page.tsx': pageTemplate('Buyer Orders'),
        '[id]': { 'page.tsx': pageTemplate('Buyer Order Detail') }
      }
    },
    merchant: {
      'layout.tsx': rolesLayout,
      dashboard: { 'page.tsx': pageTemplate('Merchant Dashboard') },
      products: { 'page.tsx': pageTemplate('Merchant Products') },
      orders: {
        'page.tsx': pageTemplate('Merchant Orders'),
        '[id]': { 'page.tsx': pageTemplate('Merchant Order Detail') }
      },
      settings: { 'page.tsx': pageTemplate('Merchant Settings') }
    },
    admin: {
      'layout.tsx': rolesLayout,
      dashboard: { 'page.tsx': pageTemplate('Admin Dashboard') }
    }
  }
};

// Builder function
function createStructure(basePath, obj) {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path.join(basePath, key);
    if (typeof value === 'string') {
      if (!fs.existsSync(currentPath)) {
        fs.writeFileSync(currentPath, value);
        console.log('Created file: ' + currentPath);
      } else {
        console.log('Skipped existing file: ' + currentPath);
      }
    } else {
      if (!fs.existsSync(currentPath)) {
        fs.mkdirSync(currentPath, { recursive: true });
        console.log('Created directory: ' + currentPath);
      }
      createStructure(currentPath, value);
    }
  }
}

// Ensure the group directories exist and build
for (const dir of Object.keys(structure)) {
  const groupPath = path.join(APP_DIR, dir);
  if (!fs.existsSync(groupPath)) {
    fs.mkdirSync(groupPath, { recursive: true });
  }
}

console.log("Scaffolding new routes...");
createStructure(APP_DIR, structure);

// Deletions
const toDelete = [
  'buyer/catalogue',
  'buyer/products/[id]',
  'buyer/merchants/[id]',
  'buyer/merchants',
  'm/[slug]',
  'merchant/wholesale',
  'merchant/procurement',
  'merchant/trade-financing'
];

console.log("Cleaning up old routes...");
for (const p of toDelete) {
  const fullPath = path.join(APP_DIR, p);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log('Deleted old route: ' + fullPath);
  }
}

console.log("Done!");
