// Système de gestion des données CSGR-IA
// Utilise UNIQUEMENT Firebase - localStorage supprimé

const CSGRData = {
  // Forcer l'utilisation de Firebase uniquement
  useFirebase: function() {
    // Toujours retourner true - Firebase est obligatoire
    return true;
  },
  
  // Initialiser Firebase si nécessaire
  ensureFirebase: async function() {
    if (!window.CSGRFirebase) {
      const error = 'Firebase n\'est pas chargé. Vérifiez que les scripts Firebase sont inclus dans le HTML.';
      console.error('❌', error);
      throw new Error(error);
    }
    if (!window.CSGRFirebase.initialized) {
      try {
        const result = await window.CSGRFirebase.init();
        if (!result) {
          const error = 'Impossible d\'initialiser Firebase. Vérifiez votre connexion internet et les règles Firestore.';
          console.error('❌', error);
          throw new Error(error);
        }
      } catch (initError) {
        console.error('❌ Erreur lors de l\'initialisation Firebase:', initError);
        throw new Error('Impossible d\'initialiser Firebase: ' + (initError.message || 'Erreur inconnue'));
      }
    }
    return true;
  },

  // Programmes
  getProgrammes: async function() {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getProgrammes();
  },
  
  saveProgramme: async function(programme) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.saveProgramme(programme);
  },
  
  deleteProgramme: async function(id) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.deleteProgramme(id);
  },
  
  getProgramme: async function(id) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getProgramme(id);
  },

  // Actualités
  getActualites: async function() {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getActualites();
  },
  
  saveActualite: async function(actualite) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.saveActualite(actualite);
  },
  
  deleteActualite: async function(id) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.deleteActualite(id);
  },
  
  getActualite: async function(id) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getActualite(id);
  },

  // Statistiques
  getStatistiques: async function() {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getStatistiques();
  },
  
  saveStatistique: async function(statistique) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.saveStatistique(statistique);
  },
  
  deleteStatistique: async function(id) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.deleteStatistique(id);
  },

  // Inscriptions
  getInscriptions: async function() {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getInscriptions();
  },
  
  getInscription: async function(id) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getInscription(id);
  },
  
  saveInscription: async function(inscription) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.saveInscription(inscription);
  },
  
  updateInscription: async function(id, updates) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.updateInscription(id, updates);
  },
  
  deleteInscription: async function(id) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.deleteInscription(id);
  },
  
  deleteAllInscriptions: async function() {
    await this.ensureFirebase();
    return await window.CSGRFirebase.deleteAllInscriptions();
  },

  // CTA
  getCTA: async function() {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getCTA();
  },
  
  saveCTA: async function(cta) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.saveCTA(cta);
  },

  // Popup
  getPopup: async function() {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getPopup();
  },
  
  savePopup: async function(popup) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.savePopup(popup);
  },

  // Témoignages
  getTemoignages: async function() {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getTemoignages();
  },
  
  saveTemoignage: async function(temoignage) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.saveTemoignage(temoignage);
  },
  
  deleteTemoignage: async function(id) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.deleteTemoignage(id);
  },
  
  getTemoignage: async function(id) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getTemoignage(id);
  },

  // Utilisateurs (gardé pour l'authentification)
  getUsers: async function() {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getUsers();
  },
  
  saveUser: async function(user) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.saveUser(user);
  },
  
  deleteUser: async function(id) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.deleteUser(id);
  },
  
  authenticate: async function(usernameOrEmail, password) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.authenticate(usernameOrEmail, password);
  },

  // Contact
  getContact: async function() {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getContact();
  },
  
  saveContact: async function(contact) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.saveContact(contact);
  },

  // Partenaires
  getPartenaires: async function() {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getPartenaires();
  },
  
  savePartenaire: async function(partenaire) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.savePartenaire(partenaire);
  },
  
  deletePartenaire: async function(id) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.deletePartenaire(id);
  },

  // Sponsors
  getSponsors: async function() {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getSponsors();
  },
  
  saveSponsor: async function(sponsor) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.saveSponsor(sponsor);
  },
  
  deleteSponsor: async function(id) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.deleteSponsor(id);
  },

  // Sponsors
  getSponsors: async function() {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getSponsors();
  },
  
  saveSponsor: async function(sponsor) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.saveSponsor(sponsor);
  },
  
  deleteSponsor: async function(id) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.deleteSponsor(id);
  },

  // Sponsors
  getSponsors: async function() {
    await this.ensureFirebase();
    return await window.CSGRFirebase.getSponsors();
  },
  
  saveSponsor: async function(sponsor) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.saveSponsor(sponsor);
  },
  
  deleteSponsor: async function(id) {
    await this.ensureFirebase();
    return await window.CSGRFirebase.deleteSponsor(id);
  }
};

// Plus d'initialisation localStorage - Firebase uniquement
console.log('✅ CSGRData configuré pour utiliser Firebase uniquement');
