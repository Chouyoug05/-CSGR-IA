// Script pour l'espace membre CSGR-IA

let currentUser = null;

$(document).ready(async function() {
  // Vérifier si on est sur la page dashboard
  const isDashboardPage = window.location.pathname.includes('dashboard.html');
  
  if (isDashboardPage) {
    // Vérifier si connecté
    const savedUser = sessionStorage.getItem('member_user');
    if (!savedUser) {
      // Pas connecté, rediriger vers login
      window.location.href = 'membre.html';
      return;
    }
    
    try {
      currentUser = JSON.parse(savedUser);
      // Charger les données du dashboard
      await initDashboard();
    } catch(e) {
      sessionStorage.removeItem('member_user');
      window.location.href = 'membre.html';
      return;
    }
  }
  
  // Gestion de la déconnexion
  $('#logout-btn, #logout-btn-header').on('click', function() {
    sessionStorage.removeItem('member_user');
    window.location.href = 'membre.html';
  });
  
  // Gestion de la connexion/inscription
  $('#login-form').on('submit', async function(e) {
    e.preventDefault();
    const usernameOrEmail = $('#login-username').val().trim();
    const password = $('#login-password').val().trim();
    
    if (!usernameOrEmail || !password) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    // Firebase sera initialisé automatiquement par ensureFirebase()
    
    // Afficher un indicateur de chargement
    const submitBtn = $('#login-form button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn.prop('disabled', true).html('<i class="mdi mdi-loading mdi-spin mr-2"></i>' + (isRegisterMode ? 'Création...' : 'Connexion...'));
    
    console.log(isRegisterMode ? 'Création de compte avec:' : 'Tentative de connexion avec:', usernameOrEmail);
    
    // S'assurer que Firebase est initialisé
    if (window.CSGRFirebase && !window.CSGRFirebase.initialized) {
      await window.CSGRFirebase.init();
    }
    
    if (isRegisterMode) {
      // MODE INSCRIPTION
      if (!usernameOrEmail.includes('@')) {
        submitBtn.prop('disabled', false).html(originalText);
        alert('⚠️ Pour créer un compte, vous devez utiliser une adresse email valide');
        return;
      }
      
      if (password.length < 6) {
        submitBtn.prop('disabled', false).html(originalText);
        alert('⚠️ Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      
      try {
        const user = await window.CSGRFirebase.createUser(usernameOrEmail, password, {
          nom: usernameOrEmail.split('@')[0],
          role: 'membre'
        });
        
        submitBtn.prop('disabled', false).html(originalText);
        
        if (user) {
          alert('✅ Compte créé avec succès !\n\nVous pouvez maintenant vous connecter.');
          isRegisterMode = false;
          $('#show-register-link').click(); // Revenir au mode connexion
          $('#login-username').val(usernameOrEmail);
        }
      } catch (error) {
        submitBtn.prop('disabled', false).html(originalText);
        let errorMsg = 'Erreur lors de la création du compte.\n\n';
        if (error.code === 'auth/email-already-in-use') {
          errorMsg += 'Cet email est déjà utilisé. Connectez-vous avec vos identifiants.';
        } else if (error.code === 'auth/weak-password') {
          errorMsg += 'Le mot de passe doit contenir au moins 6 caractères.';
        } else if (error.code === 'auth/invalid-email') {
          errorMsg += 'Email invalide.';
        } else {
          errorMsg += error.message || 'Erreur inconnue';
        }
        alert(errorMsg);
      }
    } else {
      // MODE CONNEXION
      try {
        const user = await CSGRData.authenticate(usernameOrEmail, password);
        
        submitBtn.prop('disabled', false).html(originalText);
        
        console.log('Résultat de l\'authentification:', user);
        
        if (user) {
          currentUser = user;
          
          sessionStorage.setItem('member_user', JSON.stringify(user));
          
          // Afficher le dashboard
          await showDashboard();
        } else {
          alert('❌ Identifiants incorrects.\n\nVeuillez réessayer.\n\n💡 Si vous n\'avez pas de compte, cliquez sur "Créer un compte"');
          $('#login-password').val('').focus();
        }
      } catch (error) {
        submitBtn.prop('disabled', false).html(originalText);
        console.error('Erreur lors de l\'authentification:', error);
        let errorMsg = 'Erreur lors de la connexion.\n\n';
        if (error.code === 'auth/user-not-found') {
          errorMsg += 'Utilisateur non trouvé. Créez un compte d\'abord.';
        } else if (error.code === 'auth/wrong-password') {
          errorMsg += 'Mot de passe incorrect.';
        } else if (error.code === 'auth/invalid-email') {
          errorMsg += 'Email invalide.';
        } else if (error.message && error.message.includes('Firebase')) {
          errorMsg += error.message;
        } else {
          errorMsg += error.message || 'Erreur inconnue. Vérifiez la console pour plus de détails.';
        }
        alert(errorMsg);
      }
    }
  });

  // Déconnexion
  $('#logout-btn, #logout-btn-header').on('click', function() {
    sessionStorage.removeItem('admin_user');
    currentUser = null;
    $('#admin-dashboard').hide();
    $('#admin-dashboard').removeClass('active');
    $('body').removeClass('dashboard-active');
    $('html').removeClass('dashboard-active');
    $('#login-screen').show();
    $('.admin-header').show(); // Réafficher la navbar de connexion
  });

  // Toggle sidebar sur mobile
  $('#sidebar-toggle').on('click', function() {
    $('.sidebar').toggleClass('show');
    $('#sidebar-overlay').toggleClass('show');
    // Empêcher le scroll du body quand le sidebar est ouvert
    if ($('.sidebar').hasClass('show')) {
      $('body').css('overflow', 'hidden');
    } else {
      $('body').css('overflow', '');
    }
  });

  // Fermer le sidebar avec l'overlay
  $('#sidebar-overlay').on('click', function() {
    $('.sidebar').removeClass('show');
    $('#sidebar-overlay').removeClass('show');
    $('body').css('overflow', '');
  });

  // Fermer le sidebar quand on clique sur un lien (mobile)
  $('.sidebar-nav a').on('click', function() {
    if (window.innerWidth <= 768) {
      $('.sidebar').removeClass('show');
      $('#sidebar-overlay').removeClass('show');
      $('body').css('overflow', '');
    }
  });
  
  // Gérer le redimensionnement de la fenêtre
  $(window).on('resize', function() {
    if (window.innerWidth > 768) {
      $('.sidebar').removeClass('show');
      $('#sidebar-overlay').removeClass('show');
      $('body').css('overflow', '');
    }
  });

  // Navigation entre sections (desktop et mobile)
  $('.sidebar-nav a[data-section]').on('click', async function(e) {
    e.preventDefault();
    const section = $(this).data('section');
    if (section) {
      await showSection(section);
      // Mettre à jour les liens actifs
      $('.sidebar-nav a').removeClass('active');
      $(this).addClass('active');
      $('.sidebar-nav a[data-section="' + section + '"]').addClass('active');
    }
  });

  // Charger la première section par défaut
  if (currentUser) {
    await showSection('inscriptions');
  }
});

// Cache pour éviter de recharger les données déjà chargées
const dataCache = {
  inscriptions: false,
  programmes: false,
  actualites: false,
  statistiques: false,
  cta: false,
  popup: false,
  temoignages: false,
  contact: false
};

// Fonction d'initialisation du dashboard (ultra-optimisée)
async function initDashboard() {
  console.log('🚀 Initialisation du dashboard...');
  const startTime = Date.now();
  
  // Afficher immédiatement la section inscriptions (même vide)
  $('#section-inscriptions').addClass('active').css({
    'display': 'block',
    'visibility': 'visible',
    'opacity': '1'
  });
  
  // Afficher un mini loader dans la section
  $('#inscriptions-list').html('<div class="text-center p-4"><i class="mdi mdi-loading mdi-spin" style="font-size: 32px; color: #0061f2;"></i><p class="mt-2 text-muted">Chargement des données...</p></div>');
  
  // Initialiser Firebase en parallèle avec l'affichage
  const firebasePromise = (async () => {
    if (window.CSGRFirebase && !window.CSGRFirebase.initialized) {
      await window.CSGRFirebase.init();
      console.log('✅ Firebase initialisé');
    }
  })();
  
  // Attendre Firebase puis charger les inscriptions
  await firebasePromise;
  
  // Charger les inscriptions
  await loadInscriptions();
  dataCache.inscriptions = true;
  
  console.log(`✅ Dashboard prêt en ${Date.now() - startTime}ms`);
}

function showLoadingIndicator() {
  if (!$('#dashboard-loading').length) {
    $('body').append(`
      <div id="dashboard-loading" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999;">
        <div style="text-align: center;">
          <div style="width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #0061f2; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
          <p style="color: #333; font-size: 16px;">Chargement...</p>
        </div>
      </div>
      <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `);
  }
}

function hideLoadingIndicator() {
  $('#dashboard-loading').fadeOut(300, function() { $(this).remove(); });
}

// Fonction pour forcer le rechargement d'une section
async function refreshSection(sectionName) {
  dataCache[sectionName] = false;
  await showSection(sectionName);
}

// Fonction pour rafraîchir toutes les données
async function refreshAllData() {
  // Réinitialiser le cache
  Object.keys(dataCache).forEach(key => dataCache[key] = false);
  
  showLoadingIndicator();
  
  // Recharger la section actuelle
  const activeSection = $('.section-content.active').attr('id');
  if (activeSection) {
    const sectionName = activeSection.replace('section-', '');
    await showSection(sectionName);
  }
  
  hideLoadingIndicator();
}

// Exposer les fonctions
window.refreshSection = refreshSection;
window.refreshAllData = refreshAllData;

// Ancienne fonction pour compatibilité
async function showDashboard() {
  await initDashboard();
}

async function showSection(sectionName) {
  // Cacher toutes les sections d'abord
  $('.section-content').removeClass('active').css({
    'display': 'none',
    'visibility': 'hidden',
    'opacity': '0'
  });
  
  // Retirer l'état actif de tous les liens
  $('.sidebar-nav a').removeClass('active');
  
  // Afficher uniquement la section demandée
  const targetSection = $(`#section-${sectionName}`);
  if (targetSection.length) {
    targetSection.addClass('active').css({
      'display': 'block',
      'visibility': 'visible',
      'opacity': '1'
    });
  } else {
    console.error(`❌ Section #section-${sectionName} non trouvée dans le DOM`);
  }
  
  // Activer le lien correspondant
  $(`.sidebar-nav a[data-section="${sectionName}"]`).addClass('active');
  
  // Déclencher l'événement pour la navbar mobile
  $(document).trigger('sectionChanged', [sectionName]);
  
  // Charger les données UNIQUEMENT si pas déjà en cache
  if (!dataCache[sectionName]) {
    // Afficher un mini indicateur de chargement dans la section
    targetSection.prepend('<div id="section-loader" class="text-center p-3"><i class="mdi mdi-loading mdi-spin" style="font-size: 24px;"></i> Chargement...</div>');
    
    try {
      switch(sectionName) {
        case 'inscriptions':
          await loadInscriptions();
          break;
        case 'programmes':
          await loadProgrammes();
          break;
        case 'actualites':
          await loadActualites();
          break;
        case 'statistiques':
          await loadStatistiques();
          break;
        case 'cta':
          await loadCTA();
          break;
        case 'popup':
          await loadPopup();
          break;
        case 'temoignages':
          await loadTemoignages();
          break;
        case 'contact':
          await loadContact();
          break;
        case 'partenaires':
          await loadPartenaires();
          break;
        case 'sponsors':
          await loadSponsors();
          break;
      }
      dataCache[sectionName] = true;
    } catch (error) {
      console.error(`Erreur chargement ${sectionName}:`, error);
    }
    
    $('#section-loader').remove();
  }
}

async function loadAllSections() {
  // Charger toutes les sections en parallèle avec gestion d'erreur pour chacune
  const loadPromises = [
    loadInscriptions().catch(err => console.error('Erreur chargement inscriptions:', err)),
    loadProgrammes().catch(err => console.error('Erreur chargement programmes:', err)),
    loadActualites().catch(err => console.error('Erreur chargement actualites:', err)),
    loadStatistiques().catch(err => console.error('Erreur chargement statistiques:', err)),
    Promise.resolve(loadCTA()).catch(err => console.error('Erreur chargement CTA:', err)),
    Promise.resolve(loadPopup()).catch(err => console.error('Erreur chargement popup:', err)),
    loadTemoignages().catch(err => console.error('Erreur chargement temoignages:', err)),
    Promise.resolve(loadContact()).catch(err => console.error('Erreur chargement contact:', err)),
    loadPartenaires().catch(err => console.error('Erreur chargement partenaires:', err)),
    loadSponsors().catch(err => console.error('Erreur chargement sponsors:', err))
  ];
  
  await Promise.allSettled(loadPromises);
  console.log('✅ Toutes les sections chargées (avec gestion d\'erreurs)');
}

// Fonction de test pour vérifier les données Firebase directement
window.testFirebaseData = async function() {
  console.log('🔍 TEST: Vérification des données Firebase...');
  
  if (!window.CSGRFirebase) {
    console.error('❌ CSGRFirebase n\'est pas disponible');
    return;
  }
  
  if (!window.CSGRFirebase.initialized) {
    console.log('🔄 Initialisation de Firebase...');
    await window.CSGRFirebase.init();
  }
  
  try {
    // Tester directement la collection programmes
    console.log('🔍 Test direct de la collection "programmes"...');
    const snapshot = await window.CSGRFirebase.db.collection('programmes').get();
    console.log(`📊 Nombre de documents dans "programmes": ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.warn('⚠️ La collection "programmes" est VIDE dans Firebase !');
      console.log('💡 Vérifiez que vous avez bien créé des programmes dans Firebase Console');
    } else {
      snapshot.forEach(doc => {
        console.log(`📄 Document ID: ${doc.id}`, doc.data());
      });
    }
    
    // Tester avec CSGRData
    console.log('🔍 Test via CSGRData.getProgrammes()...');
    const programmes = await CSGRData.getProgrammes();
    console.log(`📊 Programmes via CSGRData: ${programmes ? programmes.length : 0}`, programmes);
    
    // Vérifier le conteneur
    const container = $('#programmes-list');
    console.log(`📊 Conteneur #programmes-list trouvé: ${container.length > 0}`);
    if (container.length > 0) {
      console.log(`📊 Contenu actuel du conteneur:`, container.html().substring(0, 200));
    }
    
    alert(`Test terminé !\n\nVérifiez la console (F12) pour les détails.\n\nProgrammes trouvés: ${snapshot.size}\nConteneur trouvé: ${container.length > 0}`);
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    alert('Erreur lors du test. Vérifiez la console (F12) pour plus de détails.');
  }
};

// GESTION DES INSCRIPTIONS
// Fonction pour mettre à jour les statistiques des inscriptions
function updateInscriptionStats(inscriptions) {
  if (!Array.isArray(inscriptions)) {
    inscriptions = [];
  }
  
  const total = inscriptions.length;
  const validees = inscriptions.filter(i => i.statutPaiement === 'valide').length;
  const enAttente = inscriptions.filter(i => i.statutPaiement === 'en_attente').length;
  const echouees = inscriptions.filter(i => i.statutPaiement === 'echoue').length;
  
  $('#stats-total-inscriptions').text(total);
  $('#stats-validees').text(validees);
  $('#stats-en-attente').text(enAttente);
  $('#stats-echouees').text(echouees);
}

async function loadInscriptions() {
  try {
    // Charger inscriptions et programmes EN PARALLÈLE (plus rapide)
    const [inscriptions, programmes] = await Promise.all([
      CSGRData.getInscriptions(),
      CSGRData.getProgrammes()
    ]);
    
    // Remplir le filtre de programmes
    const filterProgramme = $('#filter-programme');
    filterProgramme.empty().append('<option value="">Tous les programmes</option>');
    if (Array.isArray(programmes)) {
      programmes.forEach(p => {
        filterProgramme.append(`<option value="${p.id}">${p.nom}</option>`);
      });
    }

    // Appliquer les filtres (une seule fois)
    $('#filter-programme, #filter-statut, #filter-date').off('change').on('change', function() {
      filterInscriptions();
    });

    await filterInscriptions();
  } catch (error) {
    console.error('Erreur lors du chargement des inscriptions:', error);
    $('#inscriptions-list').html('<div class="alert alert-warning">Erreur lors du chargement des inscriptions. Veuillez réessayer.</div>');
  }
}

async function filterInscriptions() {
  try {
    let inscriptions = await CSGRData.getInscriptions();
    if (!Array.isArray(inscriptions)) {
      inscriptions = [];
    }
    
    const filterProgramme = $('#filter-programme').val();
    const filterStatut = $('#filter-statut').val();
    const filterDate = $('#filter-date').val();

    if (filterProgramme) {
      inscriptions = inscriptions.filter(i => i.programmeId === parseInt(filterProgramme) || i.programmeId === filterProgramme);
    }
    if (filterStatut) {
      inscriptions = inscriptions.filter(i => i.statutPaiement === filterStatut);
    }
    if (filterDate) {
      inscriptions = inscriptions.filter(i => {
        const inscriptionDate = new Date(i.dateInscription).toISOString().split('T')[0];
        return inscriptionDate === filterDate;
      });
    }

    await displayInscriptions(inscriptions);
  } catch (error) {
    console.error('Erreur lors du filtrage des inscriptions:', error);
    $('#inscriptions-list').html('<div class="alert alert-warning">Erreur lors du filtrage. Veuillez réessayer.</div>');
  }
}

async function displayInscriptions(inscriptions) {
  const container = $('#inscriptions-list');
  if (!container.length) {
    console.error('❌ Conteneur #inscriptions-list non trouvé dans le DOM');
    return;
  }
  
  console.log('📋 Affichage de', inscriptions.length, 'inscription(s)');
  
  // Mettre à jour les statistiques
  updateInscriptionStats(inscriptions);
  
  container.empty();
  container.css({
    'display': 'block',
    'visibility': 'visible',
    'opacity': '1'
  });

  if (!Array.isArray(inscriptions) || inscriptions.length === 0) {
    container.html('<p class="text-muted">Aucune inscription trouvée.</p>');
    return;
  }

  // Récupérer tous les programmes en une fois
  const programmes = await CSGRData.getProgrammes();
  const programmesMap = {};
  programmes.forEach(p => {
    programmesMap[p.id] = p;
  });

  const html = `
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Programme</th>
            <th>Participant</th>
            <th>Email</th>
            <th>Téléphone</th>
            <th>Montant</th>
            <th>Mode paiement</th>
            <th>Statut</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        ${inscriptions.map(ins => {
          const programme = programmesMap[ins.programmeId] || programmesMap[parseInt(ins.programmeId)];
          const statutBadge = {
            'en_attente': '<span class="badge badge-warning">En attente</span>',
            'valide': '<span class="badge badge-success">Validé</span>',
            'echoue': '<span class="badge badge-danger">Échoué</span>',
            'rembourse': '<span class="badge badge-secondary">Remboursé</span>'
          };
          const modePaiementText = {
            'carte': 'Carte bancaire',
            'orange': 'Orange Money',
            'airtel': 'Airtel Money',
            'moov': 'Moov Money',
            'especes': 'Espèces',
            'virement': 'Virement',
            'admin': 'Validation admin'
          };
          const prix = ins.prix || 0;
          return `
            <tr>
              <td>${ins.id}</td>
              <td>${programme ? programme.nom : ins.programmeNom || 'N/A'}</td>
              <td>${ins.prenom} ${ins.nom}</td>
              <td>${ins.email}</td>
              <td>${ins.telephone}</td>
              <td><strong>${prix === 0 ? 'Gratuit' : prix.toLocaleString('fr-FR') + ' XAF'}</strong></td>
              <td><small>${modePaiementText[ins.modePaiement] || 'N/A'}</small></td>
              <td>${statutBadge[ins.statutPaiement] || ins.statutPaiement}</td>
              <td>${formatDate(ins.dateInscription)}</td>
              <td style="white-space: nowrap;">
                <button class="btn btn-sm btn-info" data-action="view" data-id="${ins.id}" title="Voir les détails">
                  <i class="mdi mdi-eye"></i>
                </button>
                <button class="btn btn-sm btn-success" data-action="edit" data-id="${ins.id}" title="Valider le paiement">
                  <i class="mdi mdi-check-circle"></i>
                </button>
                ${ins.statutPaiement === 'valide' ? `
                <button class="btn btn-sm btn-primary" data-action="receipt" data-id="${ins.id}" title="Voir/Envoyer le reçu">
                  <i class="mdi mdi-receipt"></i>
                </button>
                ` : ''}
                <button class="btn btn-sm btn-danger" data-action="delete" data-id="${ins.id}" title="Supprimer">
                  <i class="mdi mdi-delete"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('')}
        </tbody>
      </table>
    </div>
  `;
  container.html(html);
  
  // Gérer les clics sur les boutons d'action
  container.find('[data-action="view"]').on('click', function() {
    const id = $(this).data('id');
    viewInscription(id);
  });
  
  container.find('[data-action="edit"]').on('click', function() {
    const id = $(this).data('id');
    editInscription(id);
  });
  
  container.find('[data-action="delete"]').on('click', function() {
    const id = $(this).data('id');
    deleteInscription(id);
  });
  
  container.find('[data-action="receipt"]').on('click', async function() {
    const id = $(this).data('id');
    const inscriptions = await CSGRData.getInscriptions();
    const inscription = inscriptions.find(i => i.id === id || i.id === String(id));
    if (inscription) {
      showReceiptModal(inscription);
    }
  });
}

async function viewInscription(id) {
  const inscriptions = await CSGRData.getInscriptions();
  const inscription = inscriptions.find(i => i.id === id || i.id === parseInt(id));
  if (inscription) {
    const modePaiementText = {
      'carte': 'Carte bancaire',
      'orange': 'Orange Money',
      'airtel': 'Airtel Money',
      'moov': 'Moov Money',
      'especes': 'Espèces',
      'virement': 'Virement bancaire',
      'admin': 'Validation admin'
    };
    
    let details = `
      <div class="card">
        <div class="card-header">
          <h5>Détails de l'inscription #${inscription.id}</h5>
        </div>
        <div class="card-body">
          <h6 class="mb-3">Informations personnelles</h6>
          <p><strong>Participant:</strong> ${inscription.prenom} ${inscription.nom}</p>
          <p><strong>Email:</strong> ${inscription.email}</p>
          <p><strong>Téléphone:</strong> ${inscription.telephone}</p>
          ${inscription.adresse ? `<p><strong>Adresse:</strong> ${inscription.adresse}</p>` : ''}
          <hr>
          <h6 class="mb-3">Informations du programme</h6>
          <p><strong>Programme:</strong> ${inscription.programmeNom || 'N/A'}</p>
          <p><strong>Montant:</strong> ${inscription.prix === 0 || inscription.prix === '0' ? 'Gratuit' : (inscription.prix || 0).toLocaleString('fr-FR') + ' XAF'}</p>
          <hr>
          <h6 class="mb-3">Informations de paiement</h6>
          <p><strong>Mode de paiement:</strong> ${modePaiementText[inscription.modePaiement] || inscription.modePaiement || 'N/A'}</p>
          ${inscription.numeroMobile ? `<p><strong>Numéro de téléphone:</strong> ${inscription.numeroMobile}</p>` : ''}
          ${inscription.codeTransaction ? `<p><strong>Code de transaction:</strong> ${inscription.codeTransaction}</p>` : ''}
          <p><strong>Statut:</strong> <span class="badge badge-${inscription.statutPaiement === 'valide' ? 'success' : inscription.statutPaiement === 'en_attente' ? 'warning' : 'danger'}">${inscription.statutPaiement || 'En attente'}</span></p>
          ${inscription.preuvePaiementImage ? `
            <div class="mt-3">
              <strong>Preuve de paiement:</strong>
              <div class="mt-2">
                <img src="${inscription.preuvePaiementImage}" alt="Preuve de paiement" class="img-fluid" style="max-width: 300px; border-radius: 8px; border: 1px solid #ddd;">
                ${inscription.preuvePaiementFileName ? `<small class="d-block mt-1 text-muted">${inscription.preuvePaiementFileName}</small>` : ''}
              </div>
            </div>
          ` : ''}
          ${inscription.commentaireAdmin ? `<p class="mt-3"><strong>Commentaire admin:</strong> ${inscription.commentaireAdmin}</p>` : ''}
          <hr>
          <p><strong>Date d'inscription:</strong> ${formatDate(inscription.dateInscription)}</p>
          ${inscription.dateValidation ? `<p><strong>Date de validation:</strong> ${formatDate(inscription.dateValidation)}</p>` : ''}
        </div>
      </div>
    `;
    
    // Créer une modal pour afficher les détails
    const modalHtml = `
      <div class="modal fade" id="viewInscriptionModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Détails de l'inscription</h5>
              <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body">
              ${details}
            </div>
            <div class="modal-footer">
              ${inscription.statutPaiement === 'valide' ? `
                <button type="button" class="btn btn-success" data-action="download-receipt" data-id="${inscription.id}">
                  <i class="mdi mdi-download mr-2"></i>Télécharger le reçu
                </button>
              ` : ''}
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Fermer</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    $('#viewInscriptionModal').remove();
    $('body').append(modalHtml);
    $('#viewInscriptionModal').modal('show');
    
    // Gérer le clic sur le bouton de téléchargement du reçu
    $('#viewInscriptionModal').find('[data-action="download-receipt"]').on('click', function() {
      downloadReceipt(inscription);
    });
  }
}

async function editInscription(id) {
  // Accepter les IDs en string ou number
  const inscriptionId = id.toString();
  const inscription = await CSGRData.getInscription(inscriptionId);
  if (inscription) {
    showValidationModal(inscription);
  }
}

function showValidationModal(inscription) {
  const modalHtml = `
    <div class="modal fade" id="validationModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Valider le paiement</h5>
            <button type="button" class="close" data-dismiss="modal">&times;</button>
          </div>
          <div class="modal-body">
            <p><strong>Participant:</strong> ${inscription.prenom} ${inscription.nom}</p>
            <p><strong>Programme:</strong> ${inscription.programmeNom || 'N/A'}</p>
            <p><strong>Montant:</strong> ${inscription.prix === 0 || inscription.prix === '0' ? 'Gratuit' : (inscription.prix || 0).toLocaleString('fr-FR') + ' XAF'}</p>
            <hr>
            <div class="form-group">
              <label>Mode de paiement *</label>
              <select class="form-control" id="modal-mode-paiement">
                <option value="airtel" ${inscription.modePaiement === 'airtel' ? 'selected' : ''}>Airtel Money</option>
                <option value="moov" ${inscription.modePaiement === 'moov' ? 'selected' : ''}>Moov Money</option>
                <option value="especes" ${inscription.modePaiement === 'especes' ? 'selected' : ''}>Espèces</option>
                <option value="virement" ${inscription.modePaiement === 'virement' ? 'selected' : ''}>Virement bancaire</option>
                <option value="admin" ${inscription.modePaiement === 'admin' ? 'selected' : ''}>Validation admin</option>
              </select>
            </div>
            ${inscription.numeroMobile ? `<p><strong>Numéro de téléphone:</strong> ${inscription.numeroMobile}</p>` : ''}
            ${inscription.codeTransaction ? `<p><strong>Code de transaction:</strong> ${inscription.codeTransaction}</p>` : ''}
            ${inscription.preuvePaiementImage ? `
              <div class="form-group">
                <label>Preuve de paiement:</label>
                <div>
                  <img src="${inscription.preuvePaiementImage}" alt="Preuve de paiement" class="img-fluid" style="max-width: 300px; border-radius: 8px; border: 1px solid #ddd;">
                  ${inscription.preuvePaiementFileName ? `<small class="d-block mt-1 text-muted">${inscription.preuvePaiementFileName}</small>` : ''}
                </div>
              </div>
            ` : ''}
            <div class="form-group">
              <label>Statut du paiement *</label>
              <select class="form-control" id="modal-statut-paiement">
                <option value="en_attente" ${inscription.statutPaiement === 'en_attente' ? 'selected' : ''}>En attente</option>
                <option value="valide" ${inscription.statutPaiement === 'valide' ? 'selected' : ''}>Validé</option>
                <option value="echoue" ${inscription.statutPaiement === 'echoue' ? 'selected' : ''}>Échoué</option>
                <option value="rembourse" ${inscription.statutPaiement === 'rembourse' ? 'selected' : ''}>Remboursé</option>
              </select>
            </div>
            <div class="form-group">
              <label>Commentaire (optionnel)</label>
              <textarea class="form-control" id="modal-commentaire" rows="3" placeholder="Note interne sur le paiement...">${inscription.commentaireAdmin || ''}</textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Annuler</button>
            <button type="button" class="btn btn-primary" data-action="save-validation" data-id="${inscription.id}">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Supprimer l'ancienne modal si elle existe
  $('#validationModal').remove();
  $('body').append(modalHtml);
  $('#validationModal').modal('show');
  
  // Gérer le clic sur le bouton d'enregistrement
  $('#validationModal').find('[data-action="save-validation"]').on('click', function() {
    const id = $(this).data('id');
    saveInscriptionValidation(id);
  });
}

async function saveInscriptionValidation(id) {
  try {
    const inscriptionId = id.toString();
    const btn = $('#validationModal').find('[data-action="save-validation"]');
    btn.prop('disabled', true).html('<i class="mdi mdi-loading mdi-spin mr-1"></i>Enregistrement...');
    
    const modePaiement = $('#modal-mode-paiement').val();
    const statutPaiement = $('#modal-statut-paiement').val();
    const commentaire = $('#modal-commentaire').val();
    
    const inscription = await CSGRData.getInscription(inscriptionId);
    
    // Attendre la fin de la mise à jour
    await CSGRData.updateInscription(inscriptionId, {
      modePaiement: modePaiement,
      statutPaiement: statutPaiement,
      commentaireAdmin: commentaire,
      dateValidation: new Date().toISOString()
    });
    
    console.log('✅ Paiement mis à jour avec succès');
    
    // Fermer la modal
    $('#validationModal').modal('hide');
    
    // Recharger les inscriptions
    await loadInscriptions();
    
    // Réactiver le bouton
    btn.prop('disabled', false).html('Enregistrer');
    
    // Si le paiement est validé, afficher la modal du reçu
    if (statutPaiement === 'valide' && inscription) {
      // Mettre à jour l'inscription avec le nouveau statut
      inscription.statutPaiement = statutPaiement;
      inscription.modePaiement = modePaiement;
      inscription.dateValidation = new Date().toISOString();
      showReceiptModal(inscription);
    } else {
      alert('Paiement mis à jour avec succès');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la validation du paiement:', error);
    alert('Erreur lors de la mise à jour du paiement. Veuillez réessayer.');
    // Réactiver le bouton en cas d'erreur
    const btn = $('button[onclick*="saveInscriptionValidation"]');
    btn.prop('disabled', false).html('Enregistrer');
  }
}

// Afficher la modal du reçu avec options de partage
function showReceiptModal(inscription) {
  const modePaiementText = {
    'airtel': 'Airtel Money',
    'moov': 'Moov Money',
    'especes': 'Espèces',
    'virement': 'Virement bancaire',
    'admin': 'Validation admin'
  };
  
  const modePaiement = inscription.modePaiement || 'admin';
  const prix = inscription.prix === 0 || inscription.prix === '0' ? 'GRATUIT' : (inscription.prix || 0).toLocaleString('fr-FR') + ' XAF';
  const dateValidation = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // Stocker les données pour le téléchargement
  window.currentReceiptData = inscription;
  
  const modalHtml = `
    <div class="modal fade" id="receiptModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 500px;">
        <div class="modal-content" style="max-height: 90vh;">
          <div class="modal-header bg-success text-white py-2">
            <h6 class="modal-title mb-0"><i class="mdi mdi-check-circle mr-1"></i>Reçu de paiement</h6>
            <button type="button" class="close text-white" data-dismiss="modal" style="font-size: 20px;">&times;</button>
          </div>
          <div class="modal-body p-0" style="overflow-y: auto;">
            <!-- Reçu compact -->
            <div id="receipt-content" style="background: white; padding: 20px; font-size: 14px;">
              <div style="text-align: center; border-bottom: 2px solid #0061f2; padding-bottom: 12px; margin-bottom: 15px;">
                <h3 style="color: #0061f2; margin: 0; font-size: 20px;">CSGR-IA</h3>
                <small style="color: #666;">Comité Scientifique - Recherche IA</small>
                <div style="background: #0061f2; color: white; display: inline-block; padding: 4px 15px; border-radius: 15px; margin-top: 8px; font-size: 11px; font-weight: bold;">
                  REÇU DE PAIEMENT
                </div>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 12px;">
                <span><strong>Réf:</strong> CSGR-${inscription.id}</span>
                <span><strong>Date:</strong> ${dateValidation}</span>
              </div>
              
              <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                <p style="margin: 3px 0; font-size: 13px;"><strong>Participant:</strong> ${inscription.prenom || ''} ${inscription.nom || ''}</p>
                <p style="margin: 3px 0; font-size: 13px;"><strong>Email:</strong> ${inscription.email || 'N/A'}</p>
                <p style="margin: 3px 0; font-size: 13px;"><strong>Tél:</strong> ${inscription.telephone || 'N/A'}</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                <p style="margin: 3px 0; font-size: 13px;"><strong>Formation:</strong> ${inscription.programmeNom || 'N/A'}</p>
                <p style="margin: 3px 0; font-size: 13px;"><strong>Paiement:</strong> ${modePaiementText[modePaiement] || modePaiement}</p>
                ${inscription.codeTransaction ? `<p style="margin: 3px 0; font-size: 13px;"><strong>Transaction:</strong> ${inscription.codeTransaction}</p>` : ''}
              </div>
              
              <div style="background: linear-gradient(135deg, #0061f2 0%, #00a8e8 100%); color: white; padding: 15px; border-radius: 8px; text-align: center;">
                <small style="opacity: 0.9;">MONTANT TOTAL</small>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${prix}</p>
                <span style="background: rgba(255,255,255,0.2); padding: 3px 12px; border-radius: 12px; font-size: 11px; display: inline-block; margin-top: 8px;">
                  ✓ VALIDÉ
                </span>
              </div>
              
              <div style="text-align: center; margin-top: 12px; color: #888; font-size: 10px;">
                <p style="margin: 2px 0;">Ce reçu fait foi de paiement</p>
                <p style="margin: 2px 0;">© 2025 CSGR-IA</p>
              </div>
            </div>
          </div>
          <div class="modal-footer py-2" style="flex-wrap: wrap; gap: 5px; justify-content: center;">
            <button type="button" class="btn btn-sm btn-outline-secondary" data-dismiss="modal">
              <i class="mdi mdi-close"></i> Fermer
            </button>
            <button type="button" class="btn btn-sm btn-primary" id="btn-download-receipt">
              <i class="mdi mdi-download"></i> Télécharger
            </button>
            <button type="button" class="btn btn-sm btn-success" id="btn-whatsapp-receipt">
              <i class="mdi mdi-whatsapp"></i> WhatsApp
            </button>
            <button type="button" class="btn btn-sm btn-info" id="btn-email-receipt">
              <i class="mdi mdi-email"></i> Email
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  $('#receiptModal').remove();
  $('body').append(modalHtml);
  
  // Attacher les événements aux boutons
  $('#btn-download-receipt').on('click', function() {
    downloadReceiptAsImage(inscription.id);
  });
  
  $('#btn-whatsapp-receipt').on('click', function() {
    shareViaWhatsApp(inscription.telephone || '', (inscription.prenom || '') + ' ' + (inscription.nom || ''), inscription.programmeNom || '', prix, 'CSGR-' + inscription.id);
  });
  
  $('#btn-email-receipt').on('click', function() {
    shareViaEmail(inscription.email || '', (inscription.prenom || '') + ' ' + (inscription.nom || ''), inscription.programmeNom || '', prix, 'CSGR-' + inscription.id);
  });
  
  $('#receiptModal').modal('show');
}

// Télécharger le reçu comme image
async function downloadReceiptAsImage(inscriptionId) {
  const receiptElement = document.getElementById('receipt-content');
  
  if (!receiptElement) {
    alert('Erreur: élément du reçu non trouvé');
    return;
  }
  
  // Afficher un indicateur de chargement
  const btn = $('#btn-download-receipt');
  const originalHtml = btn.html();
  btn.prop('disabled', true).html('<i class="mdi mdi-loading mdi-spin"></i> ...');
  
  try {
    // Utiliser html2canvas si disponible
    if (typeof html2canvas !== 'undefined') {
      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });
      
      // Créer le lien de téléchargement
      const link = document.createElement('a');
      link.download = `recu-csgr-ia-${inscriptionId}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Notification de succès
      alert('✅ Reçu téléchargé avec succès !');
    } else {
      // Fallback: télécharger en HTML
      console.warn('html2canvas non disponible, téléchargement en HTML');
      downloadReceiptAsHTML(inscriptionId);
    }
  } catch (error) {
    console.error('Erreur génération image:', error);
    // Fallback en HTML
    downloadReceiptAsHTML(inscriptionId);
  }
  
  btn.prop('disabled', false).html(originalHtml);
}

// Télécharger le reçu en HTML (fallback)
function downloadReceiptAsHTML(inscriptionId) {
  const receiptElement = document.getElementById('receipt-content');
  if (!receiptElement) {
    alert('Erreur: élément du reçu non trouvé');
    return;
  }
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reçu CSGR-IA - ${inscriptionId}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 500px; margin: 20px auto; padding: 20px; }
    @media print { body { margin: 0; padding: 10px; } }
  </style>
</head>
<body>
  ${receiptElement.innerHTML}
  <script>window.print();</script>
</body>
</html>
  `;
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recu-csgr-ia-${inscriptionId}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  alert('✅ Reçu téléchargé ! Ouvrez le fichier pour l\'imprimer.');
}

// Partager via WhatsApp
function shareViaWhatsApp(telephone, nomComplet, programme, montant, reference) {
  const message = `✅ *REÇU DE PAIEMENT - CSGR-IA*

Bonjour ${nomComplet},

Votre paiement a été validé avec succès !

📋 *Détails:*
• Programme: ${programme}
• Montant: ${montant}
• Référence: ${reference}
• Statut: ✓ VALIDÉ

Merci pour votre confiance !

_CSGR-IA - Comité Scientifique Gabonais de Recherche sur l'Intelligence Artificielle_`;

  // Nettoyer le numéro de téléphone
  let phoneNumber = telephone.replace(/[^0-9]/g, '');
  if (phoneNumber.startsWith('0')) {
    phoneNumber = '241' + phoneNumber.substring(1);
  } else if (!phoneNumber.startsWith('241')) {
    phoneNumber = '241' + phoneNumber;
  }
  
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

// Partager via Email
function shareViaEmail(email, nomComplet, programme, montant, reference) {
  const subject = `Reçu de paiement CSGR-IA - ${reference}`;
  const body = `Bonjour ${nomComplet},

Votre paiement a été validé avec succès !

DÉTAILS DU PAIEMENT:
- Programme: ${programme}
- Montant: ${montant}
- Référence: ${reference}
- Statut: VALIDÉ

Merci pour votre confiance !

Cordialement,
L'équipe CSGR-IA
Comité Scientifique Gabonais de Recherche sur l'Intelligence Artificielle`;

  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl);
}

// Ancienne fonction pour compatibilité
async function downloadReceipt(idOrInscription, modePaiementOverride = null) {
  let inscription;
  if (typeof idOrInscription === 'string' || typeof idOrInscription === 'number') {
    const inscriptions = await CSGRData.getInscriptions();
    inscription = inscriptions.find(i => i.id === idOrInscription || i.id === String(idOrInscription));
    if (!inscription) {
      alert('Inscription non trouvée');
      return;
    }
  } else {
    inscription = idOrInscription;
  }
  
  if (modePaiementOverride) {
    inscription.modePaiement = modePaiementOverride;
  }
  
  showReceiptModal(inscription);
}

async function deleteInscription(id) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette inscription ?')) {
    CSGRData.deleteInscription(id);
    await loadInscriptions();
  }
}

async function deleteAllInscriptions() {
  if (confirm('Êtes-vous sûr de vouloir supprimer TOUTES les inscriptions ? Cette action est irréversible.')) {
    CSGRData.deleteAllInscriptions();
    await loadInscriptions();
  }
}

async function exportCSV() {
  const inscriptions = await CSGRData.getInscriptions();
  let csv = 'ID,Programme,Participant,Email,Téléphone,Statut,Date\n';
  if (Array.isArray(inscriptions)) {
    inscriptions.forEach(ins => {
      csv += `${ins.id},"${ins.programmeNom || ''}","${ins.prenom} ${ins.nom}","${ins.email}","${ins.telephone}","${ins.statutPaiement}","${ins.dateInscription}"\n`;
    });
  }
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inscriptions.csv';
  a.click();
}

// GESTION DES PROGRAMMES
async function loadProgrammes() {
  try {
    console.log('📚 [TABLEAU DE BORD] ========== DÉBUT CHARGEMENT PROGRAMMES ==========');
    
    // Vérifier que Firebase est initialisé
    if (!window.CSGRFirebase) {
      console.error('❌ CSGRFirebase n\'est pas disponible');
      const container = $('#programmes-list');
      if (container.length) {
        container.html('<div class="alert alert-danger">Erreur: Firebase n\'est pas chargé. Rafraîchissez la page.</div>');
      }
      return;
    }
    
    if (!window.CSGRFirebase.initialized) {
      console.log('🔄 Firebase non initialisé, initialisation...');
      try {
        await window.CSGRFirebase.init();
        console.log('✅ Firebase initialisé avec succès');
      } catch (initError) {
        console.error('❌ Erreur lors de l\'initialisation Firebase:', initError);
        const container = $('#programmes-list');
        if (container.length) {
          container.html('<div class="alert alert-danger">Erreur de connexion à Firebase. Vérifiez votre connexion internet.</div>');
        }
        return;
      }
    }
    
    console.log('📚 Firebase initialisé:', window.CSGRFirebase.initialized);
    console.log('📚 Firestore DB disponible:', !!window.CSGRFirebase.db);
    
    const container = $('#programmes-list');
    console.log('📚 Conteneur #programmes-list trouvé:', container.length > 0);
    
    if (!container.length) {
      console.error('❌ Conteneur #programmes-list non trouvé dans le DOM');
      console.error('❌ Vérifiez que la section programmes est visible');
      return;
    }
    
    console.log('📚 Récupération des programmes via CSGRData.getProgrammes()...');
    const programmes = await CSGRData.getProgrammes();
    console.log('📚 Programmes reçus depuis CSGRData:', programmes);
    console.log('📚 Type de données:', typeof programmes);
    console.log('📚 Est un tableau?', Array.isArray(programmes));
    console.log('📚 Nombre de programmes:', programmes ? programmes.length : 'null/undefined');
    
    container.empty();

    if (!programmes) {
      console.error('❌ programmes est null ou undefined');
      container.html('<div class="alert alert-danger">Erreur: Aucune donnée reçue de Firebase.</div>');
      return;
    }
    
    if (!Array.isArray(programmes)) {
      console.error('❌ programmes n\'est pas un tableau:', programmes);
      container.html('<div class="alert alert-danger">Erreur: Format de données incorrect.</div>');
      return;
    }
    
    if (programmes.length === 0) {
      console.warn('⚠️ Aucun programme trouvé dans Firebase');
      container.html('<p class="text-muted">Aucun programme. Créez votre premier programme en cliquant sur "Nouveau programme".</p>');
      return;
    }
    
    console.log(`📚 Affichage de ${programmes.length} programme(s)...`);

    programmes.forEach((programme, index) => {
      console.log(`📚 Programme ${index + 1}:`, programme);
      const prix = programme.prix === 0 || programme.prix === '0' ? 'Gratuit' : programme.prix.toLocaleString('fr-FR') + ' XAF';
      const programmeId = programme.id || `prog-${index}`;
      const html = `
        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
              <div class="mb-3 mb-md-0 flex-grow-1">
                <h5>${programme.nom || 'Sans nom'}</h5>
                <p class="text-muted mb-1">${programme.descriptionCourte || ''}</p>
                <small class="text-muted">Prix: ${prix} | Catégorie: ${programme.categorie || 'N/A'}</small>
              </div>
              <div class="d-flex flex-wrap gap-2 w-100 w-md-auto">
                <button class="btn btn-sm btn-primary flex-fill flex-md-grow-0" onclick="editProgramme('${programmeId}')">
                  <i class="mdi mdi-pencil mr-1"></i>Modifier
                </button>
                <button class="btn btn-sm btn-danger flex-fill flex-md-grow-0" onclick="deleteProgramme('${programmeId}')">
                  <i class="mdi mdi-delete mr-1"></i>Supprimer
                </button>
                <button class="btn btn-sm btn-secondary flex-fill flex-md-grow-0" onclick="moveProgramme('${programmeId}', 'up')">
                  <i class="mdi mdi-arrow-up"></i>
                </button>
                <button class="btn btn-sm btn-secondary flex-fill flex-md-grow-0" onclick="moveProgramme('${programmeId}', 'down')">
                  <i class="mdi mdi-arrow-down"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      container.append(html);
    });
    console.log(`✅ ${programmes.length} programme(s) affiché(s) dans le tableau de bord`);
  } catch (error) {
    console.error('❌ [TABLEAU DE BORD] Erreur lors du chargement des programmes:', error);
    console.error('❌ [TABLEAU DE BORD] Stack trace:', error.stack);
    const container = $('#programmes-list');
    if (container.length) {
      container.html(`<div class="alert alert-danger">
        <strong>Erreur lors du chargement des programmes</strong><br>
        ${error.message || 'Erreur inconnue'}<br>
        <small>Vérifiez la console (F12) pour plus de détails.</small>
      </div>`);
    }
    console.log('📚 [TABLEAU DE BORD] ========== FIN CHARGEMENT PROGRAMMES (ERREUR) ==========');
  }
}

async function showProgrammeModal(id = null) {
  const form = $('#programme-form')[0];
  if (form) form.reset();
  $('#programme-id').val('');
  $('#programme-nom-titulaire').val('');
  $('#programme-airtel').val('');
  $('#programme-moov').val('');

  if (id) {
    const programme = await CSGRData.getProgramme(id);
    if (programme) {
      $('#programme-id').val(programme.id);
      $('#programme-nom').val(programme.nom);
      $('#programme-desc-courte').val(programme.descriptionCourte || '');
      $('#programme-desc-longue').val(programme.descriptionLongue || '');
      $('#programme-date').val(programme.dateDebut ? programme.dateDebut.split('T')[0] : '');
      $('#programme-duree').val(programme.duree || '');
      $('#programme-lieu').val(programme.lieu || '');
      $('#programme-prix').val(programme.prix || 0);
      $('#programme-categorie').val(programme.categorie || 'debutant');
      $('#programme-icone').val(programme.icone || '');
      $('#programme-couleur').val(programme.couleur || '#007bff');
      $('#programme-image').val(programme.image || '');
      $('#programme-nom-titulaire').val(programme.nomTitulaire || '');
      $('#programme-airtel').val(programme.airtelMoney || '');
      $('#programme-moov').val(programme.moovMoney || '');
    }
  }

  $('#programmeModal').modal('show');
}

$('#programme-form').on('submit', async function(e) {
  e.preventDefault();
  const submitBtn = $(this).find('button[type="submit"]');
  const originalText = submitBtn.html();
  submitBtn.prop('disabled', true).html('<i class="mdi mdi-loading mdi-spin mr-2"></i>Enregistrement...');
  
  try {
    const programme = {
      id: $('#programme-id').val() ? parseInt($('#programme-id').val()) : null,
      nom: $('#programme-nom').val(),
      descriptionCourte: $('#programme-desc-courte').val(),
      descriptionLongue: $('#programme-desc-longue').val(),
      dateDebut: $('#programme-date').val(),
      duree: $('#programme-duree').val(),
      lieu: $('#programme-lieu').val(),
      prix: parseFloat($('#programme-prix').val()) || 0,
      categorie: $('#programme-categorie').val(),
      icone: $('#programme-icone').val(),
      couleur: $('#programme-couleur').val(),
      image: $('#programme-image').val(),
      nomTitulaire: $('#programme-nom-titulaire').val(),
      airtelMoney: $('#programme-airtel').val(),
      moovMoney: $('#programme-moov').val()
    };
    
    if (!programme.nom) {
      alert('⚠️ Le nom du programme est requis');
      submitBtn.prop('disabled', false).html(originalText);
      return;
    }
    
    if (programme.prix > 0 && (!programme.nomTitulaire || !programme.airtelMoney || !programme.moovMoney)) {
      alert('⚠️ Pour un programme payant, veuillez remplir toutes les informations de paiement (nom du titulaire, Airtel Money et Moov Money)');
      submitBtn.prop('disabled', false).html(originalText);
      return;
    }
    
    const savedProgramme = await CSGRData.saveProgramme(programme);
    console.log('✅ Programme sauvegardé dans Firebase:', savedProgramme);
    
    $('#programmeModal').modal('hide');
    
    // Attendre un peu pour que Firebase se synchronise
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Recharger les programmes avec retry
    let retries = 5;
    let programmeVisible = false;
    
    while (retries > 0 && !programmeVisible) {
      try {
        console.log(`🔄 Tentative de rechargement (${6 - retries}/5)...`);
        await loadProgrammes();
        
        // Vérifier que le programme sauvegardé est dans la liste
        const programmes = await CSGRData.getProgrammes();
        console.log('📋 Programmes chargés après sauvegarde:', programmes);
        
        if (programmes && programmes.length > 0) {
          const found = programmes.find(p => {
            if (savedProgramme.id) {
              return p.id === savedProgramme.id || 
                     p.id === savedProgramme.id.toString() || 
                     p.id === parseInt(savedProgramme.id) ||
                     (p.nom === savedProgramme.nom && p.descriptionCourte === savedProgramme.descriptionCourte);
            }
            return p.nom === savedProgramme.nom;
          });
          
          if (found) {
            console.log('✅ Programme visible dans la liste !');
            programmeVisible = true;
            alert('✅ Programme enregistré avec succès !');
          } else {
            retries--;
            if (retries > 0) {
              console.log(`⏳ Programme pas encore visible, nouvelle tentative dans 1.5s... (${retries} tentatives restantes)`);
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          }
        } else {
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors du rechargement:', error);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    }
    
    if (!programmeVisible) {
      console.warn('⚠️ Programme sauvegardé mais pas encore visible. Rafraîchissez la page si nécessaire.');
      alert('✅ Programme enregistré avec succès !\n\nNote: Si le programme n\'apparaît pas, rafraîchissez la page (F5).');
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du programme:', error);
    alert('❌ Erreur lors de la sauvegarde du programme.\n\n' + (error.message || 'Vérifiez la console pour plus de détails.'));
  } finally {
    submitBtn.prop('disabled', false).html(originalText);
  }
});

function editProgramme(id) {
  showProgrammeModal(id);
}

async function deleteProgramme(id) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
    try {
      await CSGRData.deleteProgramme(id);
      await loadProgrammes();
      alert('✅ Programme supprimé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression du programme:', error);
      alert('❌ Erreur lors de la suppression du programme.\n\n' + (error.message || 'Vérifiez la console pour plus de détails.'));
    }
  }
}

async function moveProgramme(id, direction) {
  try {
    const programmes = await CSGRData.getProgrammes();
    const index = programmes.findIndex(p => p.id === id || p.id === parseInt(id) || p.id === id.toString());
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      [programmes[index].ordre, programmes[index - 1].ordre] = [programmes[index - 1].ordre, programmes[index].ordre];
    } else if (direction === 'down' && index < programmes.length - 1) {
      [programmes[index].ordre, programmes[index + 1].ordre] = [programmes[index + 1].ordre, programmes[index].ordre];
    }

    // Sauvegarder chaque programme avec son nouvel ordre
    for (const programme of programmes) {
      await CSGRData.saveProgramme(programme);
    }
    
    await loadProgrammes();
  } catch (error) {
    console.error('Erreur lors du déplacement du programme:', error);
    alert('Erreur lors du déplacement du programme');
  }
}

// GESTION DES ACTUALITÉS
async function loadActualites() {
  try {
    const actualites = await CSGRData.getActualites();
    const container = $('#actualites-list');
    container.empty();

    if (!Array.isArray(actualites) || actualites.length === 0) {
      container.html('<p class="text-muted">Aucune actualité.</p>');
      return;
    }

    actualites.forEach(actualite => {
    const html = `
      <div class="card mb-3">
        <div class="card-body">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
            <div class="mb-3 mb-md-0 flex-grow-1">
              <h5>${actualite.titre}</h5>
              <p class="text-muted mb-1">${actualite.description || ''}</p>
              <small class="text-muted">${formatDate(actualite.date)}</small>
            </div>
            <div class="d-flex flex-wrap gap-2 w-100 w-md-auto">
              <button class="btn btn-sm btn-primary flex-fill flex-md-grow-0" onclick="editActualite(${actualite.id})">
                <i class="mdi mdi-pencil mr-1"></i>Modifier
              </button>
              <button class="btn btn-sm btn-danger flex-fill flex-md-grow-0" onclick="deleteActualite(${actualite.id})">
                <i class="mdi mdi-delete mr-1"></i>Supprimer
              </button>
              <button class="btn btn-sm btn-secondary flex-fill flex-md-grow-0" onclick="moveActualite(${actualite.id}, 'up')">
                <i class="mdi mdi-arrow-up"></i>
              </button>
              <button class="btn btn-sm btn-secondary flex-fill flex-md-grow-0" onclick="moveActualite(${actualite.id}, 'down')">
                <i class="mdi mdi-arrow-down"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    container.append(html);
  });
  } catch (error) {
    console.error('❌ Erreur lors du chargement des actualités:', error);
    const container = $('#actualites-list');
    if (container.length) {
      container.html('<div class="alert alert-danger">Erreur lors du chargement des actualités. Veuillez réessayer.</div>');
    }
    throw error;
  }
}

async function showActualiteModal(id = null) {
  const form = $('#actualite-form')[0];
  form.reset();
  $('#actualite-id').val('');

  if (id) {
    const actualite = await CSGRData.getActualite(id);
    if (actualite) {
      $('#actualite-id').val(actualite.id);
      $('#actualite-titre').val(actualite.titre);
      $('#actualite-description').val(actualite.description || '');
      $('#actualite-contenu').val(actualite.contenu || '');
      $('#actualite-date').val(actualite.date ? actualite.date.split('T')[0] : '');
      $('#actualite-lieu').val(actualite.lieu || '');
      $('#actualite-image').val(actualite.image || '');
    }
  }

  $('#actualiteModal').modal('show');
}

$('#actualite-form').on('submit', async function(e) {
  e.preventDefault();
  const submitBtn = $(this).find('button[type="submit"]');
  const originalText = submitBtn.html();
  submitBtn.prop('disabled', true).html('<i class="mdi mdi-loading mdi-spin mr-2"></i>Enregistrement...');
  
  try {
    const actualite = {
      id: $('#actualite-id').val() ? parseInt($('#actualite-id').val()) : null,
      titre: $('#actualite-titre').val(),
      description: $('#actualite-description').val(),
      contenu: $('#actualite-contenu').val(),
      date: $('#actualite-date').val(),
      lieu: $('#actualite-lieu').val(),
      image: $('#actualite-image').val()
    };
    
    if (!actualite.titre) {
      alert('⚠️ Le titre de l\'actualité est requis');
      submitBtn.prop('disabled', false).html(originalText);
      return;
    }
    
    const savedActualite = await CSGRData.saveActualite(actualite);
    console.log('✅ Actualité sauvegardée dans Firebase:', savedActualite);
    
    $('#actualiteModal').modal('hide');
    
    // Attendre un peu pour que Firebase se synchronise
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Recharger les actualités avec retry
    let retries = 5;
    let actualiteVisible = false;
    
    while (retries > 0 && !actualiteVisible) {
      try {
        console.log(`🔄 Tentative de rechargement (${6 - retries}/5)...`);
        await loadActualites();
        
        const actualites = await CSGRData.getActualites();
        console.log('📋 Actualités chargées après sauvegarde:', actualites);
        
        if (actualites && actualites.length > 0) {
          const found = actualites.find(a => {
            if (savedActualite.id) {
              return a.id === savedActualite.id || 
                     a.id === savedActualite.id.toString() || 
                     a.id === parseInt(savedActualite.id) ||
                     (a.titre === savedActualite.titre && a.date === savedActualite.date);
            }
            return a.titre === savedActualite.titre;
          });
          
          if (found) {
            console.log('✅ Actualité visible dans la liste !');
            actualiteVisible = true;
            alert('✅ Actualité enregistrée avec succès !');
          } else {
            retries--;
            if (retries > 0) {
              console.log(`⏳ Actualité pas encore visible, nouvelle tentative dans 1.5s... (${retries} tentatives restantes)`);
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          }
        } else {
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors du rechargement:', error);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    }
    
    if (!actualiteVisible) {
      console.warn('⚠️ Actualité sauvegardée mais pas encore visible. Rafraîchissez la page si nécessaire.');
      alert('✅ Actualité enregistrée avec succès !\n\nNote: Si l\'actualité n\'apparaît pas, rafraîchissez la page (F5).');
    }
    
    alert('✅ Actualité enregistrée avec succès !\n\nLes données ont été sauvegardées dans Firebase.');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'actualité:', error);
    alert('❌ Erreur lors de la sauvegarde de l\'actualité.\n\n' + (error.message || 'Vérifiez la console pour plus de détails.'));
  } finally {
    submitBtn.prop('disabled', false).html(originalText);
  }
});

function editActualite(id) {
  showActualiteModal(id);
}

async function deleteActualite(id) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?')) {
    try {
      await CSGRData.deleteActualite(id);
      await loadActualites();
      alert('✅ Actualité supprimée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'actualité:', error);
      alert('❌ Erreur lors de la suppression de l\'actualité.\n\n' + (error.message || 'Vérifiez la console pour plus de détails.'));
    }
  }
}

async function moveActualite(id, direction) {
  try {
    const actualites = await CSGRData.getActualites();
    const index = actualites.findIndex(a => a.id === id || a.id === parseInt(id) || a.id === id.toString());
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      [actualites[index].ordre, actualites[index - 1].ordre] = [actualites[index - 1].ordre, actualites[index].ordre];
    } else if (direction === 'down' && index < actualites.length - 1) {
      [actualites[index].ordre, actualites[index + 1].ordre] = [actualites[index + 1].ordre, actualites[index].ordre];
    }

    // Sauvegarder chaque actualité avec son nouvel ordre
    for (const actualite of actualites) {
      await CSGRData.saveActualite(actualite);
    }
    
    await loadActualites();
  } catch (error) {
    console.error('Erreur lors du déplacement de l\'actualité:', error);
    alert('Erreur lors du déplacement de l\'actualité');
  }
}

// GESTION DES STATISTIQUES
async function loadStatistiques() {
  try {
    const statistiques = await CSGRData.getStatistiques();
    const container = $('#statistiques-list');
    container.empty();

    if (!Array.isArray(statistiques) || statistiques.length === 0) {
      container.html('<p class="text-muted">Aucune statistique.</p>');
      return;
    }

    statistiques.forEach(stat => {
    const html = `
      <div class="card mb-3">
        <div class="card-body">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
            <div class="mb-3 mb-md-0 flex-grow-1">
              <h5>${stat.label}</h5>
              <p class="text-primary mb-0" style="font-size: 24px;">${stat.valeur}</p>
            </div>
            <div class="d-flex flex-wrap gap-2 w-100 w-md-auto">
              <button class="btn btn-sm btn-primary flex-fill flex-md-grow-0" onclick="editStatistique(${stat.id})">
                <i class="mdi mdi-pencil mr-1"></i>Modifier
              </button>
              <button class="btn btn-sm btn-danger flex-fill flex-md-grow-0" onclick="deleteStatistique(${stat.id})">
                <i class="mdi mdi-delete mr-1"></i>Supprimer
              </button>
              <button class="btn btn-sm btn-secondary flex-fill flex-md-grow-0" onclick="moveStatistique(${stat.id}, 'up')">
                <i class="mdi mdi-arrow-up"></i>
              </button>
              <button class="btn btn-sm btn-secondary flex-fill flex-md-grow-0" onclick="moveStatistique(${stat.id}, 'down')">
                <i class="mdi mdi-arrow-down"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    container.append(html);
  });
  console.log(`✅ ${statistiques.length} statistique(s) affichée(s) dans le tableau de bord`);
  } catch (error) {
    console.error('❌ Erreur lors du chargement des statistiques:', error);
    const container = $('#statistiques-list');
    if (container.length) {
      container.html('<div class="alert alert-danger">Erreur lors du chargement des statistiques. Veuillez réessayer.</div>');
    }
    throw error;
  }
}

async function showStatistiqueModal(id = null) {
  const form = $('#statistique-form')[0];
  form.reset();
  $('#statistique-id').val('');

  if (id) {
    const statistiques = await CSGRData.getStatistiques();
    const stat = statistiques.find(s => s.id === id || s.id === parseInt(id));
    if (stat) {
      $('#statistique-id').val(stat.id);
      $('#statistique-label').val(stat.label);
      $('#statistique-valeur').val(stat.valeur);
      $('#statistique-icone').val(stat.icone || '');
      $('#statistique-couleur').val(stat.couleur || '#007bff');
    }
  }

  $('#statistiqueModal').modal('show');
}

$('#statistique-form').on('submit', async function(e) {
  e.preventDefault();
  const submitBtn = $(this).find('button[type="submit"]');
  const originalText = submitBtn.html();
  submitBtn.prop('disabled', true).html('<i class="mdi mdi-loading mdi-spin mr-2"></i>Enregistrement...');
  
  try {
    const statistiques = await CSGRData.getStatistiques();
    const maxOrdre = Array.isArray(statistiques) && statistiques.length > 0 ? Math.max(...statistiques.map(s => s.ordre || 0)) : 0;
    
    const statistique = {
      id: $('#statistique-id').val() ? parseInt($('#statistique-id').val()) : null,
      label: $('#statistique-label').val(),
      valeur: $('#statistique-valeur').val(),
      icone: $('#statistique-icone').val(),
      couleur: $('#statistique-couleur').val(),
      ordre: $('#statistique-id').val() ? statistiques.find(s => s.id === parseInt($('#statistique-id').val()))?.ordre || maxOrdre + 1 : maxOrdre + 1
    };
    
    if (!statistique.label || !statistique.valeur) {
      alert('⚠️ Le label et la valeur sont requis');
      submitBtn.prop('disabled', false).html(originalText);
      return;
    }
    
    await CSGRData.saveStatistique(statistique);
    console.log('✅ Statistique sauvegardée dans Firebase');
    
    $('#statistiqueModal').modal('hide');
    
    // Attendre un peu pour que Firebase se synchronise
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Recharger les statistiques avec retry
    let retries = 5;
    let statistiqueVisible = false;
    
    while (retries > 0 && !statistiqueVisible) {
      try {
        console.log(`🔄 Tentative de rechargement (${6 - retries}/5)...`);
        await loadStatistiques();
        
        const statistiques = await CSGRData.getStatistiques();
        console.log('📋 Statistiques chargées après sauvegarde:', statistiques);
        
        if (statistiques && statistiques.length > 0) {
          const found = statistiques.find(s => {
            if (statistique.id) {
              return s.id === statistique.id || 
                     s.id === statistique.id.toString() || 
                     s.id === parseInt(statistique.id) ||
                     (s.label === statistique.label && s.valeur === statistique.valeur);
            }
            return s.label === statistique.label;
          });
          
          if (found) {
            console.log('✅ Statistique visible dans la liste !');
            statistiqueVisible = true;
            alert('✅ Statistique enregistrée avec succès !');
          } else {
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          }
        } else {
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors du rechargement:', error);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    }
    
    if (!statistiqueVisible) {
      alert('✅ Statistique enregistrée avec succès !\n\nNote: Si la statistique n\'apparaît pas, rafraîchissez la page (F5).');
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la statistique:', error);
    alert('❌ Erreur lors de la sauvegarde de la statistique.\n\n' + (error.message || 'Vérifiez la console pour plus de détails.'));
  } finally {
    submitBtn.prop('disabled', false).html(originalText);
  }
});

function editStatistique(id) {
  showStatistiqueModal(id);
}

async function deleteStatistique(id) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette statistique ?')) {
    try {
      await CSGRData.deleteStatistique(id);
      await loadStatistiques();
      alert('✅ Statistique supprimée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression de la statistique:', error);
      alert('❌ Erreur lors de la suppression de la statistique.\n\n' + (error.message || 'Vérifiez la console pour plus de détails.'));
    }
  }
}

async function moveStatistique(id, direction) {
  try {
    const statistiques = await CSGRData.getStatistiques();
    const index = statistiques.findIndex(s => s.id === id || s.id === parseInt(id) || s.id === id.toString());
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      [statistiques[index].ordre, statistiques[index - 1].ordre] = [statistiques[index - 1].ordre, statistiques[index].ordre];
    } else if (direction === 'down' && index < statistiques.length - 1) {
      [statistiques[index].ordre, statistiques[index + 1].ordre] = [statistiques[index + 1].ordre, statistiques[index].ordre];
    }

    // Sauvegarder chaque statistique avec son nouvel ordre
    for (const statistique of statistiques) {
      await CSGRData.saveStatistique(statistique);
    }
    
    await loadStatistiques();
  } catch (error) {
    console.error('Erreur lors du déplacement de la statistique:', error);
    alert('Erreur lors du déplacement de la statistique');
  }
}

// GESTION CTA
async function loadCTA() {
  try {
    const cta = await CSGRData.getCTA();
    $('#cta-titre').val(cta.titre || '');
    $('#cta-description').val(cta.description || '');
    $('#cta-texte-bouton').val(cta.texteBouton || '');
    $('#cta-lien-bouton').val(cta.lienBouton || '');
    $('#cta-actif').prop('checked', cta.actif || false);
  } catch (error) {
    console.error('Erreur lors du chargement du CTA:', error);
  }
}

$('#cta-form').on('submit', async function(e) {
  e.preventDefault();
  const cta = {
    titre: $('#cta-titre').val(),
    description: $('#cta-description').val(),
    texteBouton: $('#cta-texte-bouton').val(),
    lienBouton: $('#cta-lien-bouton').val(),
    actif: $('#cta-actif').is(':checked')
  };
  await CSGRData.saveCTA(cta);
  alert('CTA enregistré');
});

// GESTION POPUP
async function loadPopup() {
  try {
    console.log('🔔 Chargement de la configuration popup...');
    const popup = await CSGRData.getPopup();
    const programmes = await CSGRData.getProgrammes();
    
    console.log('📋 Popup actuelle:', popup);
    console.log('📋 Programmes disponibles:', programmes?.length || 0);
    
    const select = $('#popup-programme');
    select.empty().append('<option value="">-- Sélectionner un programme --</option>');
    if (Array.isArray(programmes)) {
      programmes.forEach(p => {
        const isSelected = popup.programmeId && (popup.programmeId === p.id || popup.programmeId === String(p.id) || String(popup.programmeId) === String(p.id));
        select.append(`<option value="${p.id}" ${isSelected ? 'selected' : ''}>${p.nom}</option>`);
      });
    }

    $('#popup-delai').val(popup.delai || 2000);
    $('#popup-cooldown').val(popup.cooldown || 1);
    $('#popup-actif').prop('checked', popup.actif === true || popup.actif === 'true');
    
    console.log('✅ Configuration popup chargée');
  } catch (error) {
    console.error('❌ Erreur lors du chargement du popup:', error);
  }
}

$('#popup-form').on('submit', async function(e) {
  e.preventDefault();
  const submitBtn = $(this).find('button[type="submit"]');
  const originalText = submitBtn.html();
  submitBtn.prop('disabled', true).html('<i class="mdi mdi-loading mdi-spin mr-2"></i>Enregistrement...');
  
  try {
    const programmeVal = $('#popup-programme').val();
    const popup = {
      programmeId: programmeVal ? programmeVal : null,
      delai: parseInt($('#popup-delai').val()) || 2000,
      cooldown: parseInt($('#popup-cooldown').val()) || 1,
      actif: $('#popup-actif').is(':checked')
    };
    
    // Validation
    if (popup.actif && !popup.programmeId) {
      alert('⚠️ Veuillez sélectionner un programme à promouvoir.');
      submitBtn.prop('disabled', false).html(originalText);
      return;
    }
    
    console.log('💾 Sauvegarde de la popup:', popup);
    await CSGRData.savePopup(popup);
    console.log('✅ Popup sauvegardée avec succès');
    
    // Toujours réinitialiser le cooldown après sauvegarde pour faciliter les tests
    localStorage.removeItem('popup_last_shown');
    sessionStorage.removeItem('popup_last_shown');
    console.log('🔄 Cooldown réinitialisé');
    
    if (popup.actif) {
      alert('✅ Popup activée !\n\n👉 Cliquez sur "Tester sur le site" pour voir le résultat.');
    } else {
      alert('✅ Popup désactivée.');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de la popup:', error);
    alert('❌ Erreur: ' + (error.message || 'Vérifiez la console.'));
  } finally {
    submitBtn.prop('disabled', false).html(originalText);
  }
});

// Fonction pour réinitialiser le cooldown de la popup
function resetPopupCooldown() {
  localStorage.removeItem('popup_last_shown');
  sessionStorage.removeItem('popup_last_shown');
  alert('✅ Cooldown réinitialisé !\n\nLa popup s\'affichera lors de votre prochaine visite sur la page d\'accueil.');
}

// Exposer la fonction globalement
window.resetPopupCooldown = resetPopupCooldown;

// GESTION UTILISATEURS
// GESTION DES TÉMOIGNAGES
async function loadTemoignages() {
  try {
    console.log('💬 [TABLEAU DE BORD] Début du chargement des témoignages...');
    
    if (!window.CSGRFirebase || !window.CSGRFirebase.initialized) {
      console.log('🔄 Firebase non initialisé, initialisation...');
      if (window.CSGRFirebase) {
        await window.CSGRFirebase.init();
      } else {
        console.error('❌ CSGRFirebase n\'est pas disponible');
        return;
      }
    }
    
    console.log('💬 Récupération des témoignages depuis Firebase...');
    const temoignages = await CSGRData.getTemoignages();
    console.log('💬 Témoignages reçus depuis Firebase:', temoignages);
    console.log('💬 Nombre de témoignages:', temoignages ? temoignages.length : 0);
    
    const container = $('#temoignages-list');
    console.log('💬 Conteneur trouvé:', container.length > 0);
    
    if (!container.length) {
      console.error('❌ Conteneur #temoignages-list non trouvé dans le DOM');
      return;
    }
    
    container.empty();

    if (!Array.isArray(temoignages) || temoignages.length === 0) {
      console.warn('⚠️ Aucun témoignage trouvé dans Firebase');
      container.html('<p class="text-muted">Aucun témoignage. Créez votre premier témoignage en cliquant sur "Nouveau témoignage".</p>');
      return;
    }
    
    console.log(`💬 Affichage de ${temoignages.length} témoignage(s)...`);

    temoignages.forEach((temoignage, index) => {
      console.log(`💬 Témoignage ${index + 1}:`, temoignage);
      const temoignageId = temoignage.id || `tem-${index}`;
      const nom = (temoignage.nom || 'Anonyme').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const texte = (temoignage.texte || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').substring(0, 100);
      const fonction = (temoignage.fonction || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const html = `
        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
              <div class="mb-3 mb-md-0 flex-grow-1">
                <h5>${nom}</h5>
                ${fonction ? `<p class="text-muted mb-1"><small>${fonction}</small></p>` : ''}
                <p class="text-muted mb-0">${texte}${temoignage.texte && temoignage.texte.length > 100 ? '...' : ''}</p>
              </div>
              <div class="d-flex flex-wrap gap-2 w-100 w-md-auto">
                <button class="btn btn-sm btn-primary flex-fill flex-md-grow-0" onclick="editTemoignage('${temoignageId}')">
                  <i class="mdi mdi-pencil mr-1"></i>Modifier
                </button>
                <button class="btn btn-sm btn-danger flex-fill flex-md-grow-0" onclick="deleteTemoignage('${temoignageId}')">
                  <i class="mdi mdi-delete mr-1"></i>Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      container.append(html);
      console.log(`✅ Témoignage ${index + 1} ajouté au DOM`);
    });
    console.log(`✅ ${temoignages.length} témoignage(s) affiché(s) dans le tableau de bord`);
  } catch (error) {
    console.error('❌ Erreur lors du chargement des témoignages:', error);
    const container = $('#temoignages-list');
    if (container.length) {
      container.html('<div class="alert alert-danger">Erreur lors du chargement des témoignages. Veuillez réessayer.</div>');
    }
  }
}

async function showTemoignageModal(id = null) {
  try {
    const form = $('#temoignage-form')[0];
    if (form) form.reset();
    $('#temoignage-id').val('');
    $('#temoignage-ordre').val('0');

    if (id) {
      const temoignages = await CSGRData.getTemoignages();
      const temoignage = temoignages.find(t => t.id === id || t.id === id.toString());
      if (temoignage) {
        $('#temoignage-id').val(temoignage.id);
        $('#temoignage-nom').val(temoignage.nom || '');
        $('#temoignage-fonction').val(temoignage.fonction || '');
        $('#temoignage-texte').val(temoignage.texte || '');
        $('#temoignage-image').val(temoignage.image || '');
        $('#temoignage-ordre').val(temoignage.ordre || '0');
      }
    }

    $('#temoignageModal').modal('show');
  } catch (error) {
    console.error('❌ Erreur lors de l\'ouverture du modal de témoignage:', error);
    alert('❌ Erreur lors de l\'ouverture du formulaire. Veuillez réessayer.');
  }
}

// Rendre la fonction accessible globalement pour les onclick
window.showTemoignageModal = showTemoignageModal;

$('#temoignage-form').on('submit', async function(e) {
  e.preventDefault();
  const submitBtn = $(this).find('button[type="submit"]');
  const originalText = submitBtn.html();
  
  try {
    submitBtn.prop('disabled', true).html('<i class="mdi mdi-loading mdi-spin mr-2"></i>Enregistrement...');
    
    const nom = $('#temoignage-nom').val().trim();
    const texte = $('#temoignage-texte').val().trim();
    
    if (!nom || !texte) {
      alert('⚠️ Le nom et le texte du témoignage sont requis');
      submitBtn.prop('disabled', false).html(originalText);
      return;
    }
    
    const temoignage = {
      id: $('#temoignage-id').val() || null,
      nom: nom,
      fonction: $('#temoignage-fonction').val().trim(),
      texte: texte,
      image: $('#temoignage-image').val().trim(),
      ordre: parseInt($('#temoignage-ordre').val()) || 0
    };
    
    await CSGRData.saveTemoignage(temoignage);
    console.log('✅ Témoignage sauvegardé dans Firebase');
    
    $('#temoignageModal').modal('hide');
    
    // Attendre un peu pour que Firebase se synchronise
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await loadTemoignages();
    alert('✅ Témoignage enregistré avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du témoignage:', error);
    alert('❌ Erreur lors de la sauvegarde du témoignage.\n\n' + (error.message || 'Vérifiez la console pour plus de détails.'));
  } finally {
    submitBtn.prop('disabled', false).html(originalText);
  }
});

function editTemoignage(id) {
  showTemoignageModal(id);
}

async function deleteTemoignage(id) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce témoignage ?')) {
    try {
      await CSGRData.deleteTemoignage(id);
      await loadTemoignages();
      alert('✅ Témoignage supprimé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression du témoignage:', error);
      alert('❌ Erreur lors de la suppression du témoignage.');
    }
  }
}

// ===== GESTION DES PARTENAIRES =====
async function loadPartenaires() {
  try {
    const partenaires = await CSGRData.getPartenaires();
    const container = $('#partenaires-list');
    
    if (!container.length) return;
    
    if (!partenaires || partenaires.length === 0) {
      container.html('<p class="text-muted">Aucun partenaire. Cliquez sur "Nouveau partenaire" pour en ajouter.</p>');
      return;
    }
    
    const html = `
      <div class="row">
        ${partenaires.map(p => `
          <div class="col-md-4 col-lg-3 mb-4">
            <div class="card h-100">
              <div class="card-body text-center">
                <img src="${p.logo || 'images/csgr-ia-logo.png'}" alt="${p.nom}" style="max-height: 80px; max-width: 100%; object-fit: contain; margin-bottom: 15px;">
                <h6 class="card-title">${p.nom}</h6>
                ${p.description ? `<p class="card-text small text-muted">${p.description}</p>` : ''}
                ${p.site ? `<a href="${p.site}" target="_blank" class="btn btn-sm btn-outline-primary mb-2">Visiter</a>` : ''}
                <div class="mt-2">
                  <button class="btn btn-sm btn-info" onclick="editPartenaire('${p.id}')"><i class="mdi mdi-pencil"></i></button>
                  <button class="btn btn-sm btn-danger" onclick="deletePartenaire('${p.id}')"><i class="mdi mdi-delete"></i></button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.html(html);
  } catch (error) {
    console.error('Erreur chargement partenaires:', error);
    $('#partenaires-list').html('<p class="text-danger">Erreur lors du chargement des partenaires.</p>');
  }
}

async function showPartenaireModal(id = null) {
  const form = document.getElementById('partenaire-form');
  form.reset();
  $('#partenaire-id').val('');
  
  if (id) {
    const partenaires = await CSGRData.getPartenaires();
    const partenaire = partenaires.find(p => p.id === id);
    if (partenaire) {
      $('#partenaire-id').val(partenaire.id);
      $('#partenaire-nom').val(partenaire.nom || '');
      $('#partenaire-logo').val(partenaire.logo || '');
      $('#partenaire-site').val(partenaire.site || '');
      $('#partenaire-description').val(partenaire.description || '');
      $('#partenaire-ordre').val(partenaire.ordre || 0);
    }
  }
  
  $('#partenaireModal').modal('show');
}

$('#partenaire-form').on('submit', async function(e) {
  e.preventDefault();
  
  const submitBtn = $(this).find('button[type="submit"]');
  const originalText = submitBtn.html();
  submitBtn.prop('disabled', true).html('<i class="mdi mdi-loading mdi-spin mr-1"></i>Enregistrement...');
  
  try {
    const partenaire = {
      id: $('#partenaire-id').val() || null,
      nom: $('#partenaire-nom').val().trim(),
      logo: $('#partenaire-logo').val().trim(),
      site: $('#partenaire-site').val().trim(),
      description: $('#partenaire-description').val().trim(),
      ordre: parseInt($('#partenaire-ordre').val()) || 0
    };
    
    if (!partenaire.nom || !partenaire.logo) {
      alert('⚠️ Le nom et le logo sont requis');
      submitBtn.prop('disabled', false).html(originalText);
      return;
    }
    
    await CSGRData.savePartenaire(partenaire);
    $('#partenaireModal').modal('hide');
    await loadPartenaires();
    alert('✅ Partenaire enregistré !');
  } catch (error) {
    console.error('Erreur sauvegarde partenaire:', error);
    alert('❌ Erreur lors de la sauvegarde');
  } finally {
    submitBtn.prop('disabled', false).html(originalText);
  }
});

function editPartenaire(id) {
  showPartenaireModal(id);
}

async function deletePartenaire(id) {
  if (confirm('Supprimer ce partenaire ?')) {
    try {
      await CSGRData.deletePartenaire(id);
      await loadPartenaires();
      alert('✅ Partenaire supprimé !');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  }
}

// Exposer les fonctions globalement
window.showPartenaireModal = showPartenaireModal;
window.editPartenaire = editPartenaire;
window.deletePartenaire = deletePartenaire;

// ===== GESTION DES SPONSORS =====
async function loadSponsors() {
  try {
    const sponsors = await CSGRData.getSponsors();
    const container = $('#sponsors-list');
    
    if (!container.length) return;
    
    if (!sponsors || sponsors.length === 0) {
      container.html('<p class="text-muted">Aucun sponsor. Cliquez sur "Nouveau sponsor" pour en ajouter.</p>');
      return;
    }
    
    const html = `
      <div class="row">
        ${sponsors.map(s => `
          <div class="col-md-4 col-lg-3 mb-4">
            <div class="card h-100">
              <div class="card-body text-center">
                <img src="${s.logo || 'images/csgr-ia-logo.png'}" alt="${s.nom}" style="max-height: 80px; max-width: 100%; object-fit: contain; margin-bottom: 15px;">
                <h6 class="card-title">${s.nom}</h6>
                ${s.description ? `<p class="card-text small text-muted">${s.description}</p>` : ''}
                ${s.site ? `<a href="${s.site}" target="_blank" class="btn btn-sm btn-outline-primary mb-2">Visiter</a>` : ''}
                <div class="mt-2">
                  <button class="btn btn-sm btn-info" onclick="editSponsor('${s.id}')"><i class="mdi mdi-pencil"></i></button>
                  <button class="btn btn-sm btn-danger" onclick="deleteSponsor('${s.id}')"><i class="mdi mdi-delete"></i></button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.html(html);
  } catch (error) {
    console.error('Erreur chargement sponsors:', error);
    $('#sponsors-list').html('<p class="text-danger">Erreur lors du chargement des sponsors.</p>');
  }
}

async function showSponsorModal(id = null) {
  const form = document.getElementById('sponsor-form');
  form.reset();
  $('#sponsor-id').val('');
  
  if (id) {
    const sponsors = await CSGRData.getSponsors();
    const sponsor = sponsors.find(s => s.id === id);
    if (sponsor) {
      $('#sponsor-id').val(sponsor.id);
      $('#sponsor-nom').val(sponsor.nom || '');
      $('#sponsor-logo').val(sponsor.logo || '');
      $('#sponsor-site').val(sponsor.site || '');
      $('#sponsor-description').val(sponsor.description || '');
      $('#sponsor-ordre').val(sponsor.ordre || 0);
    }
  }
  
  $('#sponsorModal').modal('show');
}

$('#sponsor-form').on('submit', async function(e) {
  e.preventDefault();
  
  const submitBtn = $(this).find('button[type="submit"]');
  const originalText = submitBtn.html();
  submitBtn.prop('disabled', true).html('<i class="mdi mdi-loading mdi-spin mr-1"></i>Enregistrement...');
  
  try {
    const sponsor = {
      id: $('#sponsor-id').val() || null,
      nom: $('#sponsor-nom').val().trim(),
      logo: $('#sponsor-logo').val().trim(),
      site: $('#sponsor-site').val().trim(),
      description: $('#sponsor-description').val().trim(),
      ordre: parseInt($('#sponsor-ordre').val()) || 0
    };
    
    if (!sponsor.nom || !sponsor.logo) {
      alert('⚠️ Le nom et le logo sont requis');
      submitBtn.prop('disabled', false).html(originalText);
      return;
    }
    
    await CSGRData.saveSponsor(sponsor);
    $('#sponsorModal').modal('hide');
    await loadSponsors();
    alert('✅ Sponsor enregistré !');
  } catch (error) {
    console.error('Erreur sauvegarde sponsor:', error);
    alert('❌ Erreur lors de la sauvegarde');
  } finally {
    submitBtn.prop('disabled', false).html(originalText);
  }
});

function editSponsor(id) {
  showSponsorModal(id);
}

async function deleteSponsor(id) {
  if (confirm('Supprimer ce sponsor ?')) {
    try {
      await CSGRData.deleteSponsor(id);
      await loadSponsors();
      alert('✅ Sponsor supprimé !');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  }
}

// Exposer les fonctions globalement
window.showSponsorModal = showSponsorModal;
window.editSponsor = editSponsor;
window.deleteSponsor = deleteSponsor;

async function showUserModal(id = null) {
  const form = $('#user-form')[0];
  form.reset();
  $('#user-id').val('');

  if (id) {
    const users = await CSGRData.getUsers();
    const user = users.find(u => u.id === id || u.id === parseInt(id));
    if (user) {
      $('#user-id').val(user.id);
      $('#user-username').val(user.username || user.nom);
      $('#user-email').val(user.email);
      // Le rôle est toujours "membre du comité"
    }
  }

  $('#userModal').modal('show');
}

$('#user-form').on('submit', async function(e) {
  e.preventDefault();
  const user = {
    id: $('#user-id').val() ? parseInt($('#user-id').val()) : null,
    username: $('#user-username').val(),
    email: $('#user-email').val(),
    role: 'membre' // Toujours membre du comité
  };
  
  const password = $('#user-password').val();
  if (password || !user.id) {
    user.password = password || 'password123';
  } else {
    const users = await CSGRData.getUsers();
    const existingUser = users.find(u => u.id === user.id || u.id === parseInt(user.id));
    if (existingUser) {
      user.password = existingUser.password;
    }
  }

  CSGRData.saveUser(user);
  $('#userModal').modal('hide');
  await loadUsers();
});

function editUser(id) {
  showUserModal(id);
}

async function deleteUser(id) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
    try {
      await CSGRData.deleteUser(id);
      await loadUsers();
      alert('✅ Utilisateur supprimé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      alert('❌ Erreur lors de la suppression de l\'utilisateur.\n\n' + (error.message || 'Vérifiez la console pour plus de détails.'));
    }
  }
}

// GESTION CONTACT
async function loadContact() {
  try {
    const contact = await CSGRData.getContact();
    $('#contact-email').val(contact.email || '');
    $('#contact-phone').val(contact.phone || '');
    $('#contact-address').val(contact.address || '');
  } catch (error) {
    console.error('Erreur lors du chargement des informations de contact:', error);
  }
}

$('#contact-form').on('submit', async function(e) {
  e.preventDefault();
  const contact = {
    email: $('#contact-email').val(),
    phone: $('#contact-phone').val(),
    address: $('#contact-address').val()
  };
  await CSGRData.saveContact(contact);
  alert('Informations de contact enregistrées');
});

// UTILITAIRES
function formatDate(dateValue) {
  if (!dateValue) return 'N/A';
  
  let date;
  
  // Si c'est un Timestamp Firebase (a une méthode toDate)
  if (dateValue && typeof dateValue.toDate === 'function') {
    date = dateValue.toDate();
  }
  // Si c'est un objet avec seconds (Timestamp Firebase sérialisé)
  else if (dateValue && dateValue.seconds) {
    date = new Date(dateValue.seconds * 1000);
  }
  // Si c'est déjà une Date
  else if (dateValue instanceof Date) {
    date = dateValue;
  }
  // Si c'est une chaîne de caractères ou un nombre
  else {
    date = new Date(dateValue);
  }
  
  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    return 'N/A';
  }
  
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

