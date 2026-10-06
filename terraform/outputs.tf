output "region" {
  description = "AWS region used by Cognito."
  value       = module.auth.region
}

output "service_api_endpoint" {
  description = "API Gateway endpoint for the service API."
  value       = module.auth.api_endpoint
}

output "auth_api_lambda_function_name" {
  description = "Lambda function name backing the Auth API."
  value       = module.auth.lambda_function_names["auth"]
}

output "user_pool_id" {
  description = "Cognito User Pool ID."
  value       = module.auth.user_pool_id
}

output "user_pool_client_id" {
  description = "Cognito User Pool Client ID."
  value       = module.auth.user_pool_client_id
}

output "cognito_api_endpoint" {
  description = "Cognito Identity Provider API endpoint base URL."
  value       = module.auth.cognito_api_endpoint
}
