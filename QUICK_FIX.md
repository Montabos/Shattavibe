# 🔧 FIX RAPIDE - Suno API Callbacks

## ⚡ Solution Rapide (5 minutes)

L'erreur `404` vient du fait que l'API Suno n'a **pas d'endpoint de polling**.  
Elle fonctionne uniquement avec des **callbacks**.

### Option 1 : Webhook.site (TEST IMMÉDIAT)

1. **Allez sur** : https://webhook.site
2. **Copiez** votre URL unique (ex: `https://webhook.site/abc123-def456`)
3. **Modifiez** `src/lib/sunoApi.ts` ligne ~90 :

```typescript
getCallbackUrl(): string {
  // REMPLACEZ PAR VOTRE URL WEBHOOK.SITE
  return 'https://webhook.site/abc123-def456';
}
```

4. **Relancez** :
```bash
npm run dev
```

5. **Générez une musique**
6. **Retournez sur webhook.site** (gardez l'onglet ouvert)
7. **Attendez 1-2 minutes** → Les résultats apparaîtront !
8. **Copiez les URLs audio** depuis le payload JSON

---

### Option 2 : Supabase Edge Function (SOLUTION PERMANENTE)

**Prérequis** : Avoir un projet Supabase

#### Étape 1 : Installer Supabase CLI

```bash
npm install -g supabase
```

#### Étape 2 : Se connecter

```bash
supabase login
```

#### Étape 3 : Lier le projet

```bash
supabase link --project-ref VOTRE_PROJECT_ID
```

Trouvez votre `PROJECT_ID` dans l'URL Supabase :
`https://app.supabase.com/project/VOTRE_PROJECT_ID`

#### Étape 4 : Déployer la fonction

```bash
supabase functions deploy suno-callback
```

#### Étape 5 : Configurer les secrets

```bash
supabase secrets set SUPABASE_URL=https://VOTRE_PROJECT_ID.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

Le `service_role_key` se trouve dans :
**Settings** > **API** > **Service role (secret)**

#### Étape 6 : Mettre à jour `.env`

```env
VITE_SUPABASE_URL=https://VOTRE_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
```

#### Étape 7 : Relancer

```bash
npm run dev
```

✅ **Maintenant l'app utilisera automatiquement l'Edge Function !**

---

## 🧪 Tester

### Test manuel de l'Edge Function

```bash
curl -X POST https://VOTRE_PROJECT_ID.supabase.co/functions/v1/suno-callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": 200,
    "msg": "test",
    "data": {
      "callbackType": "complete",
      "task_id": "test123",
      "data": []
    }
  }'
```

Devrait retourner : `{"status":"received"}`

---

## 🎯 Quelle option choisir ?

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| **webhook.site** | ✅ Instantané<br>✅ Pas de config | ❌ Temporaire<br>❌ Manuel |
| **Supabase Edge** | ✅ Automatique<br>✅ Sauvegarde DB<br>✅ Gratuit | ⏱️ 5 min setup |

**Recommandation** : 
- **Maintenant** → webhook.site pour tester
- **Après** → Supabase Edge Functions

---

## 📝 Modification du Code (Déjà fait !)

J'ai déjà modifié le code pour :
- ✅ Supprimer le polling (qui ne fonctionnait pas)
- ✅ Ajouter `getCallbackUrl()` qui détecte Supabase
- ✅ Créer la Supabase Edge Function dans `supabase/functions/`

Il vous suffit de choisir une option ci-dessus ! 🚀

