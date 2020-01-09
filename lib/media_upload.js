'use strict';

const fs = require('fs');

const constants = require('./constants');
const helpers = require('./helpers');

var MediaUpload = function (twitter) {
    if (!(this instanceof MediaUpload)) {
        return new MediaUpload(twitter);
      }      
    this.__twitter = twitter;
    this.__append_response = null;
    this.media_id = null;
}

MediaUpload.prototype.upload = function(params, append_response) {
    let self = this;
    return new Promise(function(resolve, reject) {
        self.__validateMedia(params);
        self.__append_response = !!append_response;
        let media_type = helpers.getMediaType(params.media_path);
        if (media_type === null) {
            let error = helpers.formatErrorResponse('Invalid media type');
            return reject(error);
        }
        let media_category;
        if (params.media_category) {
            if (constants.MEDIA_CATEGORIES.indexOf(params.media_category) === -1) {
                let error = helpers.formatErrorResponse('Invalid media_category');
                return reject(error);
            }
            media_category = params.media_category;
        }
        else if (media_type.indexOf('video') !== -1) {
            media_category = 'tweet_video';
        }
        else if (media_type.indexOf('gif') !== -1) {
            media_category = 'tweet_gif';
        }
        else {
            media_category = 'tweet_image';
        }
        let file_size = fs.statSync(params.media_path).size;
        let error;
        switch(media_category) {
            case 'tweet_image': {
                if (file_size > constants.MAX_IMAGE_SIZE) {
                    error = helpers.formatErrorResponse('Media is over size limit');
                }
                break;
            }
            case 'tweet_gif': {
                if (file_size > constants.MAX_GIF_SIZE) {
                    error = helpers.formatErrorResponse('Media is over size limit');
                }
                break;
            }
            case 'tweet_video':
            default: {
                if (file_size > constants.MAX_FILE_SIZE) {
                    error = helpers.formatErrorResponse('Media is over size limit');
                }
                break;
            }
        }
        if (error) {
            return reject(error);
        }
        self.__init(params, file_size, media_type, media_category).then(function(data) {
            self.media_id = data.media_id_string;
            return;
        }).then(function() {
            return self.__uploadChunks(params.media_path);
        }).then(function() {
            return self.__finalize();
        }).then(function(data) {
            resolve(data);
        }).catch(function(err) {
            reject(err);
        });
    });
};

MediaUpload.prototype.__init = function(params, file_size, media_type, media_category) {
    let self = this;
    return new Promise(function(resolve, reject) {
        let upload_params = {
            command: 'INIT',
            total_bytes: file_size,
            media_type: media_type,
            media_category: media_category,
            additional_owners: params.additional_owners,
            shared: !!params.is_shared
        };
        self.__twitter.post('media/upload', upload_params, self.__append_response).then(function(data) {
            resolve(data);
        }).catch(function(err) {
            resolve(err);
        });
    });
};

MediaUpload.prototype.__append = function(chunk_data, chunk_id) {
    let self = this;
    return new Promise(function(resolve, reject) {
        let upload_params = {
            command: 'APPEND',
            media_id: self.media_id,
            media: chunk_data,
            segment_index: chunk_id
        };
        self.__twitter.post('media/upload', upload_params, self.__append_response).then(function() {
            resolve();
        }).catch(function(err) {
            reject(err);
        });
    });
};

MediaUpload.prototype.__finalize = function() {
    let self = this;
    let upload_params = {
        command: 'FINALIZE',
        media_id: self.media_id
    };
    return self.__twitter.post('media/upload', upload_params, self.__append_response).then(function(data) {
        return self.__processMedia(data);
    });
};

MediaUpload.prototype.__status = function() {
    let self = this;
    return new Promise(function(resolve, reject) {
        let upload_params = {
            command: 'STATUS',
            media_id: self.media_id
        };
        self.__twitter.get('media/upload', upload_params, self.__append_response).then(function(data) {
            resolve(data);
        }).catch(function(err) {
            reject(err);
        });
    });
};

MediaUpload.prototype.__uploadChunks = function(media_path) {
    let self = this;
    return new Promise(function(resolve, reject) {
        let chunk_data;
        let chunk_id = 0;
        let is_uploading = true;
        let is_streamed = false;
        let media_data = fs.createReadStream(media_path, {
            highWaterMark: constants.UPLOAD_CHUNK_SIZE 
        });
        media_data.on('data', async function(chunk) {
            media_data.pause();
            chunk_data = chunk.toString('base64');
            is_uploading = true;
            self.__append(chunk_data, chunk_id).then(function() {
                chunk_id++;
                is_uploading = false;
                if (is_streamed && !is_uploading) {
                    return resolve();
                }
                media_data.resume();
            });
        });
        media_data.on('end', function() {
            is_streamed = true;
            if (is_streamed && !is_uploading) {
                resolve();
            }
        });
        media_data.on('error', function(err) {
            reject(err);
        });
    });
};

MediaUpload.prototype.__processMedia = function(media_data) {
    let self = this;
    let processing_info = media_data.processing_info || {};
    if (processing_info.state === 'pending' || processing_info.state === 'in_progress') {
        let check_after = media_data.processing_info.check_after_secs * 1000 || 1000;
        return new Promise(function(resolve) {
            setTimeout(resolve, check_after);
        }).then(function() {
            return self.__checkStatus();
        });
    } else if (processing_info.state === 'failed') {
        return Promise.reject(media_data);
    } else {
        return Promise.resolve(media_data);
    }
};

MediaUpload.prototype.__checkStatus = function() {
    let self = this;
    return self.__status().then(function(data) {
        return self.__processMedia(data);
    });
};

MediaUpload.prototype.__validateMedia = function(params) {
    if (typeof params !== 'object') {
        throw new Error('Media Upload parameters must be an object');
    }
    if (!params.media_path) {
        throw new Error('media_path is required');
    }
    try {
        fs.existsSync(params.media_path);
    } catch(err) {
        throw new Error('Media file does not exist');
    }
};

module.exports = MediaUpload;