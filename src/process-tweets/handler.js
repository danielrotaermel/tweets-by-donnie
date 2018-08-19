console.log('Loading function');

const bufferFrom = require('buffer-from');

module.exports.hello = (event, context, callback) => {
  // console.log(JSON.stringify(event, null, 2));
  event.Records.forEach((record) => {
    // Kinesis data is base64 encoded so decode here
    const payload = bufferFrom(record.kinesis.data, 'base64').toString('ascii');
    console.log('Decoded payload:', payload);
  });

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
