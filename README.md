# ShattaVibe Generator Design

A modern music generator application built with React, TypeScript, Tailwind CSS, and Vite. This project is **fully compatible with Lovable.dev** for easy deployment and iteration.

## 🚀 Lovable Compatibility

This project follows Lovable's stack requirements:
- ✅ **React 18.3.1** - Modern React with hooks
- ✅ **Tailwind CSS 3.4.1** - Utility-first CSS framework
- ✅ **Vite 6.3.5** - Lightning-fast build tool
- ✅ **TypeScript** - Type-safe development
- ✅ **shadcn/ui + Radix UI** - Accessible component library
- ✅ **OpenAPI Ready** - Can connect to OpenAPI backends
- 🔄 **Supabase Ready** - Ready for authentication and data persistence

## 📦 Project Structure

```
ShattaVibe/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── HomeScreen.tsx
│   │   ├── GeneratorScreen.tsx
│   │   ├── GeneratingScreen.tsx
│   │   ├── ResultScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── App.tsx           # Main application
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── tailwind.config.ts    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── package.json          # Dependencies
```

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ or npm/pnpm/yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Shattavibe
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code with ESLint

## 🎨 Tech Stack

### Core
- **React 18.3** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling

### UI Components
- **shadcn/ui** - Re-usable components
- **Radix UI** - Accessible primitives
- **Lucide React** - Icons
- **Framer Motion** - Animations

### Forms & State
- **React Hook Form** - Form management
- **next-themes** - Theme switching

### Utilities
- **class-variance-authority** - Component variants
- **clsx** + **tailwind-merge** - Class merging
- **sonner** - Toast notifications

## 🌐 Deploying to Lovable

1. Push your code to GitHub/GitLab
2. Go to [Lovable.dev](https://lovable.dev)
3. Import your repository
4. Lovable will automatically detect the configuration
5. Deploy! 🚀

## 🔧 Adding Supabase (Optional)

To add authentication and database:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env` file:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```
4. Install Supabase client:
```bash
npm install @supabase/supabase-js
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🎵 About ShattaVibe

ShattaVibe is a music generation application that helps users create unique music experiences. The design was originally created in Figma and converted to a fully functional React application.

Original Figma Design: [ShattaVibe Generator Design](https://www.figma.com/design/XDalgNdWBXbheu64PokHSY/ShattaVibe-Generator-Design)

---

Made with ❤️ and ready for [Lovable.dev](https://lovable.dev)
