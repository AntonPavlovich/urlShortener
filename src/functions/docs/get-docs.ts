import { Handler } from 'aws-lambda';
import { readFileSync } from 'fs';
import * as path from 'path';


export const getDocs: Handler = async event => {
  if (event.path === '/schema.yaml') {
    const filePath = path.resolve(__dirname, '..', '..', 'docs','schema.yaml');
    return {
      statusCode: 200,
      headers: {
        'content-type': 'text/yaml'
      },
      body: readFileSync(filePath, { encoding: 'utf-8' })
    }
  };

  const body = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Documentation</title>
            <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@3/swagger-ui.css">
        </head>
        <body>
            <div id="swagger"></div>
            <script src="https://unpkg.com/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
            <script>
              SwaggerUIBundle({
                dom_id: '#swagger',
                url: '/dev/schema.yaml'
            });
            </script>
        </body>
        </html>`;

  return {
    statusCode: 200,
    headers: {
      ['Content-Type']: 'text/html',
    },
    body
  };

}
