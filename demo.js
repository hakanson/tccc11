// this code is intentionally tightly coupled across widgets

// edit widget
$( document ).ready( function() {
    var counter = 0;
    // blank the input fields, disable the buttons and update list
    function reset() {
        $( "#name" ).val( "" ).focus();
        $( "#key" ).val( "" );

        $( "#save" ).prop( "disabled", true );
        $( "#cancel" ).prop( "disabled", true );
        
        $( "#list ul li" ).removeClass( "active" );
    }
    // buttons are only disabled when input box is blank
    $( "#name" ).change( function() {
        $( "#save" ).prop( "disabled", !$( this ).val() );
        $( "#cancel" ).prop( "disabled", !$( this ).val() );
    } );
    // don't wait for blur to trigger change 
    $( "#name" ).keyup( function() {
        $( this ).change();
    } );
    // either update or create a new entry in the list, then reset the form
    $( "#save" ).click( function() {
        if ( $( "#key" ).val() ) {
            $( "#" + $( "#key" ).val() ).text( $( "#name" ).val() );
        } else {
            $( "#list ul" ).append( "<li id='key" + counter++ + "'>" + $( "#name" ).val() + "</li>" );
        }

        reset();
    } );
    // reset the form
    $( "#cancel" ).click( function() {
        reset();
    } );




} );

// list widget
$( document ).ready( function() {
    // when a list item clicked, mark active and prefill edit form
    $( "#list ul li" ).live( "click", function() {
        $( "#list ul li" ).removeClass( "active" );
        $( this ).addClass( "active" );
        
        $( "#name" ).val( $( this ).text() ).change().focus();
        $( "#key" ).val( $( this ).attr( "id" ) );
    } );












} );