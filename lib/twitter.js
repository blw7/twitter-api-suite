'use strict';

const request = require('request');

const constants = require('./constants');
const helpers = require('./helpers');
const MediaUpload = require('./media_upload');

var Twitter = function (auth_options) {
    if (!(this instanceof Twitter)) {
        return new Twitter(auth_options);
      }
    this.__validateAuthOptions(auth_options);
    this.auth = auth_options;
};

Twitter.prototype.get = function(endpoint, params, append_response) {
    let self = this;
    return new Promise(function(resolve, reject) {
        self.call('GET', endpoint, params, append_response).then(function(data) {
            return resolve(data);
        }).catch(function(err) {
            return reject(err);
        });
    });
};

Twitter.prototype.post = function(endpoint, params, append_response) {
    let self = this;
    return new Promise(function(resolve, reject) {
        self.call('POST', endpoint, params, append_response).then(function(data) {
            return resolve(data);
        }).catch(function(err) {
            return reject(err);
        });
    });
};

Twitter.prototype.put = function(endpoint, params, append_response) {
    let self = this;
    return new Promise(function(resolve, reject) {
        self.call('PUT', endpoint, params, append_response).then(function(data) {
            return resolve(data);
        }).catch(function(err) {
            return reject(err);
        });
    });
};

Twitter.prototype.del = function(endpoint, params, append_response) {
    let self = this;
    return new Promise(function(resolve, reject) {
        self.call('DELETE', endpoint, params, append_response).then(function(data) {
            return resolve(data);
        }).catch(function(err) {
            return reject(err);
        });
    });
};

Twitter.prototype.call = function(method, endpoint, params, append_response) {
    if (constants.API_METHODS.indexOf(method.toUpperCase()) === -1) {
        throw new Error('Invalid HTTP method');
    }
    let self = this;
    return new Promise(async function(resolve, reject) {
        let options = await self.__buildOptions(method, endpoint, params);
        self.__request(options, append_response).then(function(data) {
            return resolve(data);
        }).catch(function(data) {
            return reject(data);
        });
    });
};

Twitter.prototype.upload = function(params, append_response) {
    let self = this;
    return new Promise(function(resolve, reject) {
        let media_upload = new MediaUpload(self);
        media_upload.upload(params, append_response).then(function(data) {
            return resolve(data);
        }).catch(function(err) {
            return reject(err);
        });
    });
};

Twitter.prototype.__buildOptions = async function(method, endpoint, params) {
    let options = {
        headers: {
            'Accept': '*/*',
            'User-Agent': 'twitter-api-suite'
        },
        method: method,
        gzip: true
    };
    let req_params = JSON.parse(JSON.stringify(params)) || {};
    if (Object.keys(req_params).length !== 0) {
        endpoint = helpers.replaceEndpointParams(endpoint, req_params);
    }
    req_params = helpers.normalize(req_params);
    if (endpoint.match(/^https?:\/\//g)) {
        options.url = endpoint;
    }
    else {
        if (endpoint.indexOf('media') !== -1) {
            options.url = constants.UPLOAD_API + endpoint + '.json';
        }
        else if (endpoint.indexOf('labs') !== -1) {
            options.url = constants.BASE_URL + endpoint;
        }
        else {
            options.url = constants.REST_API + endpoint + '.json';
        }
        if (constants.JSON_BODY_ENDPOINTS.indexOf(endpoint) !== -1) {
            options.headers['Content-Type'] = 'application/json';
            options.body = req_params;
            options.json = true;
            req_params = {};
        }
        else if (constants.MULTIPART_ENDPOINTS.indexOf(endpoint) !== -1 && options.method.toLowerCase() !== 'get') {
            options.headers['Content-Type'] = 'multipart/form-data';
            options.form = req_params;
            req_params = {};
        }
        else {
            options.headers['Content-type'] = 'application/json';
        }
        if (Object.keys(req_params).length) {
            let qs = helpers.getQueryString(req_params);
            options.url += '?' + qs;
        }
    }
    if (this.auth.app_only) {
        await helpers.getBearerToken(this.auth).then(function(bearer) {
            options.headers['Authorization'] = 'Bearer ' + bearer;
        }).catch(function(err) {
            throw new Error(err);
        });
    }
    else {
        let ts = Math.floor(Date.now()/1000).toString();
        options.oauth = {
            consumer_key: this.auth.consumer_key,
            consumer_secret: this.auth.consumer_secret,
            token: this.auth.access_token,
            token_secret: this.auth.access_token_secret,
            timestamp: ts
        };
    }
    return options;
};

Twitter.prototype.__request = function(options, append_response) {
    return new Promise(function(resolve, reject) {
        request(options, function(err, resp, body) {
            append_response = !!append_response;
            if (err) {
                let error = helpers.formatErrorResponse(err.toString(), resp);
                if (append_response) {
                    error._response = resp;
                }
                return reject(error);
            }
            if (body && typeof body !== 'object' && body.length !== 0) {
                try {
                    body = JSON.parse(body);
                }
                catch(e) {
                    let error = helpers.formatErrorResponse(body, resp);
                    if (append_response) {
                        error._response = resp;
                    }
                    return reject(error);
                }
            }
            if (typeof body === 'object' && (body.error || body.errors) || resp.statusCode.toString().charAt(0) !== '2') {
                let error = helpers.formatBodyError(body, resp);
                if (append_response) {
                    error._response = resp;
                }
                return reject(error);
            }
            if (append_response) {
                if (typeof body === 'object') {
                    body._response = resp;
                }
                else {
                    body = {
                        _response: resp
                    };
                }
            }
            return resolve(body);
        });
    });
};

Twitter.prototype.__validateAuthOptions = function(auth_options) {
    if (typeof auth_options !== 'object') {
        throw new Error('Authentication options must be an object');
    }
    let required_properties = constants.APP_ONLY_REQUIRED_KEYS;
    if (!auth_options.app_only) {
        required_properties.concat(constants.USER_AUTH_REQUIRED_KEYS);
    }
    for (let required_property of required_properties) {
        if (!auth_options[required_property]) {
            throw new Error('Missing required property ' + required_property);
        }
    }
};

module.exports = Twitter;