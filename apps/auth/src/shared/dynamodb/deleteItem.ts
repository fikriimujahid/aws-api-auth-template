import { DeleteCommand, DeleteCommandInput, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export type DeleteItemInput = Omit<DeleteCommandInput, "ReturnValues"> & {
  ReturnValues?: DeleteCommandInput["ReturnValues"];
};

export const deleteItem = async <TResult extends Record<string, unknown>>(
  client: DynamoDBDocumentClient,
  input: DeleteItemInput
): Promise<TResult | undefined> => {
  const response = await client.send(
    new DeleteCommand({
      ...input,
      ReturnValues: input.ReturnValues ?? "ALL_OLD"
    })
  );

  return response.Attributes as TResult | undefined;
};
