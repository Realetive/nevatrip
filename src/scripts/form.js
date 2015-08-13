/* global $, p, ticketPriceDouble */
'use strict';

var sum = 0,
    count = 0,
    double = false,
    discount = 0,
    arrayPriceDouble = [];

/*!
 * IE8+ analog of jQuery's $(el).on(eventName, eventHandler)
 * use: addEventListener(el, eventName, handler);
 */
// function addEventListener( el, eventName, handler ) {
//   if ( el.addEventListener ) {
//     el.addEventListener( eventName, handler );
//   } else {
//     el.attachEvent( 'on' + eventName, function() {
//       handler.call( el );
//     });
//   }
// }

var $Form = document.getElementById( 'BuyForm' );
if ( $Form != null ) {

  var $Submit = document.getElementById( 'BuyFormSubmit' )
    , $CountError = document.getElementById( 'BuyFormCountError' )
    , $Sum = document.getElementById( 'BuyFormSum' )
    , $ShowSum = document.getElementById( 'BuyFormShowSum' )
    , $Total = document.getElementById( 'BuyFormTotal' )
    , $TripPoints = document.getElementById( 'BuyFormTripPoints' )
    , $Promocode = document.getElementById( 'BuyFormPromocode' )
    , $Tickets = document.querySelectorAll( '.buy-form-ticket' )
    , $TicketsPrices = document.querySelectorAll( '.buy-form-ticket-price' )
    , $TicketsInput = document.querySelectorAll( '.buy-form-ticket-input' )
    , $TicketsMinus = document.querySelectorAll( '.buy-form-ticket-minus' )
    , $TicketsPlus = document.querySelectorAll( '.buy-form-ticket-plus' );

  var showSum = function(){
        $Sum.value = sum;
        $ShowSum.innerHTML = sum;
      },
      recalcSumByTicket = function( el ){
        if( el.value ){
          count += parseInt( el.value );
        }
        sum += el.dataset.ticketPrice * el.value;
      },
      checkCount = function(){
        if( count < 1 ) {
          $CountError.style.display = 'block';
          $Submit.disabled = true;
        } else {
          $CountError.style.display = 'none';
          $Submit.disabled = false;
        }
      },
      recalcSum = function(){
        sum = 0;
        count = 0;
        Array.prototype.forEach.call( $Tickets, recalcSumByTicket);

        sum = parseInt((sum * (100 - discount)) / 100);

        $( $Form).trigger('updateSum');
        checkCount();
      };

  $Total.style.display = 'block';

  if ( window.ticketPriceDouble !== undefined ) {
    arrayPriceDouble = ticketPriceDouble.split(',');
  }

  if ( window.p !== undefined ) {
    $( $Promocode ).on( 'change keyup', function(){
      var pp = this.value.toLowerCase();
      if( p[ pp ] !== undefined ) {
        discount = p[ pp ];
        recalcSum();
      }
    });
  }

  $( $Form ).on( 'updateSum', showSum );

  $( $Tickets ).on( 'change keyup', function() {
    if( isNaN( this.value ) ){
      this.value = 0;
    } else{
      this.value = parseInt( this.value );
    }
    recalcSum();
  });

  $( $TicketsMinus ).on( 'click', function() {
    var currentTicket = this.nextElementSibling;
    if( currentTicket.value >= 1 ){
      currentTicket.value--;
    }
    recalcSum();
  });

  $( $TicketsPlus ).on( 'click', function() {
    var currentTicket = this.previousElementSibling;
    currentTicket.value++;
    recalcSum();
  });

  $( $TripPoints ).on( 'change', function(){
    var c = this.options.length;
    var o = this.options.selectedIndex;
    if( ( c === ( o + 1 ) ) && !double ){
      Array.prototype.forEach.call( $Tickets, function( el, i ) {
        var newPrice = arrayPriceDouble[ i ] > 0 ? arrayPriceDouble[ i ] : el.dataset.ticketPrice;
        el.dataset.originalTicketPrice = el.dataset.ticketPrice;
        el.dataset.ticketPrice = newPrice;
      });
      Array.prototype.forEach.call( $TicketsPrices, function( el, i ){
        var newPrice = arrayPriceDouble[ i ] > 0 ? arrayPriceDouble[ i ] : el.dataset.ticketPrice;
        el.innerHTML = newPrice;
      });
      Array.prototype.forEach.call( $TicketsInput, function( el, i ){
        var newPrice = arrayPriceDouble[ i ] > 0 ? arrayPriceDouble[ i ] : el.dataset.ticketPrice;
        el.value = newPrice;
      });
      double = true;
      recalcSum();
    } else if( double ) {
      Array.prototype.forEach.call( $Tickets, function( el ){
        el.dataset.ticketPrice = el.dataset.originalTicketPrice;
      });
      Array.prototype.forEach.call( $TicketsPrices, function( el ){
        el.innerHTML = el.dataset.ticketPrice;
      });
      Array.prototype.forEach.call( $TicketsInput, function( el ){
        el.value = el.dataset.ticketPrice;
      });
      double = false;
      recalcSum();
    }
  });

recalcSum();
}
