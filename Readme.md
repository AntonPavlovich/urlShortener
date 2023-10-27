## Read this for project's setup, build and deploy.

### Prerequisites

Install [aws-cli](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html#getting-started-install-instructions) and [serverless](https://www.serverless.com/framework/docs/getting-started) for this project usage.

### Environment variables

Provide .env file with such variables:
```dotenv
JWT_SECRET_ACCESS= # secret for the access key
JWT_SECRET_REFRESH= # secret for the refresh key
SOURCE_EMAIL= #the email that will be used as a source for link deactivated emails  
```

### Register source email address

Run command after providing SOURCE_EMAIL variable for email registration.
This email will be used as "from" for emails notification.

```bash
npm run init
```

### Building project

Run command
```bash
npm run build
```

### Deploy project

Run command. (This command also build project first)
```bash
npm run deploy
```

### Documentation 

Navigate to "**yourAppUrl**/stage/docs" to access it.
