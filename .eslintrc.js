module.exports = {
  extends: ['eslint:recommended', 'airbnb-base'],
  rules: {
    'no-use-before-define': [0], // allow hoisting
    'no-console': 'off' // allow console.log
  }
};
