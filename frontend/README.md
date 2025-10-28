# AI Interview Platform - Frontend

A modern, responsive React frontend for the AI-powered interview platform, inspired by industry leaders like FloCareer.

## 🚀 Features

### Core Features
- **Modern UI/UX**: Clean, professional design with Tailwind CSS
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-time Video Interviews**: WebRTC integration for seamless video calls
- **AI-Powered Evaluation**: Instant feedback and scoring
- **Role-based Access**: Different views for candidates and HR professionals
- **Advanced Analytics**: Comprehensive reporting and insights

### Key Components

#### Layout Components
- `Header`: Navigation with user authentication
- `Footer`: Site information and links
- `Layout`: Main layout wrapper with header and footer

#### UI Components
- `Button`: Reusable button with multiple variants
- `Input`: Form input with validation and icons
- `Card`: Content container with customizable styling
- `Modal`: Overlay component for dialogs

#### Interview Components
- `VideoCall`: WebRTC video call interface
- `QuestionDisplay`: Interview question presentation
- `Evaluation`: Results and feedback display

#### HR Components
- `CandidateList`: Candidate management interface
- `InterviewReports`: Interview results and analytics
- `Analytics`: Comprehensive dashboard with metrics

## 🛠️ Tech Stack

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Clerk**: Authentication and user management
- **WebRTC**: Real-time video communication
- **Axios**: HTTP client for API calls

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable components
│   │   ├── layout/        # Layout components
│   │   ├── ui/            # Basic UI components
│   │   ├── interview/     # Interview-specific components
│   │   └── hr/            # HR dashboard components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Clerk account for authentication

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Clerk publishable key:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)
- **Gray**: Various shades for text and backgrounds

### Typography
- **Headings**: Inter font family
- **Body**: System font stack
- **Sizes**: Responsive scale from 12px to 48px

### Components
All components follow a consistent design system with:
- Consistent spacing (4px, 8px, 16px, 24px, 32px)
- Rounded corners (4px, 8px, 12px)
- Box shadows (sm, md, lg)
- Hover and focus states
- Loading states

## 🔐 Authentication

The app uses Clerk for authentication with:
- Email/password login
- Social login (Google, GitHub)
- User profile management
- Role-based access control

## 📱 Responsive Design

The frontend is fully responsive with breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🧪 Testing

### Component Testing
```bash
npm run test
```

### E2E Testing
```bash
npm run test:e2e
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Build
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 🔧 Configuration

### Tailwind CSS
Custom configuration in `tailwind.config.js`:
- Custom color palette
- Extended spacing scale
- Custom component classes

### Vite
Configuration in `vite.config.ts`:
- React plugin
- Path aliases
- Environment variables

## 📊 Performance

### Optimization Features
- Code splitting with React.lazy
- Image optimization
- Bundle size analysis
- Tree shaking
- CSS purging

### Performance Metrics
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

## 🐛 Troubleshooting

### Common Issues

1. **Clerk authentication not working**
   - Check VITE_CLERK_PUBLISHABLE_KEY in .env
   - Verify Clerk dashboard configuration

2. **API calls failing**
   - Check VITE_API_BASE_URL in .env
   - Ensure backend server is running

3. **Video calls not working**
   - Check browser permissions for camera/microphone
   - Verify WebRTC configuration

4. **Build errors**
   - Clear node_modules and reinstall
   - Check TypeScript errors
   - Verify all dependencies are installed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

---

Built with ❤️ using React, TypeScript, and Tailwind CSS
