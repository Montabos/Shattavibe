# 🎵 Bangr - Instructions de Configuration

## 📋 Prérequis

- Node.js 18+ installé
- Compte Supabase (gratuit)
- Clé API Suno

---

## 🔧 Configuration Étape par Étape

### 1️⃣ Configuration de l'Environnement

Créez un fichier `.env` à la racine du projet :

```env
# Suno API (DÉJÀ CONFIGURÉ)
VITE_SUNO_API_KEY=c818390988956a5fffd93bb4d3bd1273

# Supabase (À CONFIGURER)
VITE_SUPABASE_URL=https://votre-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=votre-anon-key
```

### 2️⃣ Configuration de Supabase

#### A. Créer un Projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un compte (gratuit)
3. Cliquez sur "New Project"
4. Remplissez les informations :
   - **Name**: Bangr
   - **Database Password**: (choisissez un mot de passe fort)
   - **Region**: Choisissez le plus proche de vous
   - **Pricing Plan**: Free

#### B. Récupérer les Clés API

1. Dans votre projet Supabase, allez à **Settings** (⚙️) > **API**
2. Copiez les valeurs suivantes :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

#### C. Créer les Tables de Base de Données

1. Dans Supabase, allez à **SQL Editor**
2. Créez une nouvelle requête
3. Copiez-collez le contenu du fichier `supabase/schema.sql`
4. Exécutez la requête (bouton **RUN**)

Cela créera :
- ✅ Table `user_profiles` - Profils utilisateurs
- ✅ Table `generations` - Historique des générations
- ✅ Table `tracks` - Pistes musicales générées
- ✅ Row Level Security (RLS) activé
- ✅ Triggers et fonctions automatiques

### 3️⃣ Installation des Dépendances

```bash
npm install
```

Cette commande installera :
- Supabase client (`@supabase/supabase-js`)
- Toutes les dépendances React, Vite, Tailwind
- Composants UI (shadcn/ui, Radix UI)

### 4️⃣ Lancer l'Application

```bash
# Mode développement
npm run dev

# Build de production
npm run build

# Prévisualiser le build
npm run preview
```

L'application sera disponible sur **http://localhost:3000**

---

## 🎯 Fonctionnalités Configurées

### ✅ Génération de Musique avec Suno AI

- Mode Simple : Entrez un prompt → Musique générée automatiquement
- Choix du modèle : V3.5, V4, V4.5, V4.5+, V5
- Options vocales : Instrumental, Voix masculine/féminine
- Polling automatique toutes les 30 secondes
- Timeout : 20 minutes maximum

### ✅ Stockage avec Supabase

- **Authentification** : Prête (à activer selon besoin)
- **Générations** : Historique sauvegardé dans la DB
- **Tracks** : Métadonnées et URLs stockées
- **Profils** : Suivi des crédits utilisés

### ✅ Interface Utilisateur

- **HomeScreen** : Écran d'accueil
- **GeneratorScreen** : Formulaire de génération
  - Sélection du vibe (Hype, Chill, Party, Vibes)
  - Prompt personnalisable
  - Options vocales (Instrumental/Vocals, Genre)
- **GeneratingScreen** : Affichage du statut en temps réel
  - Barre de progression
  - Messages de statut
  - Gestion d'erreurs
- **ResultScreen** : Lecture et gestion des pistes
  - Lecteur audio intégré
  - Cover image
  - Téléchargement MP3
  - Partage
  - Affichage des lyrics
  - Navigation multi-pistes

---

## 🔍 Architecture du Projet

```
Bangr/
├── src/
│   ├── types/
│   │   ├── suno.ts          # Types API Suno
│   │   └── database.ts      # Types Supabase
│   ├── config/
│   │   └── suno.ts          # Configuration Suno
│   ├── lib/
│   │   ├── supabase.ts      # Client Supabase
│   │   ├── sunoApi.ts       # Client API Suno
│   │   ├── generationService.ts  # Service de génération
│   │   └── utils.ts         # Utilitaires (cn, etc.)
│   ├── hooks/
│   │   └── useSunoGeneration.ts  # Hook de génération
│   ├── components/
│   │   ├── ui/              # Composants shadcn/ui
│   │   ├── HomeScreen.tsx
│   │   ├── GeneratorScreen.tsx
│   │   ├── GeneratingScreen.tsx
│   │   ├── ResultScreen.tsx
│   │   └── ProfileScreen.tsx
│   └── App.tsx              # Orchestration
├── supabase/
│   └── schema.sql           # Schéma DB
├── .env                     # Variables d'environnement
└── package.json
```

---

## 🚨 Dépannage

### Problème : "API Key not set"
**Solution** : Vérifiez que `.env` existe et contient `VITE_SUNO_API_KEY`

### Problème : "Supabase URL not configured"
**Solution** : Configurez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env`

### Problème : Erreur de génération
**Solutions** :
1. Vérifiez votre clé API Suno
2. Vérifiez les crédits restants sur votre compte Suno
3. Consultez la console du navigateur pour plus de détails

### Problème : Erreur Supabase
**Solutions** :
1. Vérifiez que le schéma SQL a été exécuté
2. Vérifiez les clés API Supabase
3. Vérifiez que RLS est activé

---

## 📊 Limites de l'API Suno

### Prompts
- **Mode Simple** : Max 500 caractères
- **Mode Custom** :
  - V3.5/V4 : Max 3000 caractères
  - V4.5/V4.5+/V5 : Max 5000 caractères

### Durée des Pistes
- **V3.5, V4** : Max 4 minutes
- **V4.5, V4.5+** : Max 8 minutes
- **V5** : Pas de limite spécifiée

### Génération
- Temps moyen : 30-60 secondes
- Timeout : 20 minutes (40 polls × 30s)
- 2 pistes générées par défaut

---

## 🔐 Sécurité

### Variables d'Environnement
- ✅ Ne JAMAIS committer `.env`
- ✅ `.env` est dans `.gitignore`
- ✅ Utiliser `.env.example` comme template

### Supabase RLS
- ✅ Row Level Security activé
- ✅ Les utilisateurs ne voient que leurs propres données
- ✅ Policies configurées automatiquement

---

## 🚀 Déploiement sur Lovable

1. **Push sur Git** :
```bash
git add .
git commit -m "feat: Integration complete Suno + Supabase"
git push origin main
```

2. **Import sur Lovable** :
   - Allez sur [lovable.dev](https://lovable.dev)
   - Importez votre repository
   - Lovable détecte automatiquement la config

3. **Variables d'Environnement sur Lovable** :
   - Dans les paramètres du projet
   - Ajoutez `VITE_SUNO_API_KEY`
   - Ajoutez `VITE_SUPABASE_URL`
   - Ajoutez `VITE_SUPABASE_ANON_KEY`

4. **Déployez** 🎉

---

## 📚 Documentation Complète

- **Suno API** : Documentation fournie dans la conversation
- **Supabase** : [supabase.com/docs](https://supabase.com/docs)
- **Lovable** : [docs.lovable.dev](https://docs.lovable.dev)
- **Tailwind CSS** : [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **shadcn/ui** : [ui.shadcn.com](https://ui.shadcn.com)

---

## 🎉 Félicitations !

Votre application Bangr est maintenant :
- ✅ Configurée pour générer de la musique avec Suno AI
- ✅ Intégrée avec Supabase pour le stockage
- ✅ Prête pour Lovable.dev
- ✅ 100% TypeScript avec types complets
- ✅ UI moderne et responsive

**Profitez de votre générateur de musique ! 🎵🔥**

