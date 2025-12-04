// HEADER ANIMATION
window.onscroll = function() {scrollFunction()};
var element = document.getElementById("body");
function scrollFunction() {
  if (document.body.scrollTop > 400 || document.documentElement.scrollTop > 400) {
      $(".navbar").addClass("fixed-top");
      element.classList.add("header-small");
      $("body").addClass("body-top-padding");

  } else {
      $(".navbar").removeClass("fixed-top");
      element.classList.remove("header-small");
      $("body").removeClass("body-top-padding");
  }
}

// OWL-CAROUSAL
// Vérifier que le plugin est chargé avant de l'utiliser
$(document).ready(function() {
  if (typeof $.fn.owlCarousel !== 'undefined') {
    $('.owl-carousel').owlCarousel({
      items: 3,
      loop:true,
      nav:false,
      dot:true,
      autoplay: true,
      slideTransition: 'linear',
      autoplayHoverPause: true,
      responsive:{
        0:{
            items:1
        },
        600:{
            items:2
        },
        1000:{
            items:3
        }
    }
    });
  } else {
    console.warn('Owl Carousel plugin non chargé');
  }
});

// SCROLLSPY
$(document).ready(function() {
  $(".nav-link").click(function(e) {
      var t = $(this).attr("href");
      
      // Vérifier que le href est valide et n'est pas juste "#"
      if (!t || t === '#' || t === '' || !t.startsWith('#')) {
          return true; // Laisser le comportement par défaut
      }
      
      // Vérifier que l'élément cible existe
      var target = $(t);
      if (target.length === 0) {
          return true; // Laisser le comportement par défaut si l'élément n'existe pas
      }
      
      // Vérifier que l'élément a une position (offset)
      var offset = target.offset();
      if (!offset) {
          return true; // Laisser le comportement par défaut si pas d'offset
      }
      
      $("html, body").animate({
          scrollTop: offset.top - 75
      }, {
          duration: 1000,
      });
      $('body').scrollspy({ target: '.navbar', offset: offset.top });
      return false;
  });

});

// AOS - Initialiser seulement si AOS est chargé
if (typeof AOS !== 'undefined') {
  AOS.init({
    offset: 120, 
    delay: 0,
    duration: 1200, 
    easing: 'ease', 
    once: true, 
    mirror: false, 
    anchorPlacement: 'top-bottom', 
    disable: "mobile"
  });
} else {
  console.warn('AOS (Animate On Scroll) n\'est pas chargé. Les animations peuvent ne pas fonctionner.');
}

// Note: Le menu mobile est maintenant géré dans index.html avec la sidebar custom