# amTop CRM System

A modern, role-based Customer Relationship Management (CRM) system built with Next.js 15, TypeScript, Firebase, and MongoDB. This application provides comprehensive user management, lead tracking, and analytics capabilities with a clean, responsive interface.

![amTop CRM](public/amTop-logo.jpg)

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization** - Firebase-based authentication with role-based access control
- **Role-Based Permissions** - Three-tier role system (Admin, User, Viewer) with granular permissions
- **User Management** - Complete CRUD operations for user accounts with role management
- **Lead Management** - Track and manage customer leads with CSV import/export capabilities
- **Responsive Design** - Mobile-first design with Tailwind CSS
- **Real-time Updates** - Live data synchronization across the application

### User Roles & Permissions

#### 🔑 Admin
- Full access to all features
- User management and role assignment
- Lead management (create, read, update, delete, manage all)
- Pipeline management with stage control
- Analytics with export capabilities
- System settings management

#### 👤 User
- Lead management (create, read, update, delete own leads)
- Pipeline updates for own leads
- Personal analytics dashboard
- Profile management

#### 👁️ Viewer
- Read-only access to own leads
- View pipeline status
- Personal analytics (read-only)

### Upcoming Features
- **Pipeline Management** - Visual sales pipeline with drag-and-drop functionality
- **Analytics Dashboard** - Comprehensive reporting and data visualization
- **Advanced Lead Tracking** - Enhanced lead scoring and management tools

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

## 🏗️ Project Structure

```
amtop-crm/
├── app/
│   ├── api/                    # API routes
│   │   ├── leads/             # Lead management endpoints
│   │   └── users/             # User management endpoints
│   ├── components/            # Reusable components
│   │   ├── layout/           # Layout components (Sidebar, Header)
│   │   └── ui/               # UI components (RoleGuard, etc.)
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Authentication context
│   ├── firebase/             # Firebase configuration
│   ├── types/                # TypeScript type definitions
│   ├── users/                # User management pages
│   ├── settings/             # Settings pages
│   ├── sign-in/              # Authentication pages
│   ├── sign-up/              
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Dashboard page
├── public/                   # Static assets
├── .env.local               # Environment variables
├── package.json             # Dependencies and scripts
└── README.md               # Project documentation
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

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ User Authentication & Authorization
- ✅ Role-based Access Control
- ✅ User Management System
- ✅ Basic Lead Management
- ✅ Responsive UI/UX

### Phase 2 (Coming Soon)
- 🔄 Pipeline Management System
- 🔄 Analytics Dashboard
- 🔄 Advanced Lead Scoring
- 🔄 Email Integration
- 🔄 Notification System

### Phase 3 (Future)
- 📋 Task Management
- 📊 Advanced Reporting
- 🔗 Third-party Integrations
- 📱 Mobile App
- 🤖 AI-powered Insights

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Firebase](https://firebase.google.com/) for authentication services
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [MongoDB](https://www.mongodb.com/) for the database solution

---

**Built with ❤️ by the amTop Team**
