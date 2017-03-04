/**
 * @author mrdoob / http://mrdoob.com/
 * @author atdyer / https://github.com/atdyer
 */

function make_event_dispatcher ( object ) {

    object.addEventListener = function ( type, listener ) {

        if ( object._listeners === undefined ) object._listeners = {};

        var listeners = object._listeners;

        if ( listeners[ type ] === undefined ) {

            listeners[ type ] = [];

        }

        if ( listeners[ type ].indexOf( listener ) === - 1 ) {

            listeners[ type ].push( listener );

        }

        return object;

    };

    object.hasEventListener = function ( type, listener ) {

        if ( object._listeners === undefined ) return false;

        var listeners = object._listeners;

        return ( listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== -1 );

    };

    object.removeEventListener = function ( type, listener ) {

        if ( object._listeners === undefined ) return;

        var listeners = object._listeners;
        var listenerArray = listeners[ type ];

        if ( listenerArray !== undefined ) {

            var index = listenerArray.indexOf( listener );

            if ( index !== - 1 ) {

                listenerArray.splice( index, 1 );

            }

        }

        return object;

    };

    object.dispatchEvent = function ( event ) {

        if ( object._listeners === undefined ) return;

        var listeners = object._listeners;
        var listenerArray = listeners[ event.type ];

        if ( listenerArray !== undefined ) {

            event.target = object;

            var array = [], i = 0;
            var length = listenerArray.length;

            for ( i = 0; i < length; i ++ ) {

                array[ i ] = listenerArray[ i ];

            }

            for ( i = 0; i < length; i ++ ) {

                array[ i ].call( object, event );

            }

        }

        return object;

    };

    return object;

}


export { make_event_dispatcher }