/*global QUnit,test,module,equal,deepEqual*/

module( "jQuery custom events" );

test( "trigger custom event", function() {
    var actualData = null,
        extraParameters = { "key": "value" };

    $( document ).bind( "custom", function( event, eventData ) {
        actualData = eventData;
    });

    $( document ).trigger( "custom", extraParameters );

    deepEqual( actualData, extraParameters );
});

test( "trigger custom event with two subscribers", function() {
    var count = 0;

    $( "body" ).bind( "custom", function( event ) {
        count++;
    });
    $( "body" ).bind( "custom", function( event ) {
        count++;
    });

    $( "body" ).trigger( "custom" );

    equal( count, 2 );
});

test( "trigger custom event with namespace", function() {
    var count = 0,
        namespaceCount = 0;

    $( "body" ).bind( "custom", function( event ) {
        count++;
    });
    $( "body" ).bind( "custom.namespace", function( event ) {
        namespaceCount++;
    });

    $( "body" ).trigger( "custom" );
    $( "body" ).trigger( "custom.namespace" );

    equal( count, 1, "bind custom only gets custom" );
    equal( namespaceCount, 2, "bind custom.namespace gets both custom and custom.namespace" );
});

test( "trigger custom event with two lateral subscribers that return false", function() {
    var count = 0;
    
    $( "body" ).bind( "custom", function( event ) {
        count++;
        return false;
    });
    $( "body" ).bind( "custom", function( event ) {
        count++;
        return false;
    });

    $( "body" ).trigger( "custom" );
    
    equal( count, 2 );
});
  
// an event handler can stop the bubbling by returning false from the handler or 
// calling the .stopPropagation() method on the event object passed into the event.
  
test( "trigger custom event with two hierarchical subscribers that return false", function() {
    var count = 0;
    
    $( "html" ).bind( "custom", function( event ) {
        count++;
    });
    $( "body" ).bind( "custom", function( event ) {
        count++;
        return false;
    });

    $( "body" ).trigger( "custom" );
    
    equal( count, 1, "event did not bubble up from body to html" );
});
  
test( "trigger custom event with two hierarchical subscribers that stopPropagation", function() {
    var count = 0;
    
    $( "html" ).bind( "custom", function( event ) {
        count++;
    });
    $( "body" ).bind( "custom", function( event ) {
        count++;
        event.stopPropagation();
    });

    $( "body" ).trigger( "custom" );
    
    equal( count, 1, "event did not bubble up from body to html" );
});
