
var gl_buffer_size = 100;
var size = 40;
var current;
var left_worker = new Worker( './test_worker.js' );
var right_worker = new Worker( './test_worker.js' );

var left = cache( ' left' )
    .size( 10 )
    .max_size( size )
    .getter( left_load_dataset )
    .range( [0, 10] );

var right = cache( 'right' )
    .size( 10 )
    .max_size( size )
    .getter( right_load_dataset )
    .range( [10, 20] );

var gl_cache = cache( '   gl' )
    .size( 10 )
    .max_size( size )
    .cache_left( left )
    .cache_right( right )
    .transform( gl_transform );

setTimeout( function () {
    left.print();
    right.print();
    gl_cache.range( [0, 10] )
        .print();
    current = 0;
}, 1000 );



left_worker.addEventListener( 'message', function ( message ) {

    message = message.data;
    left.set( message.dataset, message.value );

});

right_worker.addEventListener( 'message', function ( message ) {

    message = message.data;
    right.set( message.dataset, message.value );

});

function left_load_dataset ( dataset_id ) {

    left_worker.postMessage({
        dataset: dataset_id
    });

    // var random_load_time = Math.random() * 500;
    //
    // setTimeout( function () {
    //
    //     callback( dataset_id, dataset_id );
    //
    // }, random_load_time);

}

function right_load_dataset ( dataset_id ) {

    right_worker.postMessage({
        dataset: dataset_id
    });
}

function gl_transform ( index, dataset ) {

    var start_index = gl_buffer_size * index;
    var end_index = start_index + gl_buffer_size;

    // Transfer the data buffer to gl here.

    return [ start_index, end_index ];

}


// Rendering stuff
var data = [];
for ( var i=0; i<size; ++i ) {
    data.push( i );
}
var bars = d3.select( '#bar' ).append( 'div' )
    .attr( 'class', 'bar-section' )
    .selectAll( '.bar' )
    .data( data )
    .enter()
    .append( 'div' )
    .attr( 'class', 'bar' );

function update () {

    var left_range = left.range();
    var mid_range = gl_cache.range();
    var right_range = right.range();

    bars.each( function ( d, i ) {

        var dat = d3.select( this )
            .text( d );

        if ( in_range( i, left_range ) ) {
            if ( !left.valid( i ) ) {
                dat.style( 'background-color', 'lightsalmon' );
            } else {
                dat.style('background-color', 'lightsteelblue');
            }
        }

        if ( in_range( i, right_range ) ) {
            if ( !right.valid( i ) ) {
                dat.style( 'background-color', 'lightsalmon' );
            } else {
                dat.style('background-color', 'lightsteelblue');
            }
        }

        if ( in_range( i, mid_range ) ) {
            if ( !gl_cache.valid( i ) ) {
                dat.style( 'background-color', 'orangered' );
            } else {
                dat.style('background-color', 'steelblue');
            }
        }

        if ( typeof current !== 'undefined' ) {
            if ( i == current ) {
                dat.classed('active', true);
            } else {
                dat.classed('active', false);
            }
        }

    });

    window.requestAnimationFrame( update );

}

function in_range ( i, range ) {
    return i >= range[0] && i < range[1];
}

function move_right () {
    set_current( current + 1 );
}

function move_left () {
    set_current( current - 1 );
}

function set_current ( index ) {

    console.log( 'Requesting ' + index );
    var data = gl_cache.get( index );

    if ( data ) {
        console.log( data );
        current = index;
        console.log('GL buffer range [' + data[ 0 ] + ', ' + data[ 1 ] + '] contains data from dataset ' + index);
    }

}

d3.select( 'body' ).on( 'keydown', function () {
    switch ( d3.event.key ) {
        case 'ArrowRight':
            move_right();
            break;
        case 'ArrowLeft':
            move_left();
            break;
    }
});

window.requestAnimationFrame( update );