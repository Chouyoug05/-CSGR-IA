// Script principal pour la page d'accueil CSGR-IA

$(document).ready(async function() {
  // Initialiser Firebase rapidement sans attendre
  if (window.CSGRFirebase && !window.CSGRFirebase.initialized) {
    window.CSGRFirebase.init().catch(err => console.warn('Firebase init:', err));
  }
  
  // Charger les données SANS retry pour plus de rapidité
  async function loadData(loadFunction, name) {
    try {
      await loadFunction();
    } catch (error) {
      console.error(`❌ Erreur chargement ${name}:`, error);
    }
  }
  
  // Charger TOUTES les données en PARALLÈLE immédiatement
  Promise.allSettled([
    loadData(loadStatistiques, 'statistiques'),
    loadData(loadProgrammes, 'programmes'),
    loadData(loadActualites, 'actualités'),
    loadData(loadTemoignages, 'témoignages'),
    loadData(loadCTA, 'CTA'),
    loadData(loadContact, 'contact')
  ]);
  
  // Gérer les filtres de programmes
  $('.filter-btn').on('click', function() {
    $('.filter-btn').removeClass('active');
    $(this).addClass('active');
    const category = $(this).data('category');
    filterProgrammes(category);
  });
  
  // Gérer la newsletter
  $('#newsletter-form').on('submit', function(e) {
    e.preventDefault();
    const email = $('#newsletter-email').val();
    if (email) {
      alert('Merci pour votre inscription ! Vous recevrez nos actualités à l\'adresse ' + email);
      $('#newsletter-email').val('');
    }
  });
  
  // Gérer la popup promotion
  checkAndShowPromotion();
  
  // Gérer le formulaire de contact
  $('#contact-modal-form').on('submit', async function(e) {
    e.preventDefault();
    await sendContactEmail();
  });
  
  $('#send-contact-btn').on('click', async function() {
    if ($('#contact-modal-form')[0].checkValidity()) {
      await sendContactEmail();
    } else {
      $('#contact-modal-form')[0].reportValidity();
    }
  });
  
  // La navbar mobile en bas a été retirée pour le site principal
});

// La fonction initMobileNav a été retirée car la navbar mobile en bas n'est plus utilisée sur le site principal

async function loadStatistiques() {
  try {
    const statistiques = await CSGRData.getStatistiques();
    const container = $('#statistiques-container');
    if (!container.length) return;
    
    container.empty();
    
    if (!Array.isArray(statistiques) || statistiques.length === 0) {
      container.html('<div class="col-12 text-center"><p class="text-muted">Aucune statistique disponible pour le moment.</p></div>');
      return;
    }
    
    statistiques.forEach(stat => {
      const html = `
        <div class="grid-margin d-flex justify-content-center">
          <div class="features-width">
            <i class="mdi ${stat.icone || 'mdi-chart-line'}" style="font-size: 48px; color: ${stat.couleur || '#007bff'};"></i>
            <h5 class="py-3">${stat.label || 'Statistique'}</h5>
            <h2 class="text-primary" style="color: ${stat.couleur || '#007bff'} !important;">${stat.valeur || '0'}</h2>
          </div>
        </div>
      `;
      container.append(html);
    });
  } catch (error) {
    console.error('❌ Erreur loadStatistiques:', error);
    const container = $('#statistiques-container');
    if (container.length) {
      container.html('<div class="col-12 text-center"><p class="text-danger">Erreur lors du chargement des statistiques.</p></div>');
    }
  }
}

async function loadProgrammes() {
  try {
    const programmes = await CSGRData.getProgrammes();
    const container = $('#programmes-container');
    if (!container.length) return;
    
    container.empty();
    
    if (!Array.isArray(programmes) || programmes.length === 0) {
      container.html('<div class="col-12 text-center"><p class="text-muted">Aucun programme disponible pour le moment.</p></div>');
      return;
    }
    
    programmes.forEach(programme => {
      const prix = programme.prix === 0 || programme.prix === '0' ? 'Gratuit' : programme.prix.toLocaleString('fr-FR') + ' XAF';
      const imageUrl = programme.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(programme.nom || 'Programme')}&size=400&background=${encodeURIComponent((programme.couleur || '#007bff').replace('#', ''))}&color=fff`;
      const html = `
        <div class="col-12 col-md-6 col-lg-4 mb-4 programme-card" data-category="${programme.categorie || 'all'}">
          <div class="card h-100 shadow-sm border-0 programme-card-enhanced">
            ${programme.image ? `
              <div class="card-img-wrapper" style="height: 200px; overflow: hidden; background: linear-gradient(135deg, ${programme.couleur || '#007bff'} 0%, ${programme.couleur || '#0056b3'} 100%);">
                <img src="${programme.image}" class="card-img-top" alt="${programme.nom || 'Programme'}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
            ` : `
              <div class="card-img-wrapper d-flex align-items-center justify-content-center" style="height: 200px; background: linear-gradient(135deg, ${programme.couleur || '#007bff'} 0%, ${programme.couleur || '#0056b3'} 100%);">
                <i class="mdi ${programme.icone || 'mdi-book'}" style="font-size: 80px; color: white; opacity: 0.9;"></i>
              </div>
            `}
            <div class="card-body d-flex flex-column">
              <div class="mb-3">
                <h5 class="card-title mb-2" style="color: #2c3e50; font-weight: 600;">${programme.nom || 'Programme'}</h5>
                <p class="text-muted mb-3" style="line-height: 1.6; min-height: 48px;">${programme.descriptionCourte || 'Découvrez ce programme de formation en intelligence artificielle.'}</p>
              </div>
              <div class="programme-info mb-3 flex-grow-1">
                <div class="d-flex align-items-center mb-2">
                  <i class="mdi mdi-calendar text-primary mr-2"></i>
                  <small class="text-muted">${formatDate(programme.dateDebut)}</small>
                </div>
                <div class="d-flex align-items-center mb-2">
                  <i class="mdi mdi-clock-outline text-primary mr-2"></i>
                  <small class="text-muted">${programme.duree || 'N/A'}</small>
                </div>
                <div class="d-flex align-items-center mb-2">
                  <i class="mdi mdi-map-marker text-primary mr-2"></i>
                  <small class="text-muted">${programme.lieu || 'N/A'}</small>
                </div>
                <div class="d-flex align-items-center">
                  <i class="mdi mdi-tag text-success mr-2"></i>
                  <strong class="text-success" style="font-size: 1.1rem;">${prix}</strong>
                </div>
              </div>
              <div class="mt-auto pt-3">
                <div class="d-flex gap-2">
                  <a href="programme.html?id=${programme.id}" class="btn btn-outline-primary btn-sm flex-fill">Détails</a>
                  <a href="inscription.html?programme=${programme.id}" class="btn btn-success btn-sm flex-fill">S'inscrire</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      container.append(html);
    });
  } catch (error) {
    console.error('❌ Erreur loadProgrammes:', error);
    const container = $('#programmes-container');
    if (container.length) {
      container.html('<div class="col-12 text-center"><p class="text-muted">Erreur lors du chargement des programmes.</p></div>');
    }
  }
}

function filterProgrammes(category) {
  if (category === 'all') {
    $('.programme-card').show();
  } else {
    $('.programme-card').hide();
    $(`.programme-card[data-category="${category}"]`).show();
  }
}

async function loadActualites() {
  try {
    console.log('📰 Chargement des actualités...');
    const actualites = await CSGRData.getActualites();
    console.log('📰 Actualités récupérées:', actualites);
    const actualitesLimited = Array.isArray(actualites) ? actualites.slice(0, 6) : [];
    const container = $('#actualites-container');
    console.log('📰 Container trouvé:', container.length);
    if (!container.length) {
      console.warn('⚠️ Container actualites-container non trouvé');
      return;
    }
    
    container.empty();
    
    if (actualitesLimited.length === 0) {
      container.html('<div class="col-12 text-center"><p class="text-muted">Aucune actualité pour le moment.</p></div>');
      console.log('ℹ️ Aucune actualité disponible');
      return;
    }
    
    console.log(`📰 Affichage de ${actualitesLimited.length} actualités`);
    
    actualitesLimited.forEach(actualite => {
      const imageUrl = actualite.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(actualite.titre || 'Actualité')}&size=400&background=007bff&color=fff`;
      const description = (actualite.description || actualite.contenu || 'Découvrez cette actualité...').substring(0, 120);
      const html = `
        <div class="col-12 col-md-6 col-lg-4 mb-4" data-aos="fade-up">
          <article class="card h-100 shadow-sm border-0 actualite-card-enhanced" style="border-radius: 12px; overflow: hidden;">
            ${actualite.image ? `
              <div class="card-img-wrapper" style="height: 200px; overflow: hidden; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);">
                <img src="${imageUrl}" class="card-img-top" alt="${actualite.titre || 'Actualité'}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(actualite.titre || 'Actualité')}&size=400&background=007bff&color=fff'">
              </div>
            ` : `
              <div class="card-img-wrapper d-flex align-items-center justify-content-center" style="height: 200px; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);">
                <i class="mdi mdi-newspaper" style="font-size: 80px; color: white; opacity: 0.9;"></i>
              </div>
            `}
            <div class="card-body d-flex flex-column">
              <div class="mb-3">
                <h5 class="card-title mb-2" style="color: #2c3e50; font-weight: 600;">${actualite.titre || 'Actualité'}</h5>
                <p class="text-muted mb-3" style="line-height: 1.6; min-height: 48px;">${description}${(actualite.description || actualite.contenu || '').length > 120 ? '...' : ''}</p>
              </div>
              <div class="actualite-info mb-3 flex-grow-1">
                <div class="d-flex align-items-center mb-2">
                  <i class="mdi mdi-calendar text-primary mr-2"></i>
                  <small class="text-muted">${formatDate(actualite.date)}</small>
                </div>
                ${actualite.lieu ? `
                  <div class="d-flex align-items-center mb-2">
                    <i class="mdi mdi-map-marker text-primary mr-2"></i>
                    <small class="text-muted">${actualite.lieu}</small>
                  </div>
                ` : ''}
              </div>
              <div class="mt-auto pt-3">
                <a href="actualite.html?id=${actualite.id}" class="btn btn-primary btn-sm btn-block">
                  <i class="mdi mdi-arrow-right mr-2"></i>Lire la suite
                </a>
              </div>
            </div>
          </article>
        </div>
      `;
      container.append(html);
    });
  } catch (error) {
    console.error('❌ Erreur loadActualites:', error);
    const container = $('#actualites-container');
    if (container.length) {
      container.html('<div class="col-12 text-center"><p class="text-danger">Erreur lors du chargement des actualités.</p></div>');
    }
  }
}

async function loadTemoignages() {
  try {
    const temoignages = await CSGRData.getTemoignages();
    const container = $('#temoignages-container');
    
    if (!container.length) return;
    
    container.empty();
    
    if (!Array.isArray(temoignages) || temoignages.length === 0) {
      container.html('<div class="col-12 text-center"><p class="text-muted">Aucun témoignage disponible pour le moment.</p></div>');
      return;
    }
    
    // Limiter à 3 témoignages pour le carousel
    const temoignagesLimited = temoignages.slice(0, 3);
    
    temoignagesLimited.forEach(temoignage => {
      const imageUrl = temoignage.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(temoignage.nom || 'User')}&size=89&background=007bff&color=fff`;
      const html = `
        <div class="card customer-cards">
          <div class="card-body">
            <div class="text-center">
              <img src="${imageUrl}" width="89" height="89" alt="${temoignage.nom || 'Témoignage'}" class="img-customer" style="border-radius: 50%; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(temoignage.nom || 'User')}&size=89&background=007bff&color=fff'">
              <p class="m-0 py-3 text-muted">"${temoignage.texte || ''}"</p>
              <div class="content-divider m-auto"></div>
              <h6 class="card-title pt-3">${temoignage.nom || 'Anonyme'}</h6>
              ${temoignage.fonction ? `<h6 class="customer-designation text-muted m-0">${temoignage.fonction}</h6>` : ''}
            </div>
          </div>
        </div>
      `;
      container.append(html);
    });
    
    // Réinitialiser le carousel après avoir ajouté les éléments
    if (typeof $ !== 'undefined' && $.fn.owlCarousel) {
      container.owlCarousel('destroy');
      container.owlCarousel({
        items: 3,
        loop: true,
        margin: 30,
        nav: false,
        dots: true,
        responsive: {
          0: { items: 1 },
          768: { items: 2 },
          1024: { items: 3 }
        }
      });
    }
  } catch (error) {
    console.error('❌ Erreur loadTemoignages:', error);
    const container = $('#temoignages-container');
    if (container.length) {
      container.html('<div class="text-center"><div class="alert alert-danger">Erreur lors du chargement des témoignages.</div></div>');
    }
  }
}

async function loadCTA() {
  try {
    const cta = await CSGRData.getCTA();
    if (cta && cta.actif) {
      if ($('#cta-title').length) $('#cta-title').text(cta.titre || 'Prêt à commencer votre formation ?');
      if ($('#cta-subtitle').length) $('#cta-subtitle').text(cta.description || 'Inscrivez-vous dès maintenant');
      if ($('#cta-button').length) {
        $('#cta-button').text(cta.texteBouton || 'Voir les programmes');
        $('#cta-button').attr('href', cta.lienBouton || '#programmes-section');
      }
      if ($('#cta-section').length) $('#cta-section').show();
    } else {
      if ($('#cta-section').length) $('#cta-section').hide();
    }
  } catch (error) {
    console.error('Erreur lors du chargement du CTA:', error);
  }
}

async function loadContact() {
  try {
    const contact = await CSGRData.getContact();
    if (contact) {
      if (contact.email && $('#contact-email').length) $('#contact-email').text(contact.email);
      if (contact.phone && $('#contact-phone').length) $('#contact-phone').text(contact.phone);
      if (contact.address && $('#contact-address').length) $('#contact-address').html(contact.address.replace(/\n/g, '<br>'));
    }
  } catch (error) {
    console.error('Erreur lors du chargement des informations de contact:', error);
  }
}

async function checkAndShowPromotion() {
  try {
    console.log('🔔 Vérification de la popup promotion...');
    
    // Attendre que Firebase soit initialisé
    if (!window.CSGRFirebase || !window.CSGRFirebase.initialized) {
      console.log('⏳ Attente de Firebase...');
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (window.CSGRFirebase && window.CSGRFirebase.initialized) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        // Timeout après 5 secondes
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 5000);
      });
    }
    
    const popup = await CSGRData.getPopup();
    console.log('🔔 Popup config récupérée:', popup);
    
    if (!popup) {
      console.log('❌ Aucune configuration de popup trouvée dans Firebase');
      return;
    }
    
    // Vérifier si la popup est activée
    if (popup.actif !== true && popup.actif !== 'true') {
      console.log('ℹ️ Popup désactivée (actif =', popup.actif, ')');
      return;
    }
    
    if (!popup.programmeId) {
      console.log('ℹ️ Aucun programme associé à la popup');
      return;
    }
    
    console.log('✅ Popup activée avec programme:', popup.programmeId);
    
    // Vérifier si on vient d'une inscription réussie (forcer l'affichage)
    const urlParams = new URLSearchParams(window.location.search);
    const fromInscription = urlParams.get('inscrit') === '1' || sessionStorage.getItem('inscription_success') === 'true';
    
    // Vérifier le cooldown - utiliser localStorage pour persistance entre sessions
    // Le cooldown est en HEURES (pas en jours) pour être plus flexible
    if (!fromInscription) {
      const lastShown = localStorage.getItem('popup_last_shown');
      if (lastShown) {
        const hoursSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
        const cooldownHours = (popup.cooldown || 1) * 24; // Convertir jours en heures
        if (hoursSince < cooldownHours) {
          console.log(`ℹ️ Popup en cooldown (${hoursSince.toFixed(1)}h / ${cooldownHours}h)`);
          return;
        }
      }
    } else {
      console.log('✅ Affichage forcé de la popup après inscription');
      // Nettoyer le flag d'inscription
      sessionStorage.removeItem('inscription_success');
    }
    
    // Afficher la popup après le délai
    const delai = popup.delai || 2000;
    console.log(`⏳ Affichage de la popup dans ${delai}ms...`);
    
    setTimeout(async function() {
      try {
        const programme = await CSGRData.getProgramme(popup.programmeId);
        if (programme) {
          const prix = programme.prix === 0 || programme.prix === '0' ? 'Gratuit' : programme.prix.toLocaleString('fr-FR') + ' XAF';
          
          const couleur = programme.couleur || '#667eea';
          const couleurGradient = programme.couleur || '#764ba2';
          
          $('#promotion-content').html(`
            <div style="text-align: center; padding: 10px;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 70px; height: 70px; background: linear-gradient(135deg, #0061f2 0%, #00a8e8 100%); border-radius: 50%; margin-bottom: 15px;">
                <i class="mdi ${programme.icone || 'mdi-book-open-variant'}" style="font-size: 35px; color: white;"></i>
              </div>
              <h4 style="color: #1e293b; font-weight: 700; margin-bottom: 8px; font-size: 1.3rem;">${programme.nom}</h4>
              <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 15px; line-height: 1.5;">${programme.descriptionCourte || 'Formation exceptionnelle !'}</p>
              <div style="background: linear-gradient(135deg, #0061f2 0%, #00a8e8 100%); color: white; padding: 10px 25px; border-radius: 25px; display: inline-block; font-size: 1.2rem; font-weight: bold; margin-bottom: 12px;">
                ${prix}
              </div>
              <p style="color: #f59e0b; font-size: 0.85rem; margin: 0;">
                <i class="mdi mdi-clock-fast mr-1"></i>Places limitées !
              </p>
            </div>
          `);
          $('#promotion-link').attr('href', `inscription.html?programme=${programme.id}`);
          
          // S'assurer que Bootstrap est chargé avant d'afficher le modal
          if (typeof $ !== 'undefined' && $.fn.modal) {
            // Attendre un peu pour s'assurer que le DOM est prêt
            setTimeout(() => {
              try {
                $('#promotionModal').modal({
                  backdrop: true,
                  keyboard: true,
                  show: true
                });
                localStorage.setItem('popup_last_shown', Date.now().toString());
                console.log('✅ Popup promotion affichée avec succès !');
              } catch (modalError) {
                console.error('❌ Erreur lors de l\'affichage du modal:', modalError);
                // Essayer une méthode alternative
                $('#promotionModal').addClass('show').css('display', 'block');
                $('body').addClass('modal-open');
                $('<div class="modal-backdrop fade show"></div>').appendTo('body');
                localStorage.setItem('popup_last_shown', Date.now().toString());
              }
            }, 100);
          } else {
            console.error('❌ Bootstrap modal non disponible');
          }
        } else {
          console.error('❌ Programme non trouvé pour la popup');
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement du programme pour la popup:', error);
      }
    }, delai);
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la popup:', error);
  }
}

// Exposer la fonction globalement pour qu'elle soit accessible depuis index.html
window.checkAndShowPromotion = checkAndShowPromotion;

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
  
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Fonction pour envoyer l'email de contact
async function sendContactEmail() {
  const btn = $('#send-contact-btn');
  const originalText = btn.html();
  
  try {
    // Désactiver le bouton et afficher un indicateur de chargement
    btn.prop('disabled', true).html('<i class="mdi mdi-loading mdi-spin mr-2"></i>Envoi en cours...');
    
    // Récupérer les données du formulaire
    const nom = $('#Name').val().trim();
    const email = $('#Email-1').val().trim();
    const message = $('#Message').val().trim();
    
    if (!nom || !email || !message) {
      alert('❌ Veuillez remplir tous les champs.');
      btn.prop('disabled', false).html(originalText);
      return;
    }
    
    // Récupérer l'email du comité depuis Firebase
    let comiteEmail = 'contact@csgr-ia.com'; // Email par défaut
    try {
      const contact = await CSGRData.getContact();
      if (contact && contact.email) {
        comiteEmail = contact.email;
      }
    } catch (error) {
      console.warn('Impossible de récupérer l\'email du comité, utilisation de l\'email par défaut');
    }
    
    // Préparer le contenu de l'email
    const emailSubject = `Nouveau message de contact - ${nom}`;
    const emailBody = `
Bonjour,

Vous avez reçu un nouveau message depuis le formulaire de contact du site CSGR-IA.

Informations du contacteur :
- Nom : ${nom}
- Email : ${email}

Message :
${message}

---
Ce message a été envoyé automatiquement depuis le site CSGR-IA.
    `.trim();
    
    // Créer un lien mailto (solution simple sans backend)
    const mailtoLink = `mailto:${comiteEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    // Ouvrir le client email par défaut
    window.location.href = mailtoLink;
    
    // Afficher un message de succès
    alert('✅ Votre message a été préparé. Veuillez envoyer l\'email depuis votre client de messagerie.\n\nSi votre client email ne s\'ouvre pas automatiquement, veuillez envoyer un email à : ' + comiteEmail);
    
    // Réinitialiser le formulaire
    $('#contact-modal-form')[0].reset();
    
    // Fermer le modal après un court délai
    setTimeout(() => {
      $('#exampleModal').modal('hide');
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du message:', error);
    alert('❌ Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer ou contacter directement : ' + comiteEmail);
  } finally {
    // Réactiver le bouton
    btn.prop('disabled', false).html(originalText);
  }
}

