module( "jQuery custom events" );
  
test( "trigger custom event", function() {
    var a = null;
    
    $( document ).bind( "custom", function( event, data ) {
        a = data;
    } );
    $( document ).trigger( "custom", triggerData );
    
    deepEqual( a, triggerData );
} );

test( "trigger custom event with two subscribers", function() {
    var count = 0;
    
    $( "html" ).bind( "custom", function( event, data ) {
        count++;
    } );
    $( "body" ).bind( "custom", function( event, data ) {
        count++;
    } );
    $( "body" ).trigger( "custom", triggerData );
    
    equal( count, 2 );
} );


test( "trigger custom event with namespace", function() {
    var count = 0, namespaceCount = 0;
    
    $( "html" ).bind( "custom.namespace", function( event, data ) {
        namespaceCount++;
    } );
    $( "body" ).bind( "custom", function( event, data ) {
        count++;
    } );
    $( "body" ).trigger( "custom", triggerData );
    $( "body" ).trigger( "custom.namespace", triggerData );
    
    equal( count, 1 );
    equal( namespaceCount, 2 );
} );

test( "trigger custom event with two lateral subscribers that return false", function() {
    var count = 0;
    
    $( "body" ).bind( "custom", function( event, data ) {
        count++;
        return false;
    } );
    $( "body" ).bind( "custom", function( event, data ) {
        count++;
        return false;
    } );
    $( "body" ).trigger( "custom", triggerData );
    
    equal( count, 2 );
} );
  
// an event handler can stop the bubbling by returning false from the handler or 
// calling the .stopPropagation() method on the event object passed into the event.
  
test( "trigger custom event with two hierarchical subscribers that return false", function() {
    var count = 0;
    
    $( "html" ).bind( "custom", function( event, data ) {
        count++;
    } );
    $( "body" ).bind( "custom", function( event, data ) {
        count++;
        return false;
    } );
    $( "body" ).trigger( "custom", triggerData );
    
    equal( count, 1 );
} );
  
test( "trigger custom event with two hierarchical subscribers that stopPropagation", function() {
    var count = 0;
    
    $( "html" ).bind( "custom", function( event, data ) {
        count++;
    } );
    $( "body" ).bind( "custom", function( event, data ) {
        count++;
        event.stopPropagation();
    } );
    $( "body" ).trigger( "custom", triggerData );
    
    equal( count, 1 );
} );
