const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.getEnrichedTweets = (event, context, callback) => {
  const date = event.pathParameters.day;

  if (!isValidDay(date)) {
    const response = {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: `${date} non-valid day parameter - use a date like this one 2018-08-22`,
    };

    callback(null, addCors(response));
  }

  const params = {
    TableName: process.env.TRUMPS_ENRICHED_TWEETS_TABLE,
    KeyConditionExpression: '#d = :day',
    ExpressionAttributeNames: {
      '#d': 'day',
    },
    ExpressionAttributeValues: {
      ':day': date,
    },
    // Limit: 1,
  };

  // fetch enriched tweets from the database
  dynamoDb
    .query(params)
    .promise()
    .then((res) => {
      console.log(`Query succeeded, got ${res.Items.length} items`);
      // create a response
      const response = {
        statusCode: 200,
        body: JSON.stringify(res),
      };
      callback(null, addCors(response));
    })
    .catch((err) => {
      console.error('Unable to query. Error:', JSON.stringify(err, null, 2));
      console.error(err);
      const response = {
        statusCode: err.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: "Couldn't fetch the item.",
      };
      callback(null, addCors(response));
    });
};

module.exports.getReports = (event, context, callback) => {
  const date = event.pathParameters.day;

  if (!isValidDay(date)) {
    const response = {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: `${date} non-valid day parameter - use a date like this one 2018-08-22`,
    };
    callback(null, addCors(response));
  }

  const params = {
    TableName: process.env.PERIODIC_CLOUT_REPORTS_TABLE,
    KeyConditionExpression: '#d = :day',
    ExpressionAttributeNames: {
      '#d': 'day',
    },
    ExpressionAttributeValues: {
      ':day': date,
    },
    // Limit: 20,
    // ScanIndexForward: false
  };

  // fetch enriched tweets from the database
  dynamoDb
    .query(params)
    .promise()
    .then((res) => {
      console.log(`Query succeeded, got ${res.Items.length} items`);
      // delete unneeded sentence_stone
      res.Items = res.Items.map((item) => {
        const newItem = item;
        delete newItem.sentences_tone;
        return newItem;
      });
      // create a response
      const response = {
        statusCode: 200,
        body: JSON.stringify(res),
      };
      callback(null, addCors(response));
    })
    .catch((err) => {
      console.error('Unable to query. Error:', JSON.stringify(err, null, 2));
      const response = {
        statusCode: err.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: "Couldn't fetch the item.",
      };
      callback(null, addCors(response));
    });
};

function isValidDay(day) {
  let date;
  try {
    date = new Date(day);
  } catch (err) {
    console.log(err);
  }
  if (date !== null && day.length === 10 && date.toISOString().substring(0, 10) === day) {
    return true;
  }
  return false;
}

function addCors(response) {
  // HERE'S THE CRITICAL PART
  if (response.headers) {
    response.headers['Access-Control-Allow-Origin'] = '*'; // Required for CORS support to work
  } else {
    response.headers = { 'Access-Control-Allow-Origin': '*' };
  }
  return response;
}

// process.env.PERIODIC_CLOUT_REPORTS_TABLE,
// process.env.TRUMPS_ENRICHED_TWEETS_TABLE,
// process.env.OTHER_TWEETS_TABLE,
// process.env.TRUMPS_TWEETS_TABLE,
