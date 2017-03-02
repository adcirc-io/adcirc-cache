
function cache ( num_datasets ) {

    var _map = Object.create( null );
    var _data;

    var _num_datapoints;    // The number of data points per dataset
    var _num_datasets;      // The number of datasets contained in this cache

    var _cache = function ( file ) {



    };

    _cache.dataset = function () {

        // Gets the specified dataset(s) from cache.
        // If the dataset(s) fall(s) outside of the shift range,
        // causes the buffer to shift left or right.

    };

    _cache.fill = function () {

        // Fills cache with data from file

    };

    _cache.left = function ( cache_left ) {

        // Defines a cache located to the left of this one

    };

    _cache.right = function ( cache_right ) {

        // Defines a cache located to the right of this one

    };

    _cache.shift_left = function () {

    };

    _cache.shift_range = function () {

        // Defines the shift range based on the number of datasets.
        // Values are inclusive left, exclusive right, so [2, 8]
        // sets the range to be indices 2 through 7
        //
        // e.g. num_datasets = 10, shift_range = [ 2, 8 ]
        // [ . . . . . . . . . . ]  <- datasets
        // [ . . | | | | | | . . ]  <- shift range
        //
        // If any of the vertical lines are requested, they are simply
        // returned. Any outside of the ones outside will cause a shift
        // in the appropriate direction by shift_size datasets.

    };

    _cache.shift_size = function () {

        // Defines the number of datasets to shift by. Maximum
        // is the total number of datasets in the shift window.

    };

    _cache.shift_right = function () {

    };


    return _cache;

}