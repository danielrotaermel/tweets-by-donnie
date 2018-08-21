// const uuid = require('uuid');
const bufferFrom = require('buffer-from');

const AWS = require('aws-sdk');
const cleanDeep = require('clean-deep');
const jsonToDynamo = require('json-to-dynamo');
// const dynamodb = require('./dynamodb');

// Set the region
AWS.config.update({ region: 'us-east-1' });

// Create DynamoDB service object
const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

module.exports.preprocess = (event, context, callback) => {
  const POTUS = 822215679726100480;
  const REALDONALDTRUMP = 25073877;

  const trumpsTweets = [];
  const otherTweets = [];

  // console.log(JSON.stringify(event, null, 2));
  event.Records.forEach((record) => {
    // Kinesis data is base64 encoded so decode here
    // const payload = record.kinesis.data;
    const payload = JSON.parse(bufferFrom(record.kinesis.data, 'base64').toString('ascii'));
    console.log('Decoded payload:', JSON.stringify(payload, null, 2));

    // add primarykey ('day')
    // if ('created_at' in payload) {
    payload.day = new Date(payload.created_at).toISOString().substring(0, 10);
    // } else {
    //   payload.day = new Date()
    //     .now()
    //     .toISOString()
    //     .substring(0, 10);
    // }

    // check if it's trumps tweet
    if (payload.user.id === POTUS || payload.user.id === REALDONALDTRUMP) {
      trumpsTweets.push(createPutRequestObject(payload));
      // console.log(`here: ${process.env.TRUMPS_TWEETS_TABLE}`);
      // dynamodb.write(process.env.TRUMPS_TWEETS_TABLE, payload);
    } else {
      otherTweets.push(createPutRequestObject(payload));
      // console.log(`here: ${process.env.OTHER_TWEETS_TABLE}`);
      // dynamodb.write(process.env.OTHER_TWEETS_TABLE, payload);
    }
  });

  const params = {
    RequestItems: {},
  };

  if (trumpsTweets.length > 0) {
    params.RequestItems[process.env.TRUMPS_TWEETS_TABLE] = trumpsTweets;
  }
  if (otherTweets.length > 0) {
    params.RequestItems[process.env.OTHER_TWEETS_TABLE] = otherTweets;
  }

  console.log(params);

  ddb.batchWriteItem(params, (err, data) => {
    if (err) {
      console.log('Error', err);
    } else {
      console.log('Success', JSON.stringify(data, null, 2));
    }
  });
};

function createPutRequestObject(payload) {
  return {
    PutRequest: {
      Item: jsonToDynamo(cleanDeep(payload)),
    },
  };
}

// const res = {
//   statusCode: 200,
//   body: {
//     message: 'Go Serverless!',
//     input: event,
//   },
// };
// callback(null, res);

// process.env.PERIODIC_CLOUT_REPORTS_TABLE,
// process.env.TRUMPS_ENRICHED_TWEETS_TABLE,
// process.env.OTHER_TWEETS_TABLE,
// process.env.TRUMPS_TWEETS_TABLE,
