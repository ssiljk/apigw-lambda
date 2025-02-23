// cdk/lib/api-gateway-stack.ts
// cdk/lib/http-api-gateway-stack.ts (Same as previous response)
import * as cdk from 'aws-cdk-lib';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigwv2_integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export class ApiGatewayStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function for the API endpoint
    const apiLambda = new lambda.Function(this, 'ApiLambda', {
      runtime: lambda.Runtime.DOTNET_8,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../ApiGatewayLambda/src/ApiGatewayLambda/publish')),
      handler: 'ApiGatewayLambda::ApiGatewayLambda.ApiGatewayLambda::FunctionHandler',
      architecture: lambda.Architecture.ARM_64, // For AOT
    });

    // Lambda function for the authorizer
    const authorizerLambda = new lambda.Function(this, 'AuthorizerLambda', {
      runtime: lambda.Runtime.DOTNET_8,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../ApiGatewayAuthorizerLambda/src/ApiGatewayAuthorizerLambda/publish')),
      handler: 'AuthorizerLambda::AuthorizerLambda.AuthorizerLambda::FunctionHandler',
      architecture: lambda.Architecture.ARM_64, // For AOT
    });

    // HTTP API Gateway
    const httpApi = new apigwv2.HttpApi(this, 'MyHttpApi', {
      apiName: 'My HTTP API',
    });

    // Lambda authorizer
    const authorizer = new apigwv2.HttpAuthorizer(this, 'MyHttpAuthorizer', {
      authorizerName: 'MyHttpAuthorizer',
      httpApi: httpApi,
      identitySource: ['$request.header.Authorization'],
      type: apigwv2.HttpAuthorizerType.LAMBDA,
    });

    // Lambda integration
    const apiLambdaIntegration = new apigwv2_integrations.HttpLambdaIntegration('ApiLambdaIntegration', apiLambda);

    // Route with authorizer
    httpApi.addRoutes({
      path: '/resource',
      methods: [apigwv2.HttpMethod.GET],
      integration: apiLambdaIntegration,
      authorizer: authorizer,
    });
  }
}