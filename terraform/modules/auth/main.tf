locals {
  name_prefix                = "${var.project_name}-${var.environment}"
  enabled_identity_providers = distinct(var.enabled_identity_providers)
  google_enabled             = contains(local.enabled_identity_providers, "Google")

  cognito_uri = "https://cognito-idp.${data.aws_region.current.region}.amazonaws.com/${aws_cognito_user_pool.this.id}"

  lambda_invoke_arns = {
    for key, lambda_cfg in var.lambdas : key => aws_lambda_function.this[key].invoke_arn
  }

  all_integrations = merge(
    {
      for key, lambda_cfg in var.lambdas : key => {
        integration_uri = aws_lambda_function.this[key].invoke_arn
        function_name   = aws_lambda_function.this[key].function_name
      }
    },
    var.additional_integrations
  )

  lambda_environments = {
    for key, lambda_cfg in var.lambdas : key => merge(
      {
        COGNITO_API_ENDPOINT                = "https://cognito-idp.${data.aws_region.current.region}.amazonaws.com/"
        COGNITO_USER_POOL_CLIENT_ID         = aws_cognito_user_pool_client.api_google.id
        AUTH_ALLOWED_ORIGIN                 = var.auth_cookie_config.allowed_origin
        AUTH_COOKIE_DOMAIN                  = var.auth_cookie_config.cookie_domain
        AUTH_COOKIE_SECURE                  = tostring(var.auth_cookie_config.cookie_secure)
        AUTH_COOKIE_SAME_SITE               = var.auth_cookie_config.cookie_same_site
        AUTH_REFRESH_COOKIE_NAME            = var.auth_cookie_config.refresh_cookie_name
        AUTH_REFRESH_COOKIE_PATH            = var.auth_cookie_config.refresh_cookie_path
        AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS = tostring(var.auth_cookie_config.refresh_cookie_max_age_seconds)
      }
    )
  }
}

data "aws_region" "current" {}

# =============================================================================
# COGNITO
# =============================================================================

resource "aws_cognito_user_pool" "this" {
  name = "${local.name_prefix}-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  dynamic "schema" {
    for_each = var.user_pool_schema_attributes

    content {
      name                     = schema.value.name
      attribute_data_type      = schema.value.attribute_data_type
      developer_only_attribute = try(schema.value.developer_only_attribute, false)
      mutable                  = try(schema.value.mutable, true)
      required                 = try(schema.value.required, false)

      dynamic "string_attribute_constraints" {
        for_each = try(schema.value.string_attribute_constraints, null) == null ? [] : [schema.value.string_attribute_constraints]

        content {
          min_length = try(tostring(string_attribute_constraints.value.min_length), null)
          max_length = try(tostring(string_attribute_constraints.value.max_length), null)
        }
      }

      dynamic "number_attribute_constraints" {
        for_each = try(schema.value.number_attribute_constraints, null) == null ? [] : [schema.value.number_attribute_constraints]

        content {
          min_value = try(tostring(number_attribute_constraints.value.min_value), null)
          max_value = try(tostring(number_attribute_constraints.value.max_value), null)
        }
      }
    }
  }

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }

  dynamic "verification_message_template" {
    for_each = var.verification_message_template == null ? [] : [var.verification_message_template]

    content {
      default_email_option  = try(verification_message_template.value.default_email_option, null)
      email_message         = try(verification_message_template.value.email_message, null)
      email_message_by_link = try(verification_message_template.value.email_message_by_link, null)
      email_subject         = try(verification_message_template.value.email_subject, null)
      email_subject_by_link = try(verification_message_template.value.email_subject_by_link, null)
      sms_message           = try(verification_message_template.value.sms_message, null)
    }
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_cognito_user_pool_client" "this" {
  name         = "${local.name_prefix}-app-client"
  user_pool_id = aws_cognito_user_pool.this.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  supported_identity_providers         = ["COGNITO"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls
  access_token_validity                = try(var.token_validity.access_token_validity, null)
  id_token_validity                    = try(var.token_validity.id_token_validity, null)
  refresh_token_validity               = try(var.token_validity.refresh_token_validity, null)
  prevent_user_existence_errors        = "ENABLED"

  token_validity_units {
    access_token  = try(var.token_validity.token_validity_units.access_token, "hours")
    id_token      = try(var.token_validity.token_validity_units.id_token, "hours")
    refresh_token = try(var.token_validity.token_validity_units.refresh_token, "days")
  }
}

resource "aws_cognito_user_pool_domain" "this" {
  domain       = "${var.project_name}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.this.id
}

resource "aws_cognito_identity_provider" "google" {
  count = local.google_enabled ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.this.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
    authorize_scopes = "email profile openid"
  }

  attribute_mapping = {
    email = "email"
    name  = "name"
  }
}

resource "aws_cognito_user_pool_client" "api_google" {
  name         = "${local.name_prefix}-api-client"
  user_pool_id = aws_cognito_user_pool.this.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  supported_identity_providers         = local.enabled_identity_providers
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls
  access_token_validity                = try(var.token_validity.access_token_validity, null)
  id_token_validity                    = try(var.token_validity.id_token_validity, null)
  refresh_token_validity               = try(var.token_validity.refresh_token_validity, null)
  prevent_user_existence_errors        = "ENABLED"

  token_validity_units {
    access_token  = try(var.token_validity.token_validity_units.access_token, "hours")
    id_token      = try(var.token_validity.token_validity_units.id_token, "hours")
    refresh_token = try(var.token_validity.token_validity_units.refresh_token, "days")
  }

  depends_on = [aws_cognito_identity_provider.google]
}

# =============================================================================
# IAM
# =============================================================================

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "lambda_execution" {
  for_each = var.lambdas

  name               = "${each.value.name}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  for_each = var.lambdas

  role       = aws_iam_role.lambda_execution[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# =============================================================================
# LAMBDA
# =============================================================================

data "archive_file" "package" {
  for_each = var.lambdas

  type        = "zip"
  source_dir  = each.value.source_dir
  output_path = "${path.root}/.build-${each.value.name}.zip"
}

resource "aws_lambda_function" "this" {
  for_each = var.lambdas

  function_name = each.value.name
  description   = each.value.description
  role          = aws_iam_role.lambda_execution[each.key].arn
  runtime       = each.value.runtime
  handler       = each.value.handler

  filename         = data.archive_file.package[each.key].output_path
  source_code_hash = data.archive_file.package[each.key].output_base64sha256

  memory_size = each.value.memory_size
  timeout     = each.value.timeout
  publish     = each.value.publish

  environment {
    variables = local.lambda_environments[each.key]
  }

  tags = var.tags
}

# =============================================================================
# API GATEWAY
# =============================================================================

resource "aws_apigatewayv2_api" "this" {
  name                       = var.api_gateway.name
  description                = var.api_gateway.description
  protocol_type              = "HTTP"
  route_selection_expression = "$request.method $request.path"

  cors_configuration {
    allow_credentials = false
    allow_headers     = var.api_gateway.cors_allow_headers
    allow_methods     = var.api_gateway.cors_allow_methods
    allow_origins     = var.api_gateway.cors_allow_origins
    expose_headers    = var.api_gateway.cors_expose_headers
    max_age           = var.api_gateway.cors_max_age
  }

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "api_access" {
  name              = "/aws/apigateway/${var.api_gateway.name}-${replace(var.api_gateway.stage_name, "$", "")}"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_apigatewayv2_stage" "this" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = var.api_gateway.stage_name
  auto_deploy = true

  depends_on = [aws_cloudwatch_log_group.api_access]

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_access.arn
    format = jsonencode({
      requestId        = "$context.requestId"
      ip               = "$context.identity.sourceIp"
      requestTime      = "$context.requestTime"
      httpMethod       = "$context.httpMethod"
      routeKey         = "$context.routeKey"
      status           = "$context.status"
      protocol         = "$context.protocol"
      responseLength   = "$context.responseLength"
      integrationError = "$context.integrationErrorMessage"
    })
  }

  tags = var.tags
}

resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.this.id
  name             = "${local.name_prefix}-jwt-authorizer"
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.api_google.id]
    issuer   = local.cognito_uri
  }
}

resource "aws_apigatewayv2_integration" "this" {
  for_each = var.api_gateway.routes

  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_uri        = local.all_integrations[each.value.integration_key].integration_uri
  integration_method     = "POST"
  payload_format_version = try(each.value.payload_format_version, "2.0")
  timeout_milliseconds   = try(each.value.timeout_milliseconds, 30000)
}

resource "aws_apigatewayv2_route" "this" {
  for_each = var.api_gateway.routes

  api_id             = aws_apigatewayv2_api.this.id
  route_key          = each.value.route_key
  target             = "integrations/${aws_apigatewayv2_integration.this[each.key].id}"
  authorization_type = try(each.value.authorization_type, "NONE")
  authorizer_id      = try(each.value.authorization_type, "NONE") == "JWT" ? aws_apigatewayv2_authorizer.jwt.id : try(each.value.authorizer_id, null)
  operation_name     = try(each.value.operation_name, null)
}

# =============================================================================
# LAMBDA PERMISSIONS
# =============================================================================

resource "aws_lambda_permission" "allow_apigw_invoke" {
  for_each = local.all_integrations

  statement_id  = "AllowApiGatewayInvoke${replace(replace(replace(each.key, "-", "_"), ".", "_"), "/", "_")}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}
