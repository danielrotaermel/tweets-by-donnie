

# clout-analysis



requirements

```
❯ npm install -g serverless 
```



config serverless

```
❯ serverless config --provider aws --key <yourkey> --secret <yoursecret> 
```

```
❯ serverless create --template aws-nodejs --path twitter-crawler 
```



## Serverless Instructions

1. **Deploy a Service:**

   Use this when you have made changes to your Functions, Events or Resources in `serverless.yml` or you simply want to deploy all changes within your Service at the same time.

   ```
   serverless deploy -v
   ```

2. **Deploy the Function:**

   Use this to quickly upload and overwrite your AWS Lambda code on AWS, allowing you to develop faster.

   ```
   serverless deploy function -f hello
   ```

3. **Invoke the Function:**

   Invokes an AWS Lambda Function on AWS and returns logs.

   ```
   serverless invoke -f hello -l
   ```

4. **Fetch the Function Logs:**

   Open up a separate tab in your console and stream all logs for a specific Function using this command.

   ```
   serverless logs -f hello -t
   ```

5. **Remove the Service:**

   Removes all Functions, Events and Resources from your AWS account.

   ```
   serverless remove
   ```



## Development

```
sls invoke --function hello
```

```
sls invoke local --function hello
```



