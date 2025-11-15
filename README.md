# Shattavibe - AI Music Generator

Shattavibe is a modern web application that generates music using AI. Users can create custom tracks by providing text prompts, choosing musical styles, and selecting vocal preferences. The application leverages the **Suno AI API** for music generation and **Supabase** for data persistence.

## What Can Users Do?

With Shattavibe, users can:

- **Generate Music**: Create original music tracks from text prompts using AI
- **Customize Style**: Choose between instrumental or vocal tracks, select genres (Gospel afro-house drill and bass, Choral afro-jazz, Afrobeat, Drill, Trap, Dancehall, Hip-hop, R&B), and specify vocal gender preferences
- **Listen Instantly**: Start listening to tracks as soon as the streaming URL is available (~20-30 seconds) using Suno's streaming feature
- **Manage Library**: Save and organize generated tracks in a personal library
- **Share & Download**: Download tracks as MP3 files or share them with others via the Web Share API or by copying links
- **Use Anonymously or Authenticated**: Works for both anonymous users (with localStorage) and authenticated users (with Supabase persistence)

## Technologies & Services

### Suno AI API

**Suno AI** is the core music generation service that powers Shattavibe:

- **What it does**: Generates high-quality music tracks from text prompts using advanced AI models
- **Models available**: V3.5, V4, V4.5, V4.5+, and V5 (default)
- **Generation process**: 
  - Submits generation request with a callback URL
  - Generates music in the background (typically 30-60 seconds)
  - Sends multiple callbacks: `text` (~20s with streaming URL), `first` (~30-40s), and `complete` (~2-3 min with full quality)
- **Streaming feature**: Provides `stream_audio_url` for immediate playback (~20-30s) and `audio_url` for full quality download (~2-3 min)
- **API Key required**: You need a valid Suno API key from [Suno API](https://sunoapi.org) to use the service

### Supabase

**Supabase** is used for backend services and data persistence:

- **What it does**: Provides PostgreSQL database, authentication, and Edge Functions
- **Database**: Stores user profiles, generation history, and track metadata
- **Edge Functions**: Handles Suno API callbacks (receives completion notifications from Suno)
- **Authentication**: Optional user authentication system
- **Row Level Security (RLS)**: Ensures users can only access their own data
- **Free tier**: 500K Edge Function requests/month (sufficient for most use cases)

### Architecture Overview

The application uses a **callback-based architecture**:

1. User submits a generation request → App sends request to Suno API with callback URL
2. Suno API generates music → Sends callback to Supabase Edge Function when ready
3. Edge Function saves tracks → Updates database with track metadata and URLs
4. App polls database → Detects new tracks and displays them to the user
5. User can play immediately → Uses `stream_audio_url` for fast playback

## Installation & Local Development

### Prerequisites

- **Node.js** 18+ and npm (or pnpm/yarn)
- **Suno API Key** - Get one from [Suno API](https://sunoapi.org)
- **Supabase Account** (optional, for full functionality) - Create a free account at [Supabase](https://supabase.com)

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd "Shattavibe - Copie"
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Required: Suno API Configuration
# Get your API key from https://sunoapi.org
VITE_SUNO_API_KEY=your_suno_api_key_here

# Optional: Supabase Configuration (for authenticated features)
# Get these from your Supabase project settings
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important**: 
- Replace `your_suno_api_key_here` with your actual Suno API key
- The Suno API key is **required** for the application to work
- Without it, music generation will fail
- You can get a key by signing up at [Suno API](https://sunoapi.org)

### Step 4: Set Up Supabase Database (Optional)

If you want to use authenticated features and proper data persistence:

1. Create a new project on [Supabase](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy and execute the SQL schema from `supabase/schema.sql`
4. This creates the necessary tables: `user_profiles`, `generations`, `tracks`, and `anonymous_generations`

### Step 5: Deploy Supabase Edge Function (Optional but Recommended)

For callback handling from Suno API (allows faster track detection):

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login and link your project:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_ID
   ```

3. Deploy the callback function:
   ```bash
   supabase functions deploy suno-callback
   ```

4. Set required secrets:
   ```bash
   supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   The `service_role_key` can be found in: **Settings** > **API** > **Service role (secret)**

### Step 6: Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technical Choices

### Frontend Stack

- **React 18.3.1** - Modern React with hooks for UI components
- **TypeScript 5.3.3** - Type safety and better developer experience
- **Vite 6.3.5** - Fast build tool and development server
- **Tailwind CSS 3.4.1** - Utility-first CSS framework for styling

### UI Components

- **shadcn/ui** - Accessible, customizable component library
- **Radix UI** - Unstyled, accessible UI primitives
- **Lucide React** - Icon library
- **Framer Motion** - Animation library for smooth transitions

### Backend & Services

- **Suno API** - AI music generation service
  - Simple mode generation with customizable prompts
  - Support for multiple models (V3.5, V4, V4.5, V4.5+, V5)
  - Callback-based architecture (no polling)
  - Streaming URLs for fast playback

- **Supabase** - Backend-as-a-Service
  - PostgreSQL database for data persistence
  - Row Level Security (RLS) for data access control
  - Edge Functions for handling Suno API callbacks
  - Optional authentication system

### Architecture Decisions

1. **Callback-Based Generation**: Suno API uses HTTP callbacks instead of polling, requiring a backend endpoint (Supabase Edge Function) to receive completion notifications.

2. **Dual Storage Strategy**: 
   - Authenticated users: Data stored in Supabase
   - Anonymous users: Data stored in localStorage with fallback to `anonymous_generations` table

3. **Type Safety**: Full TypeScript coverage with generated types from Supabase schema

4. **Component Architecture**: Modular screen-based components (HomeScreen, GeneratorScreen, ResultScreen, etc.) for clear separation of concerns

5. **Streaming-First Playback**: Prioritizes `stream_audio_url` for immediate playback (~20-30s) over full quality `audio_url` (~2-3 min)

## Limitations

### API Limitations

- **Suno API**:
  - Simple mode prompts limited to 500 characters
  - Generation time: Typically 30-60 seconds, can take up to 20 minutes
  - Requires valid API key with sufficient credits
  - Callback-based architecture requires a publicly accessible endpoint (Supabase Edge Function or similar)
  - Streaming URL available in ~20-30 seconds, full quality URL in ~2-3 minutes

- **Model-Specific Limits**:
  - V3.5, V4: Maximum 4-minute tracks
  - V4.5, V4.5+: Maximum 8-minute tracks
  - V5: No specific duration limit

### Application Limitations

- **Anonymous Users**: 
  - Data stored in localStorage (limited by browser storage)
  - No cross-device synchronization
  - Data can be lost if browser storage is cleared

- **Supabase Edge Functions**:
  - Free tier: 500K requests/month
  - Cold start latency for first request
  - Requires proper CORS configuration

- **Browser Compatibility**:
  - Requires modern browser with ES2020+ support
  - Audio playback depends on browser codec support
  - Web Share API only available on mobile and some desktop browsers

### Development Limitations

- **Local Development**: 
  - Callback testing requires a public URL (use ngrok or webhook.site for testing)
  - Supabase Edge Functions must be deployed to test callback flow

- **Environment Variables**: 
  - Must be prefixed with `VITE_` to be accessible in the browser
  - Sensitive keys should never be committed to version control
  - Suno API key is required for the application to function

## Project Structure

```
Shattavibe - Copie/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── HomeScreen.tsx
│   │   ├── GeneratorScreen.tsx
│   │   ├── GeneratingScreen.tsx
│   │   ├── ResultScreen.tsx
│   │   └── ...
│   ├── config/             # Configuration files
│   │   └── suno.ts         # Suno API configuration
│   ├── hooks/              # Custom React hooks
│   │   └── useSunoGeneration.ts
│   ├── lib/                # Utility libraries
│   │   ├── sunoApi.ts      # Suno API client
│   │   ├── supabase.ts     # Supabase client
│   │   ├── generationService.ts
│   │   ├── audioUtils.ts   # Audio download/share utilities
│   │   └── ...
│   ├── types/              # TypeScript type definitions
│   │   ├── suno.ts
│   │   └── database.ts
│   └── App.tsx             # Main application component
├── supabase/
│   ├── functions/          # Supabase Edge Functions
│   │   └── suno-callback/  # Callback handler
│   ├── migrations/         # Database migrations
│   └── schema.sql          # Database schema
├── .env                    # Environment variables (not committed)
└── package.json
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

---

Made with ❤️ using React, TypeScript, and AI-powered music generation.
