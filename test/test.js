var dataset_size = 50;
var cache_size = 30;


var bar = d3.select( '#bar' )
    .append( 'div' )
    .attr( 'class', 'bar-section' );
var bars;

var cache = adcirc
    .cache( cache_size, dataset_size, dummy, false )
    .addEventListener( 'debug', display_cache )
    .padding_left( 5 )
    .padding_right( 5 )
    .shift_size( 5 );

var gl_cache = adcirc
    .gl_cached_buffer( 0, 0, cache, 30, 5 )
    .addEventListener( 'debug', display_cache )
    .padding_left( 5 )
    .padding_right( 5 )
    .shift_size( 1 );


var current = 0;

d3.select( '#move-left' ).on( 'click', move_left );
d3.select( '#move-right' ).on( 'click', move_right );
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


function move_right () {
    if ( current+1 < dataset_size )
        gl_cache.current( ++current );
}

function move_left () {
    if ( current-1 >= 0 )
        gl_cache.current( --current );
}

function display_cache ( e ) {

    if ( e.from == 'cache' ) {

        bars = display_data(e.data_range);

        color_cache( bars, e.cache_range );
        color_padding( bars, e.padding );
        color_current( bars, e.current );

    }

    if ( e.from == 'gl' ) {

        var gl_bars = color_gl( bars, e.cache_range );
        color_gl_padding( gl_bars, e.padding );
        color_current( bars, e.current );

    }

}

function color_gl ( selection, range ) {

    selection.each( function ( d ) {
        if ( in_range( d, range ) ) {
            d3.select( this )
                .classed( 'special', true )
                .style( 'background-color', 'steelblue' );
        } else {
            d3.select( this )
                .classed( 'special', false );
        }
    });

    return selection.filter( '.special' );

}

function color_gl_padding ( selection, range ) {

    selection.each( function ( d ) {

        if ( d !== range[0] || range[1] )
            d3.select( this ).classed( 'special-border-left', false ).classed( 'special-border-right', false );
        if ( d == range[0] )
            d3.select( this ).classed( 'special-border-left', true );
        if ( d == range[1] )
            d3.select( this ).classed( 'special-border-right', true );

    })

}

function color_cache ( selection, range ) {

    selection.each( function ( d ) {

        if ( in_range( d, range ) ) {
            d3.select( this )
                .style( 'background-color', 'lightsteelblue' );
        }

    });

}

function color_padding ( selection, range ) {

    selection.each( function ( d ) {

        if ( d !== range[0] || range[1] )
            d3.select( this ).classed( 'border-left', false ).classed( 'border-right', false );
        if ( d == range[0] )
            d3.select( this ).classed( 'border-left', true );
        if ( d == range[1] )
            d3.select( this ).classed( 'border-right', true );

    });

}

function color_current ( selection, current ) {

    selection.each( function ( d ) {

        if ( d == current )
            d3.select( this ).classed( 'active', true );
        else
            d3.select( this ).classed( 'active', false );

    })

}

function display_data ( range ) {

    var data = [];
    for ( var i=range[0]; i<range[1]; ++i ) {
        data.push( i );
    }

    var select = bar.selectAll( '.bar' )
        .data( data );

    select.exit()
        .remove();

    select = select.enter()
        .append( 'div' )
        .attr( 'class', 'bar' )
        .merge( select );

    select
        .text( function ( d ) { return d; } )
        .style( 'background-color', 'lightgoldenrodyellow' );

    return select;

}

function in_range ( d, range ) {
    return d >= range[0] && d < range[1];
}

function render () {

    var num_data_points = 27;
    var cache_names = [ 'cache', 'gl-cache', 'cache' ];
    var cache_bounds = [ [0, 9], [9, 18], [18, 27] ];
    var cache_colors = [ 'lightsteelblue', 'steelblue', 'lightsteelblue' ];
    var cache_active = [ 11, 16 ];
    var current = 13;

    var data = [];
    for ( var i=0; i<num_data_points; ++i ) {
        data.push( i );
    }
    var bar = d3.select( '#bar' );

    bar.selectAll( '.bar-section' )
        .data( cache_names )
        .enter()
        .append( 'div' )
        .attr( 'class', 'bar-section' )
        .each( function ( d, i ) {
            d3.select( this )
                .selectAll( '.bar' )
                .data( data.slice( cache_bounds[i][0], cache_bounds[i][1] ) )
                .enter()
                .append( 'div' )
                .attr( 'class', 'bar' )
                .text( function ( d ) { return d; } )
                .style( 'background-color', cache_colors[i] );
        });

    bar.selectAll( '.bar' )
        .filter( function ( d ) { return d >= cache_active[0] && d < cache_active[1] } )
        .classed( 'special', true );

    bar.selectAll( '.bar' )
        .filter( function ( d ) { return d == current; })
        .classed( 'active', true );

    bar.selectAll( '.bar' )
        .on( 'click', function ( d ) {
            d3.selectAll( '.bar.active' )
                .classed( 'active', false );
            d3.select( this )
                .classed( 'active', true );
        });

}
//
// var cache_async = adcirc
//     .cache( 5, 10, dummy_async, true )
//     .shift_size( 3 );
//
//
// console.log( 'Fill caches' );
// cache
//     .fill( [0, 5] )
//     .print( ' sync' );
//
// cache_async
//     .fill( [0, 5] )
//     .print( 'async' );
//
// console.log( 'Shift right' );
// cache
//     .shift_right()
//     .print( ' sync' );
//
// cache_async
//     .shift_right()
//     .print( 'async' );
//
//

function get_data ( range, set ) {

    for ( var i=range[0]; i<range[1]; ++i ) {

        (function ( ts ) {

            d3.timeout( function () { set( ts, ts ); }, 500*Math.random() );

        })( i );

    }

}

get_data( [0, 5], function ( ts, data ) { console.log( ts, data ); } );

function dummy ( range ) {
    var data = [];
    for ( var i=range[0]; i<range[1]; ++i ) {
        data.push( i );
    }
    return data;
}

function dummy_async ( range ) {
    for ( var i=range[0]; i<range[1]; ++i ) {
        cache_async.set( i, i );
    }
}