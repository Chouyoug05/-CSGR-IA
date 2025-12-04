// Système Firebase pour CSGR-IA
window.CSGRFirebase = {
  initialized: false,
  db: null,
  auth: null,
  
  // Cache local pour accélérer les rechargements
  _cache: {},
  _cacheExpiry: 60000, // 1 minute
  
  _getFromCache: function(key) {
    const cached = this._cache[key];
    if (cached && (Date.now() - cached.timestamp) < this._cacheExpiry) {
      console.log(`📦 Cache hit: ${key}`);
      return cached.data;
    }
    return null;
  },
  
  _setCache: function(key, data) {
    this._cache[key] = { data: data, timestamp: Date.now() };
  },
  
  _clearCache: function(key) {
    if (key) {
      delete this._cache[key];
    } else {
      this._cache = {};
    }
  },

  // Initialiser Firebase
  init: async function() {
    try {
      // Vérifier que Firebase SDK est chargé
      if (typeof firebase === 'undefined') {
        const error = 'Firebase SDK n\'est pas chargé. Vérifiez que les scripts Firebase sont inclus dans le HTML.';
        console.error('❌', error);
        throw new Error(error);
      }
      
      if (!window.firebaseConfig) {
        const error = 'Configuration Firebase manquante. Vérifiez que firebase-config.js est chargé.';
        console.error('❌', error);
        throw new Error(error);
      }

      // Initialiser l'app Firebase
      if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp(window.firebaseConfig);
        console.log('✅ Firebase App initialisée');
      }

      // Initialiser Firestore
      this.db = firebase.firestore();
      
      // Initialiser Auth
      this.auth = firebase.auth();

      // Ne pas tester la connexion - ça ralentit inutilement
      // La première vraie requête testera la connexion
      
      this.initialized = true;
      console.log('✅ Firebase initialisé avec succès');
      
      return true;
    } catch (error) {
      console.error('❌ Erreur initialisation Firebase:', error);
      this.initialized = false;
      // Retourner false au lieu de lancer l'erreur pour permettre à authenticate() de gérer
      return false;
    }
  },

  // AUTHENTIFICATION avec Firebase Authentication
  authenticate: async function(usernameOrEmail, password) {
    if (!this.initialized) {
      try {
        const initResult = await this.init();
        if (!initResult) {
          console.error('❌ Firebase n\'a pas pu être initialisé');
          return null;
        }
      } catch (initError) {
        console.error('❌ Erreur lors de l\'initialisation Firebase:', initError);
        throw new Error('Impossible d\'initialiser Firebase. Vérifiez votre connexion et les scripts Firebase.');
      }
    }
    
    try {
      // Utiliser Firebase Authentication (méthode officielle et sécurisée)
      const email = usernameOrEmail.includes('@') ? usernameOrEmail : null;
      
      if (email) {
        // Si c'est un email, utiliser Firebase Auth directement
        const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        
        // Récupérer les données utilisateur depuis Firestore
        const userDoc = await this.db.collection('users').doc(firebaseUser.uid).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          return { 
            id: firebaseUser.uid, 
            email: firebaseUser.email,
            ...userData 
          };
        } else {
          // Si pas de document dans users, créer un document par défaut
          const defaultUser = {
            email: firebaseUser.email,
            nom: firebaseUser.displayName || '',
            role: 'membre',
            dateCreation: firebase.firestore.FieldValue.serverTimestamp()
          };
          await this.db.collection('users').doc(firebaseUser.uid).set(defaultUser);
          return { id: firebaseUser.uid, ...defaultUser };
        }
      } else {
        // Si c'est un username, chercher dans Firestore d'abord pour trouver l'email
        const usersRef = this.db.collection('users');
        const snapshot = await usersRef
          .where('username', '==', usernameOrEmail)
          .limit(1)
          .get();
        
        if (snapshot.empty) {
          return null;
        }
        
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        
        if (!userData.email) {
          return null;
        }
        
        // Utiliser Firebase Auth avec l'email trouvé
        const userCredential = await this.auth.signInWithEmailAndPassword(userData.email, password);
        const firebaseUser = userCredential.user;
        
        return { 
          id: firebaseUser.uid, 
          email: firebaseUser.email,
          ...userData 
        };
      }
    } catch (error) {
      console.error('❌ Erreur authentification:', error);
      if (error.code === 'auth/user-not-found') {
        console.error('⚠️ Utilisateur non trouvé');
      } else if (error.code === 'auth/wrong-password') {
        console.error('⚠️ Mot de passe incorrect');
      } else if (error.code === 'auth/invalid-email') {
        console.error('⚠️ Email invalide');
      } else if (error.message && error.message.includes('permissions')) {
        console.error('⚠️ Erreur de permissions Firestore !');
        console.error('📋 Vérifiez les règles Firestore dans Firebase Console');
      }
      return null;
    }
  },
  
  // Créer un compte avec Firebase Authentication
  createUser: async function(email, password, userData = {}) {
    if (!this.initialized) {
      const initResult = await this.init();
      if (!initResult) {
        console.error('❌ Firebase n\'a pas pu être initialisé');
        return null;
      }
    }
    
    try {
      // Créer l'utilisateur avec Firebase Authentication
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      // Créer le document dans Firestore avec les données supplémentaires
      const userDoc = {
        email: email,
        nom: userData.nom || '',
        prenom: userData.prenom || '',
        username: userData.username || email.split('@')[0],
        role: userData.role || 'membre',
        dateCreation: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await this.db.collection('users').doc(firebaseUser.uid).set(userDoc);
      
      return { 
        id: firebaseUser.uid, 
        email: firebaseUser.email,
        ...userDoc 
      };
    } catch (error) {
      console.error('❌ Erreur création utilisateur:', error);
      if (error.code === 'auth/email-already-in-use') {
        console.error('⚠️ Cet email est déjà utilisé');
      } else if (error.code === 'auth/weak-password') {
        console.error('⚠️ Mot de passe trop faible (minimum 6 caractères)');
      } else if (error.code === 'auth/invalid-email') {
        console.error('⚠️ Email invalide');
      }
      throw error;
    }
  },

  // PROGRAMMES
  getProgrammes: async function(forceRefresh = false) {
    // Vérifier le cache
    if (!forceRefresh) {
      const cached = this._getFromCache('programmes');
      if (cached) return cached;
    }
    
    if (!this.initialized) await this.init();
    if (!this.db) return [];
    
    try {
      const snapshot = await this.db.collection('programmes').get();
      if (snapshot.empty) return [];
      
      const programmes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const sorted = programmes.sort((a, b) => {
        if (a.ordre !== undefined && b.ordre !== undefined) return a.ordre - b.ordre;
        return (a.nom || '').localeCompare(b.nom || '');
      });
      
      // Mettre en cache
      this._setCache('programmes', sorted);
      
      return sorted;
    } catch (error) {
      console.error('❌ Erreur getProgrammes:', error);
      return [];
    }
  },

  saveProgramme: async function(programme) {
    if (!this.initialized) await this.init();
    const { id, ...data } = programme;
    let result;
    if (id) {
      const docRef = this.db.collection('programmes').doc(id.toString());
      await docRef.set(data, { merge: true });
      result = { id: id.toString(), ...data };
    } else {
      const docRef = await this.db.collection('programmes').add(data);
      result = { id: docRef.id, ...data };
    }
    this._clearCache('programmes'); // Vider le cache
    return result;
  },

  deleteProgramme: async function(id) {
    if (!this.initialized) await this.init();
    await this.db.collection('programmes').doc(id.toString()).delete();
    this._clearCache('programmes'); // Vider le cache
  },

  getProgramme: async function(id) {
    if (!this.initialized) await this.init();
    const doc = await this.db.collection('programmes').doc(id.toString()).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  // ACTUALITÉS
  getActualites: async function() {
    if (!this.initialized) await this.init();
    if (!this.db) return [];
    
    try {
      const snapshot = await this.db.collection('actualites').get();
      if (snapshot.empty) return [];
      
      const actualites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Trier manuellement par ordre si le champ existe, sinon par date
      return actualites.sort((a, b) => {
        if (a.ordre !== undefined && b.ordre !== undefined) return a.ordre - b.ordre;
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('❌ Erreur getActualites:', error);
      return [];
    }
  },

  saveActualite: async function(actualite) {
    if (!this.initialized) await this.init();
    const { id, ...data } = actualite;
    if (id) {
      // Utiliser set() avec merge pour créer ou mettre à jour
      await this.db.collection('actualites').doc(id.toString()).set(data, { merge: true });
      return { id: id.toString(), ...data };
    } else {
      // Nouvelle actualité
      const docRef = await this.db.collection('actualites').add(data);
      return { id: docRef.id, ...data };
    }
  },

  deleteActualite: async function(id) {
    if (!this.initialized) await this.init();
    await this.db.collection('actualites').doc(id.toString()).delete();
  },

  getActualite: async function(id) {
    if (!this.initialized) await this.init();
    const doc = await this.db.collection('actualites').doc(id.toString()).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  // STATISTIQUES
  getStatistiques: async function() {
    if (!this.initialized) await this.init();
    if (!this.db) return [];
    
    try {
      const snapshot = await this.db.collection('statistiques').get();
      if (snapshot.empty) return [];
      
      const statistiques = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Trier manuellement par ordre si le champ existe
      return statistiques.sort((a, b) => {
        if (a.ordre !== undefined && b.ordre !== undefined) return a.ordre - b.ordre;
        const labelA = (a.label || '').toLowerCase();
        const labelB = (b.label || '').toLowerCase();
        return labelA.localeCompare(labelB);
      });
    } catch (error) {
      console.error('❌ Erreur getStatistiques:', error);
      return [];
    }
  },

  saveStatistique: async function(statistique) {
    if (!this.initialized) await this.init();
    const { id, ...data } = statistique;
    if (id) {
      // Utiliser set() avec merge pour créer ou mettre à jour
      await this.db.collection('statistiques').doc(id.toString()).set(data, { merge: true });
      return { id: id.toString(), ...data };
    } else {
      // Nouvelle statistique
      const docRef = await this.db.collection('statistiques').add(data);
      return { id: docRef.id, ...data };
    }
  },

  deleteStatistique: async function(id) {
    if (!this.initialized) await this.init();
    await this.db.collection('statistiques').doc(id.toString()).delete();
  },

  // INSCRIPTIONS
  getInscriptions: async function(forceRefresh = false) {
    // Vérifier le cache
    if (!forceRefresh) {
      const cached = this._getFromCache('inscriptions');
      if (cached) return cached;
    }
    
    if (!this.initialized) {
      await this.init();
    }
    
    if (!this.db) {
      console.error('❌ Firestore DB n\'est pas disponible');
      return [];
    }
    
    try {
      const snapshot = await this.db.collection('inscriptions').get();
      
      if (snapshot.empty) {
        return [];
      }
      
      const inscriptions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Trier par date
      const sorted = inscriptions.sort((a, b) => {
        const dateA = a.dateInscription ? (a.dateInscription.toDate ? a.dateInscription.toDate() : new Date(a.dateInscription)) : new Date(0);
        const dateB = b.dateInscription ? (b.dateInscription.toDate ? b.dateInscription.toDate() : new Date(b.dateInscription)) : new Date(0);
        return dateB - dateA;
      });
      
      // Mettre en cache
      this._setCache('inscriptions', sorted);
      
      return sorted;
    } catch (error) {
      console.error('❌ Erreur inscriptions:', error);
      return [];
    }
  },

  saveInscription: async function(inscription) {
    if (!this.initialized) await this.init();
    const { id, ...data } = inscription;
    if (!data.dateInscription) {
      data.dateInscription = firebase.firestore.FieldValue.serverTimestamp();
    }
    if (!data.statutPaiement && data.prix > 0) {
      data.statutPaiement = 'en_attente';
    } else if (!data.statutPaiement) {
      data.statutPaiement = 'valide';
    }
    const docRef = await this.db.collection('inscriptions').add(data);
    this._clearCache('inscriptions');
    return { id: docRef.id, ...data };
  },

  updateInscription: async function(id, updates) {
    if (!this.initialized) await this.init();
    await this.db.collection('inscriptions').doc(id.toString()).update(updates);
    this._clearCache('inscriptions');
    const doc = await this.db.collection('inscriptions').doc(id.toString()).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  deleteInscription: async function(id) {
    if (!this.initialized) await this.init();
    await this.db.collection('inscriptions').doc(id.toString()).delete();
    this._clearCache('inscriptions');
  },

  getInscription: async function(id) {
    if (!this.initialized) await this.init();
    if (!id) return null;
    try {
      const doc = await this.db.collection('inscriptions').doc(id.toString()).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('❌ Erreur getInscription:', error);
      return null;
    }
  },

  deleteAllInscriptions: async function() {
    if (!this.initialized) await this.init();
    const snapshot = await this.db.collection('inscriptions').get();
    const batch = this.db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  },

  // TÉMOIGNAGES
  getTemoignages: async function() {
    if (!this.initialized) await this.init();
    if (!this.db) return [];
    
    try {
      const snapshot = await this.db.collection('temoignages').get();
      if (snapshot.empty) return [];
      
      const temoignages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Trier manuellement par ordre si le champ existe, sinon par nom
      return temoignages.sort((a, b) => {
        if (a.ordre !== undefined && b.ordre !== undefined) return a.ordre - b.ordre;
        const nomA = (a.nom || '').toLowerCase();
        const nomB = (b.nom || '').toLowerCase();
        return nomA.localeCompare(nomB);
      });
    } catch (error) {
      console.error('❌ Erreur getTemoignages:', error);
      return [];
    }
  },

  saveTemoignage: async function(temoignage) {
    if (!this.initialized) await this.init();
    const { id, ...data } = temoignage;
    if (id) {
      // Utiliser set() avec merge pour créer ou mettre à jour
      await this.db.collection('temoignages').doc(id.toString()).set(data, { merge: true });
      return { id: id.toString(), ...data };
    } else {
      // Nouveau témoignage
      const docRef = await this.db.collection('temoignages').add(data);
      return { id: docRef.id, ...data };
    }
  },

  deleteTemoignage: async function(id) {
    if (!this.initialized) await this.init();
    await this.db.collection('temoignages').doc(id.toString()).delete();
  },

  getTemoignage: async function(id) {
    if (!this.initialized) await this.init();
    const doc = await this.db.collection('temoignages').doc(id.toString()).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  // UTILISATEURS (gardé pour l'authentification)
  getUsers: async function() {
    if (!this.initialized) await this.init();
    const snapshot = await this.db.collection('users').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  saveUser: async function(user) {
    if (!this.initialized) await this.init();
    const { id, ...data } = user;
    if (id) {
      // Utiliser set() avec merge pour créer ou mettre à jour
      await this.db.collection('users').doc(id.toString()).set(data, { merge: true });
      return { id: id.toString(), ...data };
    } else {
      // Nouvel utilisateur
      const docRef = await this.db.collection('users').add(data);
      return { id: docRef.id, ...data };
    }
  },

  deleteUser: async function(id) {
    if (!this.initialized) await this.init();
    await this.db.collection('users').doc(id.toString()).delete();
  },

  // CTA
  getCTA: async function() {
    if (!this.initialized) await this.init();
    const doc = await this.db.collection('config').doc('cta').get();
    return doc.exists ? doc.data() : {};
  },

  saveCTA: async function(cta) {
    if (!this.initialized) await this.init();
    await this.db.collection('config').doc('cta').set(cta);
    return cta;
  },

  // POPUP
  getPopup: async function() {
    if (!this.initialized) await this.init();
    const doc = await this.db.collection('config').doc('popup').get();
    return doc.exists ? doc.data() : {};
  },

  savePopup: async function(popup) {
    if (!this.initialized) await this.init();
    await this.db.collection('config').doc('popup').set(popup);
    return popup;
  },

  // CONTACT
  getContact: async function() {
    if (!this.initialized) await this.init();
    const doc = await this.db.collection('config').doc('contact').get();
    return doc.exists ? doc.data() : {};
  },

  saveContact: async function(contact) {
    if (!this.initialized) await this.init();
    await this.db.collection('config').doc('contact').set(contact);
    return contact;
  },

  // PARTENAIRES
  getPartenaires: async function() {
    if (!this.initialized) await this.init();
    if (!this.db) return [];
    try {
      const snapshot = await this.db.collection('partenaires').get();
      if (snapshot.empty) return [];
      const partenaires = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return partenaires.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    } catch (error) {
      console.error('Erreur getPartenaires:', error);
      return [];
    }
  },

  savePartenaire: async function(partenaire) {
    if (!this.initialized) await this.init();
    const { id, ...data } = partenaire;
    if (id) {
      await this.db.collection('partenaires').doc(id.toString()).set(data, { merge: true });
      return { id: id.toString(), ...data };
    } else {
      const docRef = await this.db.collection('partenaires').add(data);
      return { id: docRef.id, ...data };
    }
  },

  deletePartenaire: async function(id) {
    if (!this.initialized) await this.init();
    await this.db.collection('partenaires').doc(id.toString()).delete();
  }
};

// Auto-initialisation au chargement
if (typeof firebase !== 'undefined' && window.firebaseConfig) {
  setTimeout(() => {
    window.CSGRFirebase.init();
  }, 500);
}

