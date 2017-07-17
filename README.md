# SunValleyBronze.com AWS Lambda GeneratePDF

The resources in this repository get to AWS as the Lambda function GeneratePDF.

The functionality is accessed from the squarespace site. Both catalog-collection.item
and swatch-collection.item have a .generateTearSheet class with a click listener that
makes an ajax call to the tearsheetUrl.

The tearsheetUrl is: https://7kscbhlqn1.execute-api.us-west-2.amazonaws.com/prod/GeneratePDF

### Local testing

1. Copy example-secrets.json into secrets.json and edit it to contain your AWS credentials.
1. npm install
1. Run the server:

    ```node server.js```
1. Generating a PDF for a given item URL:

    ```curl -X POST -H "Content-Type: application/json" --data '{"itemUrl": "http://www.sunvalleybronze.com/catalog/door-hardware/grip-handles/dh-6-d-handle"}' http://127.0.0.1:5000/GeneratePDF```
