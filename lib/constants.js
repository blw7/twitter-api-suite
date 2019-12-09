module.exports = {
    BASE_URL: 'https://api.twitter.com/',
    REST_API: 'https://api.twitter.com/1.1/',
    UPLOAD_API: 'https://upload.twitter.com/1.1/',
    LABS_API: 'https://api.twitter.com/labs/1/',
    OAUTH_BEARER_TOKEN: 'https://api.twitter.com/oauth2/token',
    APP_ONLY_REQUIRED_KEYS: [
        'consumer_key', 
        'consumer_secret'
    ],
    USER_AUTH_REQUIRED_KEYS: [
        'access_token', 
        'access_token_secret'
    ],
    MULTIPART_ENDPOINTS: [
        'media/upload',
        'account/update_profile_image'
    ],
    JSON_BODY_ENDPOINTS: [
        'media/metadata/create',
        'direct_messages/events/new',
        'direct_messages/welcome_messages/new',
        'direct_messages/welcome_messages/rules/new'
    ],
    API_METHODS: [
        'GET',
        'PUT',
        'POST',
        'DELETE'
    ],
    MEDIA_TYPES: {
        'mp4': 'video/mp4',
        'gif': 'image/gif',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp'
    },
    MAX_FILE_SIZE: 512 * 1024 * 1024,
    MAX_IMAGE_SIZE: 5 * 1024 * 1024,
    MAX_GIF_SIZE: 15 * 1024 * 1024,
    UPLOAD_CHUNK_SIZE: 5 * 1024 * 1024,
    MEDIA_CATEGORIES: [
        'tweet_image',
        'tweet_video',
        'tweet_gif',
        'dm_image',
        'dm_video',
        'dm_gif',
        'amplify_video',
        'subtitles'
    ]
};