# 🚀 Configuration Lovable

Ce document explique comment ce projet est configuré pour être compatible avec [Lovable.dev](https://lovable.dev).

## ✅ Stack Technique Lovable

### Frontend ✓
- **React 18.3.1** - Bibliothèque UI moderne
- **TypeScript 5.3.3** - Typage statique
- **Tailwind CSS 3.4.1** - Framework CSS utility-first
- **Vite 6.3.5** - Outil de build ultra-rapide

### UI Components ✓
- **shadcn/ui** - Composants réutilisables et accessibles
- **Radix UI** - Primitives UI accessibles
- **Lucide React** - Bibliothèque d'icônes
- **CVA** - Gestion des variantes de composants

### État & Formulaires ✓
- **React Hook Form** - Gestion des formulaires
- **next-themes** - Gestion du thème clair/sombre

## 📁 Structure du Projet

```
ShattaVibe/
├── src/
│   ├── lib/
│   │   └── utils.ts           # Utilitaires (cn, etc.)
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── HomeScreen.tsx
│   │   ├── GeneratorScreen.tsx
│   │   └── ...
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tailwind.config.ts         # Configuration Tailwind
├── tsconfig.json              # Configuration TypeScript
├── vite.config.ts             # Configuration Vite
├── postcss.config.js          # Configuration PostCSS
├── components.json            # Configuration shadcn/ui
└── package.json
```

## 🔧 Fichiers de Configuration Créés

### 1. `tsconfig.json`
Configuration TypeScript avec:
- Support ES2020
- Mode strict activé
- Path aliases (`@/*` → `./src/*`)
- Optimisations pour Vite

### 2. `tailwind.config.ts`
Configuration Tailwind avec:
- Variables CSS personnalisées
- Thème étendu
- Support dark mode
- Plugin tailwindcss-animate

### 3. `postcss.config.js`
Configuration PostCSS pour Tailwind et Autoprefixer

### 4. `components.json`
Configuration shadcn/ui pour:
- Alias de chemins
- Style par défaut
- Support TypeScript

### 5. `.eslintrc.cjs`
Configuration ESLint pour React + TypeScript

### 6. `.gitignore`
Exclusion des fichiers sensibles et de build

## 🔌 Backend & Base de Données (Optionnel)

### Support OpenAPI
Le projet peut se connecter à n'importe quel backend OpenAPI. Exemple:

```typescript
// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchData(endpoint: string) {
  const response = await fetch(`${API_URL}${endpoint}`);
  return response.json();
}
```

### Support Supabase (Alpha sur Lovable)
Pour ajouter l'authentification et la persistance:

1. Installer le client Supabase:
```bash
npm install @supabase/supabase-js
```

2. Créer `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

3. Ajouter les variables d'environnement:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🚀 Déploiement sur Lovable

### Étapes:
1. **Pousser sur Git**
   ```bash
   git add .
   git commit -m "Ready for Lovable"
   git push origin main
   ```

2. **Importer sur Lovable**
   - Aller sur [lovable.dev](https://lovable.dev)
   - Cliquer sur "Import Project"
   - Connecter votre dépôt Git
   - Lovable détectera automatiquement la configuration

3. **Déployer**
   - Lovable construira et déploiera automatiquement
   - Vous obtiendrez une URL de production

### Variables d'Environnement sur Lovable
Dans les paramètres du projet Lovable, ajouter:
- `VITE_SUPABASE_URL` (si utilisé)
- `VITE_SUPABASE_ANON_KEY` (si utilisé)
- Autres variables API selon vos besoins

## 📋 Checklist Pré-Déploiement

- ✅ `tsconfig.json` configuré
- ✅ `tailwind.config.ts` configuré
- ✅ `postcss.config.js` configuré
- ✅ Tous les composants UI importent `@/lib/utils`
- ✅ Dependencies correctement installées
- ✅ `.gitignore` configuré
- ✅ `.env.example` documenté
- ✅ README.md à jour
- ✅ Le projet build sans erreurs (`npm run build`)

## 🧪 Tests Locaux

Avant de déployer sur Lovable, tester localement:

```bash
# Installer les dépendances
npm install

# Lancer en dev
npm run dev

# Vérifier le linting
npm run lint

# Build de production
npm run build

# Prévisualiser le build
npm run preview
```

## 💡 Conseils

### Performance
- Lovable optimise automatiquement les images
- Utilisez le lazy loading pour les composants lourds
- Minimisez les dépendances

### SEO
- Ajoutez des métadonnées dans `index.html`
- Utilisez des balises sémantiques HTML
- Optimisez les titres et descriptions

### Accessibilité
- Les composants Radix UI sont accessibles par défaut
- Testez avec un lecteur d'écran
- Vérifiez les contrastes de couleurs

## 🆘 Dépannage

### Erreurs de Build
- Vérifier que toutes les dépendances sont installées
- Supprimer `node_modules` et réinstaller
- Vérifier les imports avec `@/` alias

### Erreurs TypeScript
- Vérifier `tsconfig.json`
- S'assurer que les types sont installés (`@types/*`)

### Problèmes Tailwind
- Vérifier que `postcss.config.js` existe
- Purger le cache: `npm run build -- --force`

## 📚 Ressources

- [Documentation Lovable](https://docs.lovable.dev)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation shadcn/ui](https://ui.shadcn.com)
- [Documentation Vite](https://vitejs.dev)
- [Documentation Supabase](https://supabase.com/docs)

---

**Projet prêt pour Lovable.dev ! 🎉**

