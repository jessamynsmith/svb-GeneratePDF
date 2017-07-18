# SunValleyBronze.com AWS Lambda GeneratePDF

This repository is uploaded to the AWS Lambda function GeneratePDF.

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


### Updating on Amazon 

1. Create a new zip using the script:

    sh scripts/create_deployment_zip.sh
    
1. Log in to the SVB Amazon console.
1. Ensure region is Oregon (Lambda functions are only available in Oregon, and the region must be set *before* you go to Lambda).
1. Go to Lambda section.
1. Select GeneratePDF function.
1. Under the Code tab, click Function Package and select the zip you made (it will be in the dist directory).
1. Click the Save button.
1. Verify the new code is working by going to sunvalleybronze.com and clicking a Tearsheet button.