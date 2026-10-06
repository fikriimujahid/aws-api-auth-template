module "auth" {
  source = "./modules/auth"

  project_name = var.project_name
  environment  = var.environment

  callback_urls                 = var.auth_cognito.callback_urls
  logout_urls                   = var.auth_cognito.logout_urls
  user_pool_schema_attributes   = var.auth_cognito.user_pool_schema_attributes
  token_validity                = try(var.auth_cognito.token_validity, {})
  enabled_identity_providers    = var.auth_cognito.enabled_identity_providers
  verification_message_template = try(var.auth_cognito.verification_message_template, null)
  google_client_id              = try(var.auth_cognito.google_client_id, null)
  google_client_secret          = try(var.auth_cognito.google_client_secret, null)
  auth_cookie_config            = try(var.service_api.auth_cookie_config, {})

  lambdas = {
    for key, lambda_cfg in var.service_api.lambdas : key => {
      name        = lambda_cfg.name
      description = try(lambda_cfg.description, null)
      source_dir  = lambda_cfg.source_dir
      handler     = lambda_cfg.handler
      runtime     = lambda_cfg.runtime
      memory_size = lambda_cfg.memory_size
      timeout     = lambda_cfg.timeout
      publish     = lambda_cfg.publish
    }
  }

  api_gateway = {
    name                = var.service_api.api_gateway.name
    description         = var.service_api.api_gateway.description
    stage_name          = var.service_api.api_gateway.stage_name
    cors_allow_origins  = var.service_api.api_gateway.cors_allow_origins
    cors_allow_methods  = var.service_api.api_gateway.cors_allow_methods
    cors_allow_headers  = var.service_api.api_gateway.cors_allow_headers
    cors_expose_headers = var.service_api.api_gateway.cors_expose_headers
    cors_max_age        = var.service_api.api_gateway.cors_max_age
    routes              = var.service_api.api_gateway.routes
  }

  tags = var.tags
}
