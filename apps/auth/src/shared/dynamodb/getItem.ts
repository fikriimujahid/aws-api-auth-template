import { DynamoDBDocumentClient, GetCommand, GetCommandInput } from "@aws-sdk/lib-dynamodb";

export const getItem = async <TResult extends Record<string, unknown>>(
  client: DynamoDBDocumentClient,
  input: GetCommandInput
): Promise<TResult | undefined> => {
  const response = await client.send(new GetCommand(input));
  return response.Item as TResult | undefined;
};
