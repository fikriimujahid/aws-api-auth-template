import { requestForgotPassword } from "../services/cognito";

export interface ForgotPasswordInput {
  email: string;
}

export const forgotPassword = async (input: ForgotPasswordInput) => {
  return requestForgotPassword(input.email);
};