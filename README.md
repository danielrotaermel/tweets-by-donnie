# tweets-by-donnie

requirements

```shell
❯ npm install -g serverless
```

config serverless

```shell
❯ serverless config --provider aws --key <yourkey> --secret <yoursecret>
```

```shell
❯ serverless create --template aws-nodejs --path twitter-crawler
```

## Serverless Instructions

1.  **Deploy a Service:**

    Use this when you have made changes to your Functions, Events or Resources in `serverless.yml` or you simply want to deploy all changes within your Service at the same time.

    ```shell
    serverless deploy -v
    ```

2.  **Deploy the Function:**

    Use this to quickly upload and overwrite your AWS Lambda code on AWS, allowing you to develop faster.

    ```shell
    serverless deploy function -f hello
    ```

3.  **Invoke the Function:**

    Invokes an AWS Lambda Function on AWS and returns logs.

    ```shell
    serverless invoke -f hello -l
    ```

4.  **Fetch the Function Logs:**

    Open up a separate tab in your console and stream all logs for a specific Function using this command.

    ```shell
    serverless logs -f hello -t
    ```

5.  **Remove the Service:**

    Removes all Functions, Events and Resources from your AWS account.

    ```shell
    serverless remove
    ```

## Development

```shell
sls invoke --function hello
```

```shell
sls invoke local --function hello
```
