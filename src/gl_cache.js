
function gl_cache ( gl ) {
    
    var _gl = gl;
    var _map = Object.create( null );

    var _cache = function ( file ) {



    };

    _cache.dataset = function ( index ) {

        // Sets the currently in use dataset and returns the
        // bounds that can be used for rendering.
        // If the dataset falls outside of the shift range,
        // causes the buffer to shift left or right.

    };


    _cache.fill = function () {

        // Fill cache with data from file

    };

    _cache.left = function ( cache_left ) {

        // Defines a cache located to the left of this one

    };

    _cache.right = function ( cache_right ) {

        // Defines a cache located to the right of this one

    };

    _cache.shift_left = function () {

    };

    _cache.shift_right = function () {

    };



    return _cache;
    
}