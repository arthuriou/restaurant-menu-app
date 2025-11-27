# 🔥 Guide de Configuration Firebase (Multi-Restaurant)

Ce guide vous explique comment configurer un projet Firebase pour un nouveau restaurant.
Chaque restaurant doit avoir son propre projet Firebase pour garantir la sécurité et l'indépendance des données.

---

## 1️⃣ Créer un projet Firebase

1. Allez sur la [Console Firebase](https://console.firebase.google.com/).
2. Cliquez sur **"Ajouter un projet"**.
3. Donnez un nom au projet (ex: `restaurant-koffi`).
4. Désactivez Google Analytics (pas nécessaire pour le moment).
5. Cliquez sur **"Créer un projet"**.

---

## 2️⃣ Activer l'Authentification

1. Dans le menu de gauche, cliquez sur **Build** > **Authentication**.
2. Cliquez sur **"Commencer"**.
3. Dans l'onglet **Sign-in method**, choisissez **E-mail/Mot de passe**.
4. Activez l'option **Email/Password** et cliquez sur **Enregistrer**.

---

## 3️⃣ Créer la Base de Données (Firestore)

1. Dans le menu de gauche, cliquez sur **Build** > **Firestore Database**.
2. Cliquez sur **"Créer une base de données"**.
3. Choisissez l'emplacement (ex: `eur3` pour l'Europe ou `nam5` pour US).
4. Choisissez **"Démarrer en mode test"** (pour le développement initial).
5. Cliquez sur **"Créer"**.

---

## 4️⃣ Configurer les Règles de Sécurité

Une fois la base créée, allez dans l'onglet **Règles** et remplacez tout par ceci :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Fonction pour vérifier si l'utilisateur est connecté
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Fonction pour vérifier le rôle (optionnel pour le moment)
    function hasRole(role) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }

    // 1. Utilisateurs : Chacun peut lire son propre profil
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if request.auth.uid == userId || hasRole('admin');
    }

    // 2. Commandes : Tout le monde authentifié peut lire/écrire (Client, Serveur, Cuisine)
    // Note: Pour plus de sécurité, on pourrait restreindre les clients à leurs propres commandes
    match /orders/{orderId} {
      allow read, write: if true; // Ouvert pour permettre aux clients non-auth de commander (si besoin)
      // Si vous forcez le login client, mettez : allow read, write: if isAuthenticated();
    }

    // 3. Menu (Catégories et Produits) : Lecture publique, Écriture Admin seulement
    match /categories/{catId} {
      allow read: if true;
      allow write: if isAuthenticated(); // À restreindre aux admins plus tard
    }
    match /products/{prodId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }

    // 4. Tables : Lecture publique (pour scan QR), Écriture Staff
    match /tables/{tableId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
  }
}
```
Cliquez sur **Publier**.

---

## 5️⃣ Récupérer les Clés API

1. Cliquez sur la **roue dentée** (Paramètres) > **Paramètres du projet**.
2. Descendez jusqu'à "Vos applications".
3. Cliquez sur l'icône **Web** (`</>`).
4. Donnez un nom (ex: `Web App`).
5. Copiez la configuration `const firebaseConfig = { ... }`.

Vous aurez besoin de ces valeurs pour votre fichier `.env` :
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

---

## 6️⃣ Configurer le Restaurant

1. Dans votre code, dupliquez `envs/template.env` vers `envs/nom-du-client.env`.
2. Remplissez les variables avec les clés récupérées à l'étape 5.
3. Activez la config : `npm run env:set nom-du-client`.

---

## 7️⃣ Créer le Compte Administrateur

Pour accéder à l'interface d'administration, vous devez créer **un seul compte Admin** manuellement dans la console Firebase.

1. Allez dans **Authentication** > **Users** > **Ajouter un utilisateur**.
2. Créez le compte Admin (ex: `admin@resto.com`).

Ensuite, donnez-lui le rôle Admin dans Firestore :

1. Allez dans **Firestore Database**.
2. Cliquez sur **+ Commencer une collection**.
3. Nom de la collection : `users`.
4. **ID du document** : ⚠️ COPIEZ L'UID DE L'ADMIN (trouvé dans l'onglet Authentication).
5. Champs :
   - `email` (string) : `admin@resto.com`
   - `role` (string) : `admin`
   - `name` (string) : `Administrateur`

### Et pour les Serveurs / Cuisiniers ?
**NE LES CRÉEZ PAS DANS FIREBASE CONSOLE.**
Le système utilise maintenant des **Codes PIN**.

1. Connectez-vous à l'application avec le compte Admin créé ci-dessus.
2. Allez dans **Admin > Équipe**.
3. Cliquez sur "Ajouter un membre" pour créer vos serveurs et cuisiniers avec leur Code PIN.
4. Ils pourront ensuite se connecter via l'onglet "Code PIN" sur la page de login.

---

## 8️⃣ Configuration du Restaurant (Nom, Logo, Infos)

Plus besoin de toucher au code pour changer le nom ou le logo !

1. Allez dans **Firestore Database**.
2. Créez une collection nommée `settings`.
3. Créez un document avec l'ID `general` (très important).
4. Ajoutez les champs suivants :
   - `companyName` (string) : "Chez Koffi"
   - `companyAddress` (string) : "Rue des Jardins, Abidjan"
   - `companyPhone` (string) : "+225 07 07 07 07"
   - `companyEmail` (string) : "koffi@resto.com"
   - `taxId` (string) : "CC-123456"
   - `logoUrl` (string) : "https://lien-vers-le-logo.png" (optionnel)

L'application chargera ces infos automatiquement.

---

## 9️⃣ Données de Démarrage (Menu & Tables)

Votre application est vide ! Pour ajouter des données :

1. Connectez-vous en tant qu'Admin sur l'application (`/admin`).
2. Allez dans **Menu** et ajoutez vos catégories et plats.
3. Allez dans **Salles** et ajoutez vos tables.

Ces données seront automatiquement sauvegardées dans votre nouveau Firestore.

🚀 **C'est tout ! Votre restaurant est prêt.**
