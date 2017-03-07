
function cache ( label ) {

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

        if ( dataset_index < 0 || dataset_index >= _max_size ) {
            console.error( dataset_index + ' is outside allowable range' );
            return;
        }

        if ( dataset_index == _start_index - 1 ) {

            _cache.shift_left();
            return _data[ _index( dataset_index ) ];

        }

        if ( dataset_index == _start_index + _size ) {

            if ( _cache.shift_right() ) {
                return _data[ _index( dataset_index ) ];
            }
            return null;

            // return _valid[ _index( dataset_index ) ] ?
            //     _data[ _index( dataset_index ) ] :
            //     null;

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

    // Returns true if all data in the cache is valid, false otherwise
    _cache.is_full = function () {
        return _data &&
            _valid.map( function ( d ) { return d ? 1 : 0; } ).reduce( function ( a, b ) { return a + b; }, 0 ) == _size;
    };

    // Define the upper bound of the total available datasets
    _cache.max_size = function ( _ ) {
        if ( !arguments.length ) return _max_size;
        _max_size = _;
        return _cache;
    };

    // Prints the cached data to the console
    _cache.print = function () {
        console.log( _data );
    };

    // Define the range of data currently held by this cache.
    // If left and right caches and getters have been defined,
    // they will be used to fetch data.
    _cache.range = function ( _ ) {

        if ( !arguments.length ) return [ _start_index, _start_index + _size ];
        if ( !_is_initialized() ) {
            console.error( 'Cache not yet initialized. Set size and accessors before range' );
            return;
        }
        if ( _[1] - _[0] !== _size ) {
            console.error( 'Invalid range for cache of size ' + _size );
            return;
        }

        _start_index = _[0];

        for ( var i=_start_index; i<_start_index + _size; ++i ) {

            if ( _cache_left && i >= _cache_left.range()[0] && i < _cache_left.range()[1] ) {

                _cache.set( i, _cache_left.get( i ) );

            }

            else if ( _cache_right && i >= _cache_right.range()[0] && i < _cache_right.range()[1] ) {

                _cache.set( i, _cache_right.get( i ) );

            }

            else {

                _getter( i, _cache.set );

            }

        }

        return _cache;

    };

    // Sets the dataset at dataset_index to dataset
    _cache.set = function ( dataset_index, dataset ) {

        console.log( 'Setting ' + dataset_index + ': [' + _cache.range()[0] + ',' + _cache.range()[1] + ']' );

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
            return;
        }

        // Since we're shifting left, we'll invalidate the rightmost dataset
        _valid[ _index( _start_index + _size - 1 ) ] = false;

        // If there's a cache to the right, tell it to shift left
        // but only if it doesn't already contain the dataset we're leaving behind
        if ( _cache_right && _start_index + _size - 1 < _cache_right.range()[0] ) {
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

        }

    };

    // Causes the cache to shift right, overwriting the leftmost
    // data in the cache with the new dataset
    _cache.shift_right = function () {

        var dataset_index = _start_index + _size;

        if ( dataset_index > _max_size ) {
            return false;
        }

        // If there is a cache to the right, make sure that it has
        // the next dataset before attempting to shift
        if ( _cache_right && !_cache_right.valid( dataset_index ) ) {
            console.log( 'RIGHT CACHE DOESN\'T HAVE DATA YET' );
            return false;
        }

        // Since we're shifting we'll invalidate both ends until they
        // are loaded
        _valid[ _index( _start_index ) ] = false;
        _valid[ _index( dataset_index ) ] = false;
        _start_index = _start_index + 1;

        // If there's a cache to the left, tell it to shift right as well.
        if ( _cache_left && _start_index >= _cache_left.range()[1] ) {
            _cache_left.shift_right();
        }

        // Here we are requesting the dataset to the right
        // If there is a cache to the right, take the data from that cache.
        // If there isn't a cache to the right, load that dataset using getter
        if ( _cache_right ) {

            // Take the data from the left of the right cache
            _cache.set( dataset_index, _cache_right.take_left() );


        } else {

            // There isn't a cache to the right, so the data needs to be
            // loaded using getter, which is potentially asynchronous.
            // The getter will set the _valid value to true when data is
            // loaded.
            _getter( dataset_index, _cache.set );

        }

        return true;

    };

    // Returns the leftmost data in the cache and triggers
    // a right shift. Synchronous, will ensure leftmost data
    // is present before returning it.
    _cache.take_left = function () {

        var dataset_index = _start_index;

        // var calls = 0;

        // If the dataset is invalid, we assume that a request
        // has already been put in to load it, so we'll wait
        // while ( !_valid[ _index( dataset_index ) ] ) {

            // console.warn( label + ': Blocking...waiting for ' + dataset_index + ' from take left' );

            // if ( ++calls > 1000 ) {
            //     console.error( 'Waiting for too long' );
            //     break;
            // }

        // }

        // Keep a reference to the dataset
        var dataset = _valid[ _index( dataset_index ) ] ?
            _data[ _index( dataset_index ) ] :
            null;

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

        // var calls = 0;

        // If the dataset is invalid, we assume that a request
        // has already been put in to load it, so we'll wait
        while( !_valid[ _index( dataset_index ) ] ) {

            console.warn( label + ': Blocking...waiting for ' + dataset_index + ' from take right' );

            // if ( ++calls > 1000 ) {
            //     console.error( 'Waited too long' );
            //     break;
            // }

        }

        // Keep a reference to the dataset
        var dataset = _data[ _index( dataset_index ) ];

        // Trigger a left shift
        _cache.shift_left();

        // Return the dataset
        return dataset;

    };

    // Returns whether the dataset at that index is actually
    // loaded into the cache yet.
    _cache.valid = function ( dataset_index ) {
        return _valid[ _index( dataset_index ) ];
    };


    // Default transform
    _transform = function ( index, dataset ) {
        return dataset;
    };

    // No default getter
    _getter = function () {
        console.error( 'A getter has not been defined for this cache.' );
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

// export { cache }