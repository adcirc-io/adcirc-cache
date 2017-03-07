// https://github.com/atdyer/adcirc-cache Version 1.0.0. Copyright 2017 Tristan Dyer.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.adcirc = global.adcirc || {})));
}(this, (function (exports) { 'use strict';

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

        if ( dataset_index < 0 || dataset_index >= _max_size ) {
            console.error( dataset_index + ' is outside allowable range' );
            return;
        }

        if ( dataset_index == _start_index - 1 ) {

            if ( _cache.shift_left() ) {
                return _data[ _index( dataset_index ) ];
            }

            return;

        }

        if ( dataset_index == _start_index + _size ) {

            if ( _cache.shift_right() ) {
                return _data[ _index( dataset_index ) ];
            }

            return;

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

        var data;
        var dataset_index = _start_index - 1;

        if ( dataset_index < 0 ) {
            return false;
        }

        // If there's a cache to the left, we need to make sure that
        // it can be taken from before we attempt to shift.
        if ( _cache_left ) {

            // Take the rightmost dataset from the left cache
            data = _cache_left.take_right();

            // Determine if it successfully started shifting
            if ( typeof data === 'undefined' ) return false;

        }

        // If there's a cache to the right, tell it to shift left
        // if needed
        if ( _cache_right && _start_index + _size - 1 < _cache_right.range()[0] ) {
            _cache_right.shift_left();
        }

        // Now perform the shift and invalidate the new data
        _start_index = dataset_index;
        _valid[ _index( _start_index ) ] = false;

        // If there is a left cache, we've got its data. Otherwise
        // we need to load the data asynchronously
        if ( _cache_left )
            _cache.set( dataset_index, data );
        else
            _getter( dataset_index, _cache.set );

        return true;

    };

    // Causes the cache to shift right, overwriting the leftmost
    // data in the cache with the new dataset
    _cache.shift_right = function () {

        // Calculate the index of the dataset immediately to the right
        var data;
        var dataset_index = _start_index + _size;

        // Stop shifting if there isn't one
        if ( dataset_index > _max_size ) {
            return false;
        }

        // If there's a cache to the right, we need to make sure that
        // it can be taken from before we attempt to shift.
        if ( _cache_right ) {

            // Take the leftmost dataset from the right cache
            data = _cache_right.take_left();

            // Determine if it successfully started shifting
            if ( typeof data === 'undefined' ) return false;

        }

        // If there's a cache to the left, tell it to shift right
        // if needed
        if ( _cache_left && _start_index >= _cache_left.range()[1] ) {
            _cache_left.shift_right();
        }

        // Now perform the shift and invalidate the new data
        _start_index = _start_index + 1;
        _valid[ _index( dataset_index ) ] = false;

        // If there is a right cache, we've got its data. Otherwise
        // we need to load the data asynchronously
        if ( _cache_right )
            _cache.set( dataset_index, data );
        else
            _getter( dataset_index, _cache.set );

        return true;

    };

    // Returns the leftmost data in the cache and triggers
    // a right shift. Synchronous, will ensure leftmost data
    // is present before returning it.
    _cache.take_left = function () {

        var dataset;
        var dataset_index = _start_index;

        if ( _valid[ _index( dataset_index ) ] ) {

            // Keep a reference to the dataset
            dataset = _data[ _index( dataset_index ) ];

            // Trigger a right shift
            _cache.shift_right();

        }

        return dataset;

    };

    // Returns the rightmost data in the cache and triggers
    // a left shift. Synchronous, will ensure rightmost data
    // is present before returning it.
    _cache.take_right = function () {

        // Only allow the data to be taken if it is valid
        var dataset;
        var dataset_index = _start_index + _size - 1;

        if ( _valid[ _index( dataset_index ) ] ) {

            // Keep a reference to the dataset
            dataset = _data[ _index( dataset_index ) ];

            // Trigger a left shift
            _cache.shift_left();

        }

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

exports.cache = cache;

Object.defineProperty(exports, '__esModule', { value: true });

})));
