# 🌳 FamilyTree - Multi-Tenant Family Tree Web Application

A modern, secure, and feature-rich family tree application built with React, TypeScript, Supabase, and TailwindCSS.

![Family Tree App](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Supabase](https://img.shields.io/badge/Supabase-Latest-green) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-cyan)

## ✨ Features

### Core Features (MVP)
- ✅ **Multi-Tenant Architecture** - Multiple independent family trees
- ✅ **Secure Authentication** - Email/password with Supabase Auth
- ✅ **Role-Based Access Control** - Owner, Admin, Contributor, Viewer roles
- 🚧 **Smart Relationship Mapping** - Automatic parent-child detection
- 🚧 **Duplicate Detection** - Fuzzy name matching with pg_trgm
- 🚧 **Tree Visualization** - Interactive family tree with React Flow
- 🚧 **Export Capabilities** - PNG, PDF, and CSV exports
- 🚧 **Family History** - Rich text stories with media uploads
- ✅ **Responsive Design** - Beautiful UI with dark mode support

### Security Features
- Row-Level Security (RLS) in PostgreSQL
- Password-protected family ownership
- Encrypted data storage
- Audit logging for all changes
- Circular relationship prevention

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for blazing-fast builds
- TailwindCSS for styling
- React Router for navigation
- React Query for data fetching
- React Flow for tree visualization
- Lucide React for icons

**Backend:**
- Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- Row-Level Security (RLS)
- PostgreSQL with pg_trgm extension
- Serverless architecture

**Deployment:**
- Frontend: Vercel / Netlify / Cloudflare Pages (Free tier)
- Backend: Supabase (Free tier)
- CI/CD: GitHub Actions

### Database Schema

The application uses a multi-tenant architecture with the following key tables:

- `users` - User accounts
- `families` - Family tree containers
- `persons` - Global canonical person records
- `family_members` - Tenant-scoped family members
- `relationships` - Parent-child relationships
- `family_memberships` - User roles per family
- `family_history` - Stories and events
- `audit_log` - Change tracking

See `database/schema.sql` for the complete schema.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works great)
- Git

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd family-tree
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in your project details
4. Wait for the database to be provisioned

#### Run the Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `database/schema.sql`
3. Paste and run the SQL script
4. Verify all tables and functions were created

#### Configure Authentication

1. In Supabase dashboard, go to Authentication > Settings
2. Enable Email provider
3. Configure email templates (optional)
4. Set site URL to your development URL (e.g., `http://localhost:5173`)

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project settings under API.

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
family-tree/
├── database/
│   └── schema.sql              # Complete database schema
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication context
│   ├── lib/
│   │   └── supabase.ts         # Supabase client & types
│   ├── pages/
│   │   ├── LandingPage.tsx     # Public landing page
│   │   ├── SignIn.tsx          # Sign in page
│   │   ├── SignUp.tsx          # Sign up page
│   │   ├── Dashboard.tsx       # User dashboard
│   │   ├── FamilyView.tsx      # Family tree management
│   │   ├── TreeView.tsx        # Tree visualization
│   │   ├── MemberProfile.tsx   # Member details
│   │   └── FamilyHistory.tsx   # Family stories
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   └── style.css               # Global styles
├── .env.example                # Environment template
├── package.json
├── tailwind.config.js
└── README.md
```

## 🎨 Design System

The application uses a custom design system with:

- **Color Palette**: Primary blue with semantic colors
- **Typography**: Inter font family
- **Components**: Reusable button, card, and input styles
- **Dark Mode**: Full dark mode support
- **Animations**: Smooth transitions and micro-interactions

### Custom CSS Classes

```css
.btn-primary      /* Primary action button */
.btn-secondary    /* Secondary action button */
.card             /* Card container */
.input-field      /* Form input */
.label            /* Form label */
.glass            /* Glassmorphism effect */
.gradient-text    /* Gradient text effect */
```

## 🔐 Security Considerations

### Row-Level Security (RLS)

All tables use RLS policies to ensure users can only access families they're members of:

```sql
CREATE POLICY family_members_access ON family_members
  USING (
    family_id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND accepted = true
    )
  );
```

### Password Security

- Family owner passwords are hashed using bcrypt
- User authentication handled by Supabase Auth
- All API calls use JWT tokens

### Data Validation

- Input validation on both client and server
- Circular relationship prevention
- Self-parent relationship prevention

## 📊 Database Functions

### Find Similar Persons (Duplicate Detection)

```sql
SELECT * FROM find_similar_persons('John Smith', '1950-01-01', 0.6);
```

### Get Ancestors

```sql
SELECT * FROM get_ancestors('member-uuid');
```

### Get Descendants

```sql
SELECT * FROM get_descendants('member-uuid');
```

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

```bash
# Or use Vercel CLI
npm install -g vercel
vercel
```

### Frontend Deployment (Netlify)

```bash
# Build command
npm run build

# Publish directory
dist
```

### Environment Variables

Don't forget to add your environment variables in your deployment platform:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linter
npm run lint

# Type check
npm run type-check
```

## 📈 Roadmap

### Phase 1: Foundation ✅
- [x] Database schema
- [x] Authentication
- [x] Basic UI/UX
- [x] Landing page
- [x] Dashboard

### Phase 2: Core Features 🚧
- [ ] Add family members
- [ ] Relationship mapping
- [ ] Duplicate detection
- [ ] Tree visualization
- [ ] Member profiles

### Phase 3: Advanced Features
- [ ] Export (PNG, PDF, CSV)
- [ ] Family history
- [ ] Media uploads
- [ ] Invite system
- [ ] Search functionality

### Phase 4: Polish
- [ ] Mobile optimization
- [ ] Performance optimization
- [ ] Analytics
- [ ] Documentation
- [ ] Testing

### Future Enhancements
- [ ] GEDCOM import/export
- [ ] DNA visualization
- [ ] Multi-language support
- [ ] Public family pages
- [ ] AI-based relationship inference
- [ ] Mobile PWA

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the amazing backend platform
- [React Flow](https://reactflow.dev) for tree visualization
- [Lucide](https://lucide.dev) for beautiful icons
- [TailwindCSS](https://tailwindcss.com) for the utility-first CSS framework

## 📞 Support

For support, email support@familytree.app or open an issue on GitHub.

---

**Built with ❤️ for families everywhere**
