// this code is loosely coupled across widgets using messaging

// edit widget
$( document ).ready( function() {
    var counter = 0;
    // blank the input fields, disable the buttons and update list
    function reset() {
        $( "#name" ).val( "" ).focus();
        $( "#key" ).val( "" );

        $( "#save" ).prop( "disabled", true );
        $( "#cancel" ).prop( "disabled", true );
        
        $.hub.publish( "cancel", {} );
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
        var key = $( "#key" ).val() || ( "key" + counter++ );
        $.hub.publish( "save", { "key": key, "name": $( "#name" ).val() } );




        reset();
    } );
    // reset the form
    $( "#cancel" ).click( function() {
        reset();
    } );
    $.hub.subscribe( "edit", function( channel, message ) {
        $( "#name" ).val( message.name ).change().focus();
        $( "#key" ).val( message.key );
    });
} );

// list widget
$( document ).ready( function() {
    // when a list item clicked, mark active and prefill edit form
    $( "#list ul li" ).live( "click", function() {
        $( "#list ul li" ).removeClass( "active" );
        $( this ).addClass( "active" );
        
        $.hub.publish( "edit", { "key": $( this ).attr( "id" ), "name": $( this ).text() } );

    } );
    
    $.hub.subscribe( "save", function( channel, message ) {
        var $key = $( "#" + message.key );
        if ( $key.length) {
            $key.text( message.name );
        } else {
            $( "#list ul" ).append( "<li id='" + message.key + "'>" + message.name + "</li>" );
        }        
    });
    $.hub.subscribe( "cancel", function( channel, message ) {
        $( "#list ul li" ).removeClass( "active" );        
    });
} );