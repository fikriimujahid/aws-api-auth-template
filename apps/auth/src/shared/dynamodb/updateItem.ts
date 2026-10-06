import { DynamoDBDocumentClient, UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";

export type UpdateItemInput = Omit<UpdateCommandInput, "ReturnValues"> & {
  ReturnValues?: UpdateCommandInput["ReturnValues"];
};

export const updateItem = async <TResult extends Record<string, unknown>>(
  client: DynamoDBDocumentClient,
  input: UpdateItemInput
): Promise<TResult | undefined> => {
  const response = await client.send(
    new UpdateCommand({
      ...input,
      ReturnValues: input.ReturnValues ?? "ALL_NEW"
    })
  );

  return response.Attributes as TResult | undefined;
};
