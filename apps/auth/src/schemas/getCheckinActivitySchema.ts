import { APIGatewayProxyEventV2 } from "aws-lambda";

interface GetCheckinActivityRequest {
  weekCount: number;
}

interface SafeParseSuccess<T> {
  success: true;
  data: T;
}

interface SafeParseFailure {
  success: false;
  error: string;
}

type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseFailure;

const parseWeekCount = (rawValue: string | undefined): number | null => {
  if (!rawValue || rawValue.trim().length === 0) {
    return 3;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsed)) {
    return null;
  }

  if (parsed < 1 || parsed > 12) {
    return null;
  }

  return parsed;
};

export const getCheckinActivitySchema = {
  safeParseEvent: (event: APIGatewayProxyEventV2): SafeParseResult<GetCheckinActivityRequest> => {
    const parsedWeekCount = parseWeekCount(event.queryStringParameters?.weekCount);

    if (parsedWeekCount === null) {
      return {
        success: false,
        error: "Invalid weekCount query parameter"
      };
    }

    return {
      success: true,
      data: {
        weekCount: parsedWeekCount
      }
    };
  }
};
