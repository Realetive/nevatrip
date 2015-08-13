/* eslint new-cap: [ 1, { capIsNewExceptions: [ "Gallery" ] } ] */
/* global $, blueimp */
'use strict';

$( '[data-toggle="tooltip"]' ).tooltip();
$( '[data-toggle="popover"]' ).popover();

$('.input-group.date').datepicker({
  weekStart: 1,
  language: 'ru',
  keyboardNavigation: false,
  todayHighlight: false,
  autoclose: true
});

var galleryContainer = document.getElementById( 'gallery' );
if ( galleryContainer != null ) {
  galleryContainer.onclick = function ( event ) {
    event = event || window.event;
    var target = event.target || event.srcElement,
    link = target.src ? target.parentNode : target,
    options = { index: link, event: event },
    links = this.getElementsByTagName( 'a' );
    blueimp.Gallery( links, options );
  };
}
