
function cache () {

    var _cache = Object.create( null );
    var _cache_left;
    var _cache_right;

    var _max_size;
    var _size;

    var _getter;
    var _transform;

    var _data;
    var _valid;
    var _start_index;


    // Define the cache located to the left of this cache
    _cache.cache_left = function ( _ ) {
        if ( !arguments.length ) return _cache_left;
        _cache_left = _;
        return _cache;
    };

    // Define the cache located to the right of this cache
    _cache.cache_right = function ( _ ) {
        if ( !arguments.length ) return _cache_right;
        _cache_right = _;
        return _cache;
    };

    // Synchronous function guaranteed to return loaded
    // dataset.
    _cache.get = function ( dataset_index ) {

        if ( !_is_initialized() ) {
            console.error( 'Cache has not been properly initialized' );
            return;
        }

        if ( dataset_index >= _start_index && dataset_index < _start_index + _size ) {

            if ( !_valid[ _index( dataset_index ) ] ) {

                console.error( 'Invalid data in buffer.' );
                return;

            }

            return _data[ _index( dataset_index ) ];

        }

        if ( dataset_index < 0 || dataset_index >= _start_index + _size ) {
            console.error( dataset_index + ' is outside allowable range' );
            return;
        }

        if ( dataset_index == _start_index - 1 ) {

            _cache.shift_left();
            return _data[ _index( dataset_index ) ];

        }

        if ( dataset_index == _start_index + _size ) {

            _cache.shift_right();
            return _data[ _index( dataset_index ) ];

        }

        console.error( 'Jumps not yet supported. Coming soon...' );

    };

    // Defines the asynchronous function that can
    // be used to load data. The getter function is passed
    // the dataset index to get, and the cache.set function
    // as a callback that accepts the dataset index and
    // the data.
    _cache.getter = function ( _ ) {
        if ( !arguments.length ) return _getter;
        if ( typeof _ === 'function' ) _getter = _;
        else console.error( 'Getter must be a function' );
        return _cache;
    };

    // Define the upper bound of the total available datasets
    _cache.max_size = function ( _ ) {
        if ( !arguments.length ) return _max_size;
        _max_size = _;
        return _cache;
    };

    // Sets the dataset at dataset_index to dataset
    _cache.set = function ( dataset_index, dataset ) {

        if ( dataset_index >= _start_index && dataset_index < _start_index + _size ) {

            _data[ _index( dataset_index ) ] = _transform( _index( dataset_index), dataset );
            _valid[ _index( dataset_index ) ] = true;

        } else {

            console.warn( 'Dataset ' + dataset_index + ' does not fall into ' +
                'the cache range' );

        }

    };

    // Define the maximum number of datasets allowed in the cache
    _cache.size = function ( _ ) {
        if ( !arguments.length ) return _size;
        _size = _;
        if ( _data ) console.warn( 'Warning: Resizing cache, all data will be lost' );
        _data = new Array( _size );
        _valid = new Array( _size ).fill( false );
        return _cache;
    };

    // Sets the transform that the data is passed through before storage
    _cache.transform = function ( _ ) {
        if ( !arguments.length ) return _transform;
        if ( typeof _ === 'function' ) _transform = _;
        return _cache;
    };

    // Causes the cache to shift left, taking from a left cache
    // if one is defined, or loading a new dataset if one is not
    _cache.shift_left = function () {

        var dataset_index = _start_index - 1;

        if ( dataset_index < 0 ) {
            console.error( dataset_index + ' is outside allowable range' );
            return;
        }

        // Since we're shifting left, we'll invalidate the rightmost dataset
        _valid[ _index( _start_index + _size - 1 ) ] = false;

        // If there's a cache to the right, tell it to shift left as well.
        if ( _cache_right ) {
            _cache_right.shift_left();
        }

        // Here we are requesting the dataset to the left
        // If there is a cache to the left, take the data from that cache.
        // If there isn't a cache to the left, load that dataset using getter
        if ( _cache_left ) {

            // Set the data
            _start_index = dataset_index;
            _cache.set( dataset_index, _cache_left.take_right() );


        } else {

            // There isn't a cache to the left, so the data needs to be
            // loaded using getter, which is potentially asynchronous.
            // The getter will set the _valid value to true when data is
            // loaded.
            _start_index = dataset_index;
            _getter( dataset_index, _cache.set );

            while ( !_valid[ _index( dataset_index ) ] ) {

                console.warn( 'Blocking...' );

            }

        }

    };

    // Causes the cache to shift right, overwriting the leftmost
    // data in the cache with the new dataset
    _cache.shift_right = function () {

        var dataset_index = _start_index + _size;

        if ( dataset_index > _max_size ) {
            console.error( dataset_index + ' is outside allowable range' );
            return;
        }

        // Since we're shifting right, we'll invalidate the leftmost dataset
        _valid[ _index( _start_index ) ] = false;

        // If there's a cache to the left, tell it to shift left as well.
        if ( _cache_left ) {
            _cache_left.shift_right();
        }

        // Here we are requesting the dataset to the right
        // If there is a cache to the right, take the data from that cache.
        // If there isn't a cache to the left, load that dataset using getter
        if ( _cache_left ) {

            // Set the data
            _start_index = dataset_index;
            _cache.set( dataset_index, _cache_left.take_left() );


        } else {

            // There isn't a cache to the right, so the data needs to be
            // loaded using getter, which is potentially asynchronous.
            // The getter will set the _valid value to true when data is
            // loaded.
            _start_index = dataset_index;
            _getter( dataset_index, _cache.set );

            while ( !_valid[ _index( dataset_index ) ] ) {

                console.warn( 'Blocking...' );

            }

        }

    };

    // Returns the leftmost data in the cache and triggers
    // a right shift. Synchronous, will ensure leftmost data
    // is present before returning it.
    _cache.take_left = function () {

        var dataset_index = _start_index;

        // If the dataset is invalid, we assume that a request
        // has already been put in to load it, so we'll wait
        while ( !_valid[ _index( dataset_index ) ] ) {

            console.warn( 'Blocking...' );

        }

        // Keep a reference to the dataset
        var dataset = _data[ _index( dataset_index ) ];

        // Trigger a right shift
        _cache.shift_right();

        // Return the dataset
        return dataset;

    };

    // Returns the rightmost data in the cache and triggers
    // a left shift. Synchronous, will ensure rightmost data
    // is present before returning it.
    _cache.take_right = function () {

        var dataset_index = _start_index + _size - 1;

        // If the dataset is invalid, we assume that a request
        // has already been put in to load it, so we'll wait
        while( !_valid[ _index( dataset_index ) ] ) {

            console.log( 'Blocking...' );

        }

        // Keep a reference to the dataset
        var dataset = _data[ _index( dataset_index ) ];

        // Trigger a left shift
        _cache.shift_left();

        // Return the dataset
        return dataset;

    };


    // Default transform
    _transform = function ( index, dataset ) {
        return dataset;
    };

    return _cache;

    function _index ( dataset_index ) {

        return dataset_index % _size;

    }

    function _is_initialized () {

        if ( typeof _size === 'undefined' || typeof _max_size === 'undefined' ) {
            console.error( 'Cache sizes not defined' );
            return false;
        }

        if (
            (
                typeof _cache_left === 'undefined' ||
                typeof _cache_right === 'undefined'
            ) &&
            typeof _getter === 'undefined'
        ) {
            console.error( 'A getter must be defined if cache is not bounded by other caches' );
            return false;
        }

        return true;

    }

}

export { cache }