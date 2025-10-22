# 🔔 Configuration des Callbacks Suno API

## ⚠️ Problème Actuel

L'API Suno **ne supporte pas le polling** ! Elle fonctionne uniquement avec des **callbacks HTTP**.

Quand vous générez de la musique :
1. Suno API reçoit la requête
2. Génère la musique (30-60 secondes)
3. **Envoie les résultats à votre `callBackUrl`**

❌ **Problème** : Sans serveur backend, on ne peut pas recevoir ces callbacks !

---

## 💡 Solutions

### Solution 1️⃣ : Supabase Edge Functions (RECOMMANDÉ)

#### A. Déployer la Edge Function

1. Installez Supabase CLI :
```bash
npm install -g supabase
```

2. Initialisez Supabase dans votre projet :
```bash
supabase init
```

3. Déployez la fonction callback :
```bash
supabase functions deploy suno-callback --project-ref YOUR_PROJECT_ID
```

4. Récupérez l'URL de la fonction :
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/suno-callback
```

#### B. Configurez les Secrets

```bash
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### C. Testez la fonction

```bash
curl -i --location --request POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/suno-callback' \
  --header 'Content-Type: application/json' \
  --data '{"code":200,"msg":"test","data":{"callbackType":"complete","task_id":"test123","data":[]}}'
```

---

### Solution 2️⃣ : Webhook.site (TEMPORAIRE - Pour Tests)

Pour tester rapidement **sans backend** :

1. Allez sur https://webhook.site
2. Copiez votre URL unique (ex: `https://webhook.site/abc123`)
3. Modifiez `src/lib/sunoApi.ts` :

```typescript
getCallbackUrl(): string {
  return 'https://webhook.site/abc123'; // Votre URL unique
}
```

4. Générez de la musique
5. Retournez sur webhook.site pour voir les résultats
6. **Copiez manuellement** les URLs audio

**Limitations** :
- ❌ Pas de sauvegarde automatique en base de données
- ❌ Résultats perdus si vous fermez la page
- ✅ Bon pour tester l'API

---

### Solution 3️⃣ : Mode Local avec Ngrok (DÉVELOPPEMENT)

Pour développer localement :

1. Installez ngrok :
```bash
npm install -g ngrok
```

2. Créez un serveur Express simple :

```javascript
// server.js
const express = require('express');
const app = express();
app.use(express.json());

app.post('/suno-callback', (req, res) => {
  console.log('Callback reçu:', req.body);
  // Sauvegarder dans Supabase ici
  res.json({ status: 'received' });
});

app.listen(3001, () => console.log('Server on port 3001'));
```

3. Lancez ngrok :
```bash
ngrok http 3001
```

4. Utilisez l'URL ngrok comme `callBackUrl`

---

## 🚀 Configuration Recommandée (Production)

### Étape 1 : Déployer Supabase Edge Function

```bash
# 1. Connectez-vous à Supabase
supabase login

# 2. Liez votre projet
supabase link --project-ref YOUR_PROJECT_ID

# 3. Déployez la fonction
supabase functions deploy suno-callback
```

### Étape 2 : Mettre à jour `.env`

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Étape 3 : Le code utilisera automatiquement l'Edge Function

Le code dans `src/lib/sunoApi.ts` détecte automatiquement si Supabase est configuré :

```typescript
getCallbackUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  if (supabaseUrl) {
    // ✅ Utilise Supabase Edge Function
    return `${supabaseUrl}/functions/v1/suno-callback`;
  }
  
  // ❌ Fallback
  return 'https://webhook.site/...';
}
```

---

## 🔍 Comment ça marche

```
┌─────────────┐
│   Votre App │
└──────┬──────┘
       │ 1. POST /api/v1/generate
       │    callBackUrl: https://xxx.supabase.co/functions/v1/suno-callback
       ▼
┌─────────────┐
│  Suno API   │
└──────┬──────┘
       │ 2. Génère la musique (30-60s)
       │
       │ 3. POST https://xxx.supabase.co/functions/v1/suno-callback
       │    { taskId, tracks: [...] }
       ▼
┌─────────────────────┐
│ Supabase Edge Func  │
│  suno-callback      │
└──────┬──────────────┘
       │ 4. Sauvegarde dans PostgreSQL
       ▼
┌─────────────┐
│  Database   │
│  - tracks   │
│  - gens     │
└─────────────┘
```

---

## 🧪 Tester la Configuration

### Test 1 : Vérifier l'Edge Function

```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/suno-callback
```

Devrait retourner : `ok` (CORS preflight)

### Test 2 : Envoyer un Callback de Test

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/suno-callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": 200,
    "msg": "Test",
    "data": {
      "callbackType": "complete",
      "task_id": "test-123",
      "data": []
    }
  }'
```

### Test 3 : Générer de la Musique Réelle

1. Dans votre app, générez une musique
2. Attendez 1-2 minutes
3. Vérifiez dans Supabase Dashboard :
   - Table `generations` → statut devrait passer à `completed`
   - Table `tracks` → vos pistes devraient apparaître

---

## 📊 Monitoring

### Voir les logs Supabase Edge Function

```bash
supabase functions logs suno-callback --project-ref YOUR_PROJECT_ID
```

### Vérifier dans Supabase Dashboard

1. Allez dans **Database** > **generations**
2. Cherchez votre `task_id`
3. Vérifiez le `status`

---

## ❓ FAQ

**Q: Pourquoi pas de polling ?**  
R: L'API Suno ne fournit pas d'endpoint pour vérifier le statut. Elle utilise uniquement des callbacks.

**Q: Ça coûte combien Supabase Edge Functions ?**  
R: 500K requêtes/mois gratuites, largement suffisant.

**Q: Puis-je utiliser un autre service ?**  
R: Oui ! Vercel Functions, Netlify Functions, AWS Lambda, etc. L'important est d'avoir un endpoint HTTP public.

**Q: Et pour le mode anonyme (sans Supabase) ?**  
R: Utilisez webhook.site temporairement, ou configurez Supabase (gratuit).

---

## 🎯 Résumé

1. **Production** → Supabase Edge Functions (gratuit, facile)
2. **Test rapide** → webhook.site (temporaire)
3. **Développement** → ngrok + serveur local

**Recommandation** : Configurez Supabase Edge Functions, ça prend 5 minutes ! 🚀

