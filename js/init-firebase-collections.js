// Script pour initialiser les collections Firebase
// À exécuter une seule fois dans la console du navigateur après avoir chargé Firebase

async function initFirebaseCollections() {
  if (typeof firebase === 'undefined' || !window.CSGRFirebase) {
    console.error('Firebase n\'est pas chargé');
    return;
  }

  try {
    await window.CSGRFirebase.init();
    const db = window.CSGRFirebase.db;

    console.log('🔄 Initialisation des collections Firebase...');

    // Collection: users (espace membre)
    // Note: Les utilisateurs seront créés via Firebase Authentication
    // Cette collection stocke les données supplémentaires (nom, role, etc.)
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.limit(1).get();
    if (usersSnapshot.empty) {
      console.log('✅ Collection "users" créée (vide)');
      console.log('💡 Les utilisateurs seront créés via Firebase Authentication');
      console.log('   Utilisez le bouton "Créer un compte" sur la page de connexion');
    } else {
      console.log('ℹ️ Collection "users" existe déjà');
    }

    // Collection: programmes
    const programmesRef = db.collection('programmes');
    const programmesSnapshot = await programmesRef.limit(1).get();
    if (programmesSnapshot.empty) {
      console.log('✅ Collection "programmes" créée (vide)');
    } else {
      console.log('ℹ️ Collection "programmes" existe déjà');
    }

    // Collection: actualites
    const actualitesRef = db.collection('actualites');
    const actualitesSnapshot = await actualitesRef.limit(1).get();
    if (actualitesSnapshot.empty) {
      console.log('✅ Collection "actualites" créée (vide)');
    } else {
      console.log('ℹ️ Collection "actualites" existe déjà');
    }

    // Collection: statistiques
    const statistiquesRef = db.collection('statistiques');
    const statistiquesSnapshot = await statistiquesRef.limit(1).get();
    if (statistiquesSnapshot.empty) {
      await statistiquesRef.add({
        label: 'Participants formés',
        valeur: '500+',
        icone: 'mdi-account-group',
        couleur: '#007bff',
        ordre: 1
      });
      await statistiquesRef.add({
        label: 'Formations disponibles',
        valeur: '25+',
        icone: 'mdi-book-open-variant',
        couleur: '#28a745',
        ordre: 2
      });
      await statistiquesRef.add({
        label: 'Taux de satisfaction',
        valeur: '98%',
        icone: 'mdi-star',
        couleur: '#ffc107',
        ordre: 3
      });
      console.log('✅ Collection "statistiques" initialisée avec données par défaut');
    } else {
      console.log('ℹ️ Collection "statistiques" existe déjà');
    }

    // Collection: inscriptions
    const inscriptionsRef = db.collection('inscriptions');
    const inscriptionsSnapshot = await inscriptionsRef.limit(1).get();
    if (inscriptionsSnapshot.empty) {
      console.log('✅ Collection "inscriptions" créée (vide)');
    } else {
      console.log('ℹ️ Collection "inscriptions" existe déjà');
    }

    // Collection: config
    const configRef = db.collection('config');
    
    // Document: cta
    const ctaDoc = await configRef.doc('cta').get();
    if (!ctaDoc.exists) {
      await configRef.doc('cta').set({
        titre: 'Prêt à commencer votre formation ?',
        description: 'Inscrivez-vous dès maintenant',
        texteBouton: 'Voir les programmes',
        lienBouton: '#programmes-section',
        actif: true
      });
      console.log('✅ Document "config/cta" créé');
    } else {
      console.log('ℹ️ Document "config/cta" existe déjà');
    }

    // Document: popup
    const popupDoc = await configRef.doc('popup').get();
    if (!popupDoc.exists) {
      await configRef.doc('popup').set({
        programmeId: null,
        delai: 3000,
        cooldown: 7,
        actif: false
      });
      console.log('✅ Document "config/popup" créé');
    } else {
      console.log('ℹ️ Document "config/popup" existe déjà');
    }

    // Document: contact
    const contactDoc = await configRef.doc('contact').get();
    if (!contactDoc.exists) {
      await configRef.doc('contact').set({
        email: 'contact@csgr-ia.com',
        phone: '+241 01 23 45 67 89',
        address: 'Libreville, Gabon'
      });
      console.log('✅ Document "config/contact" créé');
    } else {
      console.log('ℹ️ Document "config/contact" existe déjà');
    }

    console.log('✅ Toutes les collections sont initialisées !');
    console.log('📝 Pour créer un compte membre, utilisez le bouton "Créer un compte" sur la page de connexion.');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  }
}

// Exécuter automatiquement si on est sur la page membre
if (window.location.pathname.includes('membre.html')) {
  // Fonction pour tenter l'initialisation automatique
  async function autoInitCollections() {
    let attempts = 0;
    const maxAttempts = 30; // Augmenter à 30 tentatives (15 secondes)
    
    const tryInit = async () => {
      attempts++;
      
      // Vérifier si Firebase est disponible et initialisé
      if (typeof firebase !== 'undefined' && window.CSGRFirebase) {
        // Si pas encore initialisé, essayer de l'initialiser
        if (!window.CSGRFirebase.initialized) {
          try {
            await window.CSGRFirebase.init();
          } catch (e) {
            // Ignorer les erreurs d'initialisation pour l'instant
          }
        }
        
        // Si maintenant initialisé, créer les collections
        if (window.CSGRFirebase.initialized && window.CSGRFirebase.db) {
          console.log('🔄 Initialisation automatique des collections Firebase...');
          try {
            await initFirebaseCollections();
            console.log('✅ Collections initialisées avec succès !');
            return; // Succès, on arrête
          } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            if (error.message && error.message.includes('permissions')) {
              console.error('⚠️ Erreur de permissions Firestore !');
              console.error('📋 Vérifiez les règles Firestore dans la console Firebase');
              console.error('   Les règles doivent permettre read/write pour toutes les collections');
            }
            console.log('💡 Vous pouvez réessayer manuellement avec: initFirebaseCollections()');
            return; // Erreur, on arrête
          }
        }
      }
      
      // Si pas encore prêt, réessayer
      if (attempts < maxAttempts) {
        setTimeout(tryInit, 500);
      } else {
        console.log('⚠️ Firebase n\'est pas encore initialisé après ' + maxAttempts + ' tentatives');
        console.log('💡 Exécutez manuellement: initFirebaseCollections()');
        console.log('💡 Ou vérifiez :');
        console.log('   1. Votre connexion internet');
        console.log('   2. Les règles Firestore (doivent permettre read/write)');
        console.log('   3. Que Firestore est bien activé dans Firebase Console');
        window.initFirebaseCollections = initFirebaseCollections;
      }
    };
    
    // Démarrer après un délai plus long pour laisser Firebase se charger
    setTimeout(tryInit, 2000);
  }
  
  // Démarrer l'initialisation automatique
  autoInitCollections();
  
  // Exposer aussi la fonction manuellement au cas où
  window.initFirebaseCollections = initFirebaseCollections;
}

