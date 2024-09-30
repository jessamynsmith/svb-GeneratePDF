# SunValleyBronze.com AWS Lambda GeneratePDF

This repository is uploaded to the AWS Lambda function GeneratePDF.

It runs in Node 18.

The functionality is accessed from the squarespace site. Both catalog-collection.item
and swatch-collection.item have a .generateTearSheet class with a click listener that
makes an ajax call to the tearsheetUrl.

The Amazon tearsheetUrl is: https://7kscbhlqn1.execute-api.us-west-2.amazonaws.com/prod/GeneratePDF


### Local testing

1. Copy example-secrets.json into secrets.json and edit it to contain your AWS credentials.
1. In terminal:

    npm install
    npm install -g nodemon
    
1. Run the server:

    nodemon server.js
    
   1. Generating a PDF for a given item URL:

       https://www.sunvalleybronze.com/catalog/door-hardware/knobs/k-201-mushroom-door-knob

    Spec:
    curl -vk -X POST -H "Content-Type: application/json" --data '{"itemUrl": "https://www.sunvalleybronze.com/catalog/door-hardware/knobs/k-201-mushroom-door-knob"}' http://127.0.0.1:5001/GeneratePDF

    Tags testing:
    curl -vk -X POST -H "Content-Type: application/json" --data '{"itemUrl": "https://www.sunvalleybronze.com/catalog/door-hardware/levers/l-106-square-lever"}' http://127.0.0.1:5001/GeneratePDF
    
    Swatch:
    curl -X POST -H "Content-Type: application/json" --data '{"itemUrl": "https://www.sunvalleybronze.com/finishes/s"}' http://127.0.0.1:5001/GeneratePDF


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
