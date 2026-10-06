# -----------------------------------------------------------------------------
# COGNITO
# -----------------------------------------------------------------------------
output "user_pool_id" {
  description = "ID of the Cognito user pool."
  value       = aws_cognito_user_pool.this.id
}

output "user_pool_arn" {
  description = "ARN of the Cognito user pool."
  value       = aws_cognito_user_pool.this.arn
}

output "user_pool_client_id" {
  description = "ID of the API-facing Cognito user pool client."
  value       = aws_cognito_user_pool_client.api_google.id
}

output "cognito_domain" {
  description = "Cognito domain prefix."
  value       = aws_cognito_user_pool_domain.this.domain
}

output "region" {
  description = "AWS region where Cognito resources are deployed."
  value       = data.aws_region.current.region
}

output "cognito_api_endpoint" {
  description = "Cognito Identity Provider API endpoint base URL."
  value       = "https://cognito-idp.${data.aws_region.current.region}.amazonaws.com/"
}

output "cognito_uri" {
  description = "Cognito API issuer URI for JWT/OIDC validation."
  value       = local.cognito_uri
}

# -----------------------------------------------------------------------------
# API GATEWAY
# -----------------------------------------------------------------------------
output "api_id" {
  description = "ID of the API Gateway HTTP API."
  value       = aws_apigatewayv2_api.this.id
}

output "api_endpoint" {
  description = "Base endpoint URL of the API Gateway HTTP API."
  value       = aws_apigatewayv2_api.this.api_endpoint
}

output "api_execution_arn" {
  description = "Execution ARN of the API Gateway HTTP API."
  value       = aws_apigatewayv2_api.this.execution_arn
}

output "api_stage_name" {
  description = "Stage name for the API Gateway."
  value       = aws_apigatewayv2_stage.this.name
}

# -----------------------------------------------------------------------------
# LAMBDA
# -----------------------------------------------------------------------------
output "lambda_function_names" {
  description = "Map of Lambda function names keyed by integration key."
  value = {
    for key, lambda in aws_lambda_function.this : key => lambda.function_name
  }
}

output "lambda_invoke_arns" {
  description = "Map of Lambda invoke ARNs keyed by integration key."
  value = {
    for key, lambda in aws_lambda_function.this : key => lambda.invoke_arn
  }
}
