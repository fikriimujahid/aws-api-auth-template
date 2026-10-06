import { confirmForgotPassword as confirmForgotPasswordWithCognito } from "../services/cognito";

export interface ConfirmForgotPasswordInput {
  email: string;
  code: string;
  newPassword: string;
}

export const confirmForgotPassword = async (input: ConfirmForgotPasswordInput) => {
  await confirmForgotPasswordWithCognito(input.email, input.code, input.newPassword);

  return {
    passwordResetConfirmed: true
  };
};