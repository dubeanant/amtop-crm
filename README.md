# 🚀 amTop CRM System

A comprehensive, modern Customer Relationship Management (CRM) system built with Next.js 15, TypeScript, Firebase, and MongoDB. Features advanced pipeline management, role-based access control, and intuitive lead tracking with a beautiful, responsive interface.

![amTop CRM](public/amTop-logo.jpg)

## ✨ Key Features

### 🎯 **Pipeline Management System**
- **Visual Sales Pipeline** - Kanban-style board with drag & drop functionality
- **Three-Stage Workflow** - Leads → Engaged → Warm progression
- **Bulk Operations** - Move multiple leads simultaneously
- **Stage Analytics** - Real-time conversion tracking and statistics
- **Manual & Automated** - Ready for future email/purchase automation

### 🔐 **Advanced Authentication & Security**
- **Firebase Authentication** - Secure sign-in/sign-up with email verification
- **Role-Based Access Control** - Granular permissions system
- **Route Protection** - Secure API endpoints and page access
- **Audit Trail** - Track all user actions and changes

### 📊 **Lead Management**
- **CSV Import/Export** - Bulk lead upload with data validation
- **Smart Lead Tracking** - Comprehensive lead information management
- **Search & Filter** - Advanced filtering by stage, date, and attributes
- **Lead History** - Track all interactions and stage changes

### 👥 **User Management**
- **Multi-Role System** - Admin, User, and Viewer roles
- **Permission Management** - Fine-grained access control
- **User Analytics** - Track user activity and performance
- **Profile Management** - Complete user profile system

## 🎨 **User Interface & Experience**
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Dark/Light Mode Ready** - Modern, accessible interface
- **Intuitive Navigation** - Clean sidebar with role-based menu items
- **Real-time Updates** - Live data synchronization across all views

## 🏗️ **System Architecture**

### 📱 **Pages & Navigation**
- **Dashboard** (`/`) - Pipeline overview with quick actions and statistics
- **Pipeline** (`/pipeline`) - Full kanban board with drag & drop functionality  
- **Leads** (`/leads`) - Comprehensive lead list with search and filters
- **Users** (`/users`) - User management and role assignment (Admin only)
- **Settings** (`/settings`) - System configuration and preferences

### 🔐 **Role-Based Access Control**

#### 🔑 **Admin Role**
- ✅ Full system access and user management
- ✅ All lead operations (create, read, update, delete, manage all users' leads)
- ✅ Pipeline management with bulk operations
- ✅ User role assignment and permissions
- ✅ System settings and configuration
- ✅ Advanced analytics and reporting

#### 👤 **User Role**  
- ✅ Personal lead management (create, read, update, delete own leads)
- ✅ Pipeline updates for own leads
- ✅ CSV import/export for personal leads
- ✅ Personal analytics dashboard
- ✅ Profile management

#### 👁️ **Viewer Role**
- ✅ Read-only access to own leads
- ✅ View personal pipeline status  
- ✅ Basic analytics (read-only)
- ❌ No create/update/delete permissions

## 🎯 **Pipeline Workflow**

### Stage 1: **Leads** (🔵 Blue)
- **Source**: CSV uploads, manual entry
- **Status**: New, uncontacted prospects
- **Actions**: View details, move to Engaged/Warm
- **Future**: Auto-import from various sources

### Stage 2: **Engaged Leads** (🟡 Yellow)  
- **Source**: Manual conversion from Leads
- **Status**: Responded to outreach, showing interest
- **Actions**: Track engagement, move to Warm/back to Leads
- **Future**: Auto-update when emails are replied to

### Stage 3: **Warm Leads** (🟢 Green)
- **Source**: Manual conversion, high-intent prospects
- **Status**: Made purchases, ready to convert
- **Actions**: Priority follow-up, conversion tracking
- **Future**: Auto-update on purchase events

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Authentication**: Firebase Auth
- **Database**: MongoDB
- **File Processing**: PapaParse (CSV handling)
- **Deployment**: Vercel-ready

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Firebase project
- MongoDB database

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/amtop-crm.git
   cd amtop-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Environment Configuration**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # MongoDB Configuration
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DB=your_database_name
   ```

4. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password provider
   - Copy your Firebase config to the environment variables

5. **MongoDB Setup**
   - Set up a MongoDB database (local or cloud)
   - Add your connection string to the environment variables

6. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ **Project Structure**

```
amtop-crm/
├── 📁 app/
│   ├── 🔌 api/                    # API Routes & Endpoints
│   │   ├── leads/                 # Lead management (GET, POST, PUT, DELETE)
│   │   │   ├── route.ts          # Main leads API
│   │   │   └── [id]/route.ts     # Individual lead operations
│   │   └── users/                # User management endpoints
│   │       ├── route.ts          # User CRUD operations
│   │       └── [id]/route.ts     # Individual user operations
│   ├── 🧩 components/            # Reusable UI Components
│   │   ├── layout/               # Layout Components
│   │   │   ├── Layout.tsx        # Main app layout wrapper
│   │   │   └── Sidebar.tsx       # Navigation sidebar
│   │   └── ui/                   # UI Components
│   │       ├── RoleGuard.tsx     # Permission-based rendering
│   │       └── AddLeadModal.tsx  # Lead creation modal
│   ├── 🔄 contexts/              # React Context Providers
│   │   └── AuthContext.tsx       # Authentication & user state
│   ├── 🔥 firebase/              # Firebase Configuration
│   │   └── config.tsx            # Firebase app initialization
│   ├── 📝 types/                 # TypeScript Definitions
│   │   └── auth.ts               # User roles & permissions
│   ├── 📄 Pages/                 # Application Pages
│   │   ├── pipeline/             # 🎯 Pipeline Management
│   │   │   └── page.tsx          # Kanban-style pipeline view
│   │   ├── leads/                # 📊 Lead Management  
│   │   │   └── page.tsx          # Lead list with filters
│   │   ├── users/                # 👥 User Management
│   │   │   └── page.tsx          # User administration
│   │   ├── settings/             # ⚙️ System Settings
│   │   │   └── page.tsx          # Configuration panel
│   │   ├── sign-in/              # 🔐 Authentication
│   │   │   └── page.tsx          # Login page
│   │   ├── sign-up/              # 📝 Registration
│   │   │   └── page.tsx          # Sign-up page
│   │   ├── layout.tsx            # Root layout with providers
│   │   └── page.tsx              # 🏠 Dashboard (main page)
├── 📁 public/                    # Static Assets
│   ├── amTop-logo.jpg            # Company logo
│   └── *.svg                     # Icon assets
├── 📄 Configuration Files
│   ├── .env.local                # Environment variables
│   ├── package.json              # Dependencies & scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── tailwind.config.ts        # Tailwind CSS setup
│   └── next.config.ts            # Next.js configuration
├── 📚 Documentation
│   ├── README.md                 # Main documentation
│   ├── PIPELINE_GUIDE.md         # Pipeline usage guide
│   └── test-pipeline.js          # Pipeline testing script
└── 🧪 Development Tools
    ├── .gitignore                # Git ignore rules
    └── test-leads.csv            # Sample lead data
```

## 🔐 Authentication & Security

The application implements a comprehensive security model:

- **Firebase Authentication** for secure user sign-in/sign-up
- **Role-based Access Control (RBAC)** with three permission levels
- **Route Protection** using RoleGuard components
- **API Route Security** with authentication middleware
- **Permission-based UI Rendering** to hide unauthorized features

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop** - Full sidebar navigation and multi-column layouts
- **Tablet** - Collapsible sidebar with touch-friendly interactions
- **Mobile** - Drawer-style navigation with optimized touch targets

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Add environment variables** in the Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy your application

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/amtop-crm/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🚀 **Quick Start Guide**

### 1. **First Time Setup**
```bash
# Clone and install
git clone https://github.com/yourusername/amtop-crm.git
cd amtop-crm
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Firebase and MongoDB credentials

# Start development server
npm run dev
```

### 2. **Create Your First Admin User**
- Navigate to `/sign-up`
- Register with your email
- The first user automatically becomes an admin
- Access user management at `/users`

### 3. **Import Your First Leads**
- Go to Dashboard (`/`)
- Click "Upload CSV" button
- Use the sample format: Name, Email, Number, Bio
- View leads in the table and pipeline

### 4. **Manage Your Pipeline**
- Visit `/pipeline` for the kanban view
- Use quick action buttons to move leads between stages
- Try bulk operations by selecting multiple leads
- Monitor conversion rates in the statistics panel

## 📊 **Usage Examples**

### **CSV Import Format**
```csv
Name,Email,Number,Bio
John Doe,john@example.com,+1234567890,Software Developer interested in CRM solutions
Jane Smith,jane@company.com,+0987654321,Marketing Manager looking for lead tracking tools
```

### **API Usage Examples**
```javascript
// Get all leads for authenticated user
const response = await fetch('/api/leads?userEmail=user@example.com');
const leads = await response.json();

// Update lead stage
await fetch('/api/leads/leadId', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    stage: 'engaged',
    stageUpdatedAt: new Date().toISOString(),
    stageUpdatedBy: 'user@example.com'
  })
});
```

## 🔮 **Development Roadmap**

### ✅ **Phase 1 - Foundation (Completed)**
- ✅ User Authentication & Authorization System
- ✅ Role-based Access Control (Admin/User/Viewer)
- ✅ User Management with Permission System
- ✅ Lead Management with CSV Import/Export
- ✅ **Pipeline Management System** 🎯
- ✅ Responsive UI/UX with Tailwind CSS
- ✅ MongoDB Integration with Audit Trails

### 🔄 **Phase 2 - Automation (In Progress)**
- 🔄 **Cold Email Integration** - Automated outreach campaigns
- 🔄 **Email Response Tracking** - Auto-move leads to "Engaged"
- 🔄 **Purchase Integration** - Auto-move leads to "Warm" 
- 🔄 **Analytics Dashboard** - Advanced reporting and insights
- 🔄 **Notification System** - Real-time alerts and updates
- 🔄 **Advanced Lead Scoring** - AI-powered lead qualification

### 🚀 **Phase 3 - Advanced Features (Planned)**
- 📋 **Task Management** - Follow-up reminders and scheduling
- 📊 **Advanced Reporting** - Custom reports and data export
- 🔗 **Third-party Integrations** - Zapier, Slack, etc.
- 📱 **Mobile App** - Native iOS/Android applications
- 🤖 **AI-powered Insights** - Predictive analytics and recommendations
- 🎨 **White-label Solution** - Customizable branding options

## 🎯 **Key Highlights**

### 🏆 **What Makes This CRM Special**
- **🚀 Modern Tech Stack** - Built with the latest Next.js 15, React 19, and TypeScript
- **🎨 Beautiful UI** - Clean, responsive design with intuitive user experience
- **🔐 Enterprise Security** - Firebase authentication with granular role-based permissions
- **📊 Visual Pipeline** - Kanban-style board with drag & drop functionality
- **⚡ Real-time Updates** - Live data synchronization across all views
- **📱 Mobile Ready** - Fully responsive design for all devices
- **🔧 Developer Friendly** - Well-documented, modular, and extensible codebase

### 📈 **Perfect For**
- **Small to Medium Businesses** looking for affordable CRM solutions
- **Sales Teams** needing visual pipeline management
- **Startups** requiring scalable lead tracking systems
- **Agencies** managing multiple client leads
- **Developers** wanting to customize and extend CRM functionality

## 🤝 **Contributing**

We welcome contributions from the community! Here's how you can help:

### 🐛 **Bug Reports**
- Use the [Issues](https://github.com/yourusername/amtop-crm/issues) page
- Include detailed steps to reproduce
- Add screenshots if applicable

### 💡 **Feature Requests**
- Check existing issues first
- Describe the feature and its benefits
- Consider implementation complexity

### 🔧 **Code Contributions**
```bash
# Fork the repository
git clone https://github.com/yourusername/amtop-crm.git
cd amtop-crm

# Create feature branch
git checkout -b feature/amazing-feature

# Make your changes and test
npm run dev
npm run build

# Commit and push
git commit -m 'Add amazing feature'
git push origin feature/amazing-feature

# Create Pull Request
```

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support & Community**

### 💬 **Get Help**
- 📧 **Email**: support@amtop-crm.com
- 💬 **Discord**: [Join our community](https://discord.gg/amtop-crm)
- 📖 **Documentation**: [Full docs](https://docs.amtop-crm.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/amtop-crm/issues)

### 🌟 **Show Your Support**
If this project helped you, please consider:
- ⭐ **Starring** the repository
- 🐦 **Sharing** on social media
- 💝 **Contributing** to the codebase
- 📝 **Writing** a review or blog post

## 🙏 **Acknowledgments**

Special thanks to the amazing open-source community and these fantastic tools:

- 🚀 **[Next.js](https://nextjs.org/)** - The React framework for production
- 🔥 **[Firebase](https://firebase.google.com/)** - Authentication and real-time database
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- 🍃 **[MongoDB](https://www.mongodb.com/)** - NoSQL database solution
- 📝 **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- ⚛️ **[React](https://reactjs.org/)** - UI component library

---

<div align="center">

### 🚀 **Ready to Transform Your Lead Management?**

**[⭐ Star this repo](https://github.com/yourusername/amtop-crm)** • **[🚀 Deploy on Vercel](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/amtop-crm)** • **[📖 Read the docs](https://docs.amtop-crm.com)**

**Built with ❤️ by the amTop Team**

*Empowering businesses with intelligent lead management*

</div>
