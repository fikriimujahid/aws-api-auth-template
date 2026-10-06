import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TranslateConfig } from "@aws-sdk/lib-dynamodb";

const defaultTranslateConfig: TranslateConfig = {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  }
};

export const createDynamoDocumentClient = (
  clientConfig: DynamoDBClientConfig = {},
  translateConfig: TranslateConfig = defaultTranslateConfig
): DynamoDBDocumentClient => {
  const client = new DynamoDBClient(clientConfig);
  return DynamoDBDocumentClient.from(client, translateConfig);
};
