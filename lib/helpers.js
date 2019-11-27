'use strict';

const querystring = require('querystring');
const request = require('request');

const constants = require('./constants');

module.exports.replaceEndpointParams = function(endpoint, params) {
    endpoint = endpoint.replace(/\/:(\w+)/g, function(match) {
         let param = match.slice(2);
        if (!params[param]) {
            throw new Error('Missing required parameter ' + param);
        }
        let url_param = '/' + params[param];
        delete params[param];
        return url_param;
      });
      return endpoint;
};

module.exports.normalize = function(params) {
    let normalized_params = params || {};
    if (params && typeof params === 'object') {
        let keys = Object.keys(params);
        for (let key of keys) {
            let value = params[key];
            if (Array.isArray(value)) {
                normalized_params[key] = value.join(',');
            }
        }
    }
    return normalized_params;
};

module.exports.getQueryString = function(params) {
    return querystring.stringify(params).replace(/[!'()*]/g, function(character) {
        return '%' + character.charCodeAt(0).toString(16);
    });
};

module.exports.getBearerToken = function(auth_options) {
    return new Promise(function(resolve, reject) {
        let credentials = new Buffer(auth_options.consumer_key + ':' + auth_options.consumer_secret).toString('base64');
        let req_options = {
            headers: {
                'Authorization': 'Basic ' + credentials,
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            json: true,
            url: constants.OAUTH_BEARER_TOKEN,
            body: 'grant_type=client_credentials'
        };
        request.post(req_options, function(err, resp, body) {
            if (err) {
                return reject(body);
            }
            return resolve(body);
        });
    });
};

module.exports.getMediaType = function(media_path) {
    let ext = media_path.replace(/^.*[/\\]/g, '').replace(/^.*\./g, '').toLowerCase();
    let media_type = constants.MEDIA_TYPES[ext];
    if (media_type) {
        return media_type;
    }
    return null;    
};

module.exports.formatErrorResponse = function(message, resp, append_payload) {
    let err = {
        errors: [],
        status_code: (resp && resp.statusCode) ? resp.statusCode : null,
        code: null,
        message: message
    };
    if (resp && append_payload) {
        err._payload = resp;
    }
    return err;
};

module.exports.formatBodyError = function(body, resp) {
    let err = {
        errors: [],
        status_code: (resp && resp.statusCode) ? resp.statusCode : null ,
        code: null,
        message: null
    }
    if (typeof body !== 'object') {
        err.message = body;
    }
    else if (body.error && typeof body.error !== 'object') {
        err.message = body.error;
    }
    else {
        err.errors = body.error ? [body.error] : body.errors;
        err.code = body.error ? body.error.code : body.errors[0].code;
        err.message = body.error ? body.error.message : body.errors[0].message;
    }
    return err;
};