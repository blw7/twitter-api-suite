# twitter-api-suite

Twitter API client for Node.js.

This library provides convenient access to the Twitter API from applications written in Node.js.
It **only supports the REST API** at this moment. Support for Streaming, Enterprise and Ads APIs will be added soon.


## Documentation

Read the [official Twitter documentation](https://developer.twitter.com/en/docs) to learn more about API endpoints.


## Installation

```javascript
npm install twitter-api-suite --save
```

## Usage

### Initialize with config object

The package needs to be configured with OAuth tokens.
You need a Twitter developer account to create apps and generate tokens.
[Apply here](https://developer.twitter.com/en/apply-for-access) if you don't have one yet.

```javascript
const Twitter = require('twitter-api-suite');

const twitter = new Twitter({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});
```

Or, when configuring the package with an application-only context:

```javascript
const Twitter = require('twitter-api-suite');

const twitter = new Twitter({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    app_only: true
});
```

## Methods

### Parameters

**endpoint**

API endpoint to call. For instance `users/show`. List of all endpoints can be found [here](https://developer.twitter.com/en/docs/api-reference-index).



**params** (optional)

Parameters to pass to the request.



**append_response** (optional)

Boolean, default to `false`. If set to `true`, data returned in Promises has an additional **`_response`** property corresponding to the raw HTTP response received from Twitter.



### `twitter.get(endpoint, [params], [append_response])`

### `twitter.post(endpoint, [params], [append_response])`

### `twitter.put(endpoint, [params], [append_response])`

### `twitter.del(endpoint, [params], [append_response])`

### `twitter.upload(params, [append_response])`

## Contributing

Contributions for new features, enhancements and bug fixes are welcome. When contributing to this repository, please first discuss the change you wish to make via issue or email before you submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## Authors

* **Benoit Lewandowski** - [@b_lw](https://twitter.com/b_lw)

See also the list of [contributors](https://github.com/blw7/twitter-api-suite/contributors) who participated in this project.